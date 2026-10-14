import { afterEach, beforeEach, expect, test } from 'bun:test';
import { ZentaoClient, request, setGlobalOptions } from '../src/index';
import { resetModuleDefinitions } from '../src/modules/registry';

beforeEach(() => {
  resetModuleDefinitions();
  setGlobalOptions({ version: '22.7' });
});

afterEach(() => {
  resetModuleDefinitions();
  setGlobalOptions({ version: undefined });
});

const space = { id: 10, name: '研发空间', code: 'dev', desc: '', acl: 'open', auth: 'extend' };
const repos = [
  { id: 21, name: 'demo', url: { http: 'https://git.example.com/dev/demo.git', ssh: 'git@git.example.com:dev/demo.git' } },
  { id: 22, name: 'no-clone-url', url: {} },
];
const createParams = { space: 10, product: [12], name: 'demo' };
const sshParams = { name: 'coder', publicKey: 'ssh-ed25519 <test-public-key> coder' };

test('coder lists use the documented routes, pagination and result fields after a reset', async () => {
  const received: { method: string; path: string; query: Record<string, string>; token: string | null }[] = [];
  let emptyProduct = false;
  const server = Bun.serve({ port: 0, fetch(req) {
    const url = new URL(req.url);
    received.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), token: req.headers.get('Token') });
    if (url.pathname === '/api.php/v2/products/12/repos') return Response.json({ status: 'success', repos: emptyProduct ? [] : repos });
    const pageID = Number(url.searchParams.get('pageID'));
    return Response.json({
      status: 'success',
      [url.pathname.endsWith('/spaces') ? 'spaces' : 'repos']: pageID === 99 ? [] : url.pathname.endsWith('/spaces') ? [space] : repos,
      pager: { pageID, recPerPage: Number(url.searchParams.get('recPerPage')), recTotal: 35, pageTotal: 4 },
    });
  } });
  try {
    const client = new ZentaoClient({ baseUrl: server.url.href, token: 'test-token' });
    await expect(request('space', {}, { client })).resolves.toMatchObject({
      status: 'success', data: [space], pager: { total: 35, page: 1, recPerPage: 20 },
    });
    await expect(request('repo/list', { spaceID: 10, page: 2, orderBy: 'name_desc' }, { client, recPerPage: '10' }))
      .resolves.toMatchObject({ status: 'success', data: repos, pager: { total: 35, page: 2, recPerPage: 10 } });
    const productRepos = await request('product/repos', { productID: 12, pageID: 2, orderBy: 'name_desc' }, { client, recPerPage: '10' });
    expect(productRepos.data).toEqual(repos);
    expect(productRepos.pager).toBeUndefined();
    await expect(request('repo', { spaceID: 10, pageID: 99 }, { client }))
      .resolves.toMatchObject({ status: 'success', data: [], pager: { total: 35, page: 99, recPerPage: 20 } });
    await expect(request('space/list', { pageID: 99 }, { client }))
      .resolves.toMatchObject({ status: 'success', data: [], pager: { total: 35, page: 99, recPerPage: 20 } });
    emptyProduct = true;
    await expect(request('product/repos', { productID: 12 }, { client })).resolves.toMatchObject({ status: 'success', data: [] });
    expect(received).toEqual([
      { method: 'GET', path: '/api.php/v2/spaces', query: { pageID: '1', recPerPage: '20' }, token: 'test-token' },
      { method: 'GET', path: '/api.php/v2/spaces/10/repos', query: { pageID: '2', recPerPage: '10', orderBy: 'name_desc' }, token: 'test-token' },
      { method: 'GET', path: '/api.php/v2/products/12/repos', query: {}, token: 'test-token' },
      { method: 'GET', path: '/api.php/v2/spaces/10/repos', query: { pageID: '99', recPerPage: '20', orderBy: 'id_desc' }, token: 'test-token' },
      { method: 'GET', path: '/api.php/v2/spaces', query: { pageID: '99', recPerPage: '20' }, token: 'test-token' },
      { method: 'GET', path: '/api.php/v2/products/12/repos', query: {}, token: 'test-token' },
    ]);
  } finally { server.stop(true); }
});

test.each(['flat', 'object', 'json'])('coder writes send JSON bodies and preserve IDs and messages with %s input', async input => {
  const received: { method: string; path: string; contentType: string | null; body: unknown }[] = [];
  const created = { status: 'success', id: 21, message: '保存成功' };
  const sshCreated = { status: 'success', message: '保存成功' };
  const server = Bun.serve({ port: 0, async fetch(req) {
    const url = new URL(req.url);
    received.push({ method: req.method, path: url.pathname + url.search, contentType: req.headers.get('Content-Type'), body: await req.json() });
    return Response.json(url.pathname.endsWith('/repos') ? created : sshCreated);
  } });
  const paramsFor = (params: Record<string, unknown>) => input === 'flat' ? params : { data: input === 'json' ? JSON.stringify(params) : params };
  try {
    const client = new ZentaoClient(server.url.href);
    await expect(request('repo/create', paramsFor(createParams), { client }))
      .resolves.toMatchObject({ status: 'success', data: created, message: '保存成功' });
    const privateRepo = { ...createParams, name: 'demo_private', desc: '项目代码库', acl: 'private', members: ['alice', 'bob'] };
    await request('repo/create', paramsFor(privateRepo), { client });
    await expect(request('my/createSSH', paramsFor(sshParams), { client }))
      .resolves.toMatchObject({ status: 'success', data: '保存成功', message: '保存成功' });
    expect(received).toEqual([
      { method: 'POST', path: '/api.php/v2/repos', contentType: 'application/json', body: { ...createParams, desc: '', acl: 'open', members: [] } },
      { method: 'POST', path: '/api.php/v2/repos', contentType: 'application/json', body: privateRepo },
      { method: 'POST', path: '/api.php/v2/my/sshkeys', contentType: 'application/json', body: sshParams },
    ]);
    expect(await request('repo/create', paramsFor(createParams), { client, raw: true })).toEqual(created);
    expect(await request('my/createSSH', paramsFor(sshParams), { client, raw: true })).toEqual(sshCreated);
  } finally { server.stop(true); }
});

test('coder actions reject missing path and body fields before sending a request', async () => {
  let received = 0;
  const server = Bun.serve({ port: 0, fetch() { received++; return Response.json({ status: 'success' }); } });
  try {
    const client = new ZentaoClient(server.url.href);
    const cases: [string, Record<string, unknown>, string][] = [
      ['repo/list', {}, 'spaceID'],
      ['product/repos', {}, 'productID'],
      ['repo/create', { product: [12], name: 'demo' }, 'space'],
      ['repo/create', { space: 10, name: 'demo' }, 'product'],
      ['repo/create', { space: 10, product: [12] }, 'name'],
      ['my/createSSH', { publicKey: sshParams.publicKey }, 'name'],
      ['my/createSSH', { name: 'coder' }, 'publicKey'],
    ];
    for (const [name, params, field] of cases) {
      await expect(request(name, params, { client })).rejects.toMatchObject({ code: 'E_MISSING_PARAM', message: `Missing required parameter: ${field}` });
    }
    expect(received).toBe(0);
  } finally { server.stop(true); }
});

const actions: [string, Record<string, unknown>][] = [
  ['space/list', {}],
  ['repo/list', { spaceID: 10 }],
  ['repo/create', createParams],
  ['product/repos', { productID: 12 }],
  ['my/createSSH', sshParams],
];

test.each(actions)('%s retains business and form failures instead of reporting success', async (name, params) => {
  let result: unknown;
  const server = Bun.serve({ port: 0, fetch: () => Response.json(result) });
  try {
    const client = new ZentaoClient(server.url.href);
    const message = { publicKey: ['公钥格式错误'] };
    for (const status of [{ status: 'fail' }, { result: 'fail' }, { status: 'success', result: 'fail' }]) {
      result = { ...status, message };
      await expect(request(name, params, { client })).resolves.toMatchObject({ status: 'fail', rawMessage: message, raw: { ...status, status: 'fail', message } });
      await expect(request(name, params, { client, throwOnFail: true })).rejects.toMatchObject({ code: 'E_API_FAILED' });
      expect(await request(name, params, { client, raw: true })).toEqual(result);
    }
    for (result of [{ error: 'Access not allowed' }, {}, [], null, 'Saved']) {
      await expect(request(name, params, { client })).resolves.toMatchObject({ status: 'fail' });
    }
  } finally { server.stop(true); }
});

test.each(actions)('%s propagates HTTP errors and rejects non-JSON HTTP 200 responses', async (name, params) => {
  let response = new Response('Service unavailable', { status: 503 });
  const server = Bun.serve({ port: 0, fetch: () => response.clone() });
  try {
    const client = new ZentaoClient(server.url.href);
    for (const status of [400, 403, 404, 503]) {
      response = Response.json({ status: 'fail', message: 'Request failed' }, { status });
      await expect(request(name, params, { client })).rejects.toMatchObject({ code: 'E_HTTP_ERROR', details: { status } });
    }
    const responseText = 'ERROR: coder API not found.';
    response = new Response(responseText, { headers: { 'Content-Type': 'text/html' } });
    await expect(request(name, params, { client })).resolves.toMatchObject({ status: 'fail', raw: { httpStatus: 200, responseText } });
  } finally { server.stop(true); }
});
