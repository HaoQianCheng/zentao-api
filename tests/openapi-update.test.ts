import { afterEach, expect, test } from 'bun:test';
import { ZentaoClient, getModule, getModuleAction, request, setGlobalOptions } from '../src/index';
import { resetModuleDefinitions } from '../src/modules/registry';
import { resolveActionRequest } from '../src/modules/resolve';

afterEach(() => {
  resetModuleDefinitions();
  setGlobalOptions({ version: undefined, recPerPage: undefined, client: undefined });
});

test('structured filters keep their full field descriptions without scalar options', () => {
  const filters = getModuleAction('user', 'list')!.params!.find(param => param.name === 'filters')!;
  expect(filters).toMatchObject({ type: 'array', style: 'deepObject', explode: true });
  expect(filters.options).toBeUndefined();
  expect(filters.defaultValue).toBeUndefined();
  expect(filters.description).toContain('role(职位，枚举：dev 研发');
  expect(filters.description).toContain('gender(性别，枚举：m 男 | f 女)');
});

test('activity lists leave server defaults unset and forward explicit browse types', () => {
  const module = getModule('my')!;
  const actions = module.actions.filter(action => action.name.startsWith('activity'));
  expect(actions).toHaveLength(13);
  for (const action of actions) {
    expect(resolveActionRequest(module, action.name).query).not.toHaveProperty('browseType');
    expect(resolveActionRequest(module, action.name, { browseType: 'openedBy' }).query)
      .toMatchObject({ browseType: 'openedBy' });
  }
});

test('workflow definitions coexist with contract actions and preserve child paths and JSON writes', async () => {
  const received: Array<{ method: string; path: string; body?: unknown }> = [];
  const server = Bun.serve({ port: 0, async fetch(req) {
    const path = new URL(req.url).pathname;
    received.push({ method: req.method, path, ...(req.method !== 'GET' ? { body: await req.json() } : {}) });
    return Response.json(req.method === 'GET' ? { status: 'success', fields: [{ id: 8, field: 'name' }] } : { status: 'success', id: 8 });
  } });
  try {
    setGlobalOptions({ version: '22.7' });
    const client = new ZentaoClient(server.url.href);
    await request('workflow/createFlow', { module: 'contract', name: '合同' }, { client });
    expect((await request('workflow/fields', { module: 'contract' }, { client })).data).toEqual([{ id: 8, field: 'name' }]);
    await request('workflow/setActionJS', { actionID: 8, js: 'return true;' }, { client });
    expect(received).toEqual([
      { method: 'POST', path: '/api.php/v2/workflows', body: { module: 'contract', name: '合同' } },
      { method: 'GET', path: '/api.php/v2/workflows/contract/fields' },
      { method: 'PUT', path: '/api.php/v2/workflowactions/8/setJS', body: { js: 'return true;' } },
    ]);
    expect(getModuleAction('workflow', 'list')!.path).toBe('/workflow/contract');
    expect(getModuleAction('workflow', 'create')!.path).toBe('/workflow/contract');
    for (const name of ['fields', 'actions', 'labels', 'tables']) {
      expect(resolveActionRequest(getModule('workflow')!, name, { module: 'contract' }).path)
        .toBe(`/workflows/contract/${name}`);
    }
  } finally { server.stop(true); }
});

test('relation candidates extract objects and pagination while raw mode preserves relationPairs', async () => {
  const received: Array<{ path: string; query: Record<string, string> }> = [];
  const result = { status: 'success', objects: [{ id: 3, title: '任务' }], relationPairs: { implements: '实现' }, pager: { pageID: 2, recPerPage: 5, recTotal: 6 } };
  const server = Bun.serve({ port: 0, fetch(req) {
    const url = new URL(req.url);
    received.push({ path: url.pathname, query: Object.fromEntries(url.searchParams) });
    return Response.json(result);
  } });
  try {
    setGlobalOptions({ version: '22.7' });
    const client = new ZentaoClient(server.url.href);
    const params = { objectType: 'story', objectID: 1, relatedObjectType: 'task', browseType: 'all', pageID: 2, recPerPage: 5 };
    const response = await request('relation/candidates', params, { client });
    expect(response.data).toEqual(result.objects);
    expect(response.pager).toMatchObject({ page: 2, recPerPage: 5, total: 6 });
    expect(received[0]).toEqual({ path: '/api.php/v2/relations/story/1/candidates/task', query: { browseType: 'all', pageID: '2', recPerPage: '5' } });
    expect(await request('relation/candidates', params, { client, raw: true })).toEqual(result);
  } finally { server.stop(true); }
});

test('resource calendars preserve object results and query parameters on a get action', async () => {
  const calendar = { users: { admin: { hours: 8 } }, days: ['2026-10-14'] };
  let query: Record<string, string> = {};
  const server = Bun.serve({ port: 0, fetch(req) {
    query = Object.fromEntries(new URL(req.url).searchParams);
    return Response.json({ status: 'success', resourceCalendars: calendar });
  } });
  try {
    setGlobalOptions({ version: '22.7' });
    const client = new ZentaoClient(server.url.href);
    const response = await request('resourcecalendar/get', { type: 'person', mode: 'done', accounts: 'admin', projectID: 2, depts: '1,2' }, { client });
    expect(response.data).toEqual(calendar);
    expect(query).toEqual({ type: 'person', mode: 'done', accounts: 'admin', projectID: '2', depts: '1,2' });
    expect(getModuleAction('resourcecalendar', 'get')!.pagerGetter).toBeUndefined();
  } finally { server.stop(true); }
});

test('my searches and unfinished todos send documented parameters and case-sensitive defaults', async () => {
  const received: Array<Record<string, string>> = [];
  const server = Bun.serve({ port: 0, fetch(req) {
    received.push(Object.fromEntries(new URL(req.url).searchParams));
    return Response.json({ status: 'success', bugs: [], todos: [], reviewissues: [] });
  } });
  try {
    setGlobalOptions({ version: '22.7' });
    const client = new ZentaoClient(server.url.href);
    await request('my/bugs', {}, { client });
    await request('my/bugs', { browseType: 'bysearch', param: '12' }, { client });
    await request('my/todos', { browseType: 'undone', status: 'undone' }, { client });
    await request('my/reviewIssues', { browseType: 'bysearch', param: '13' }, { client });
    expect(received[0]).toMatchObject({ browseType: 'assignedTo' });
    expect(received[1]).toMatchObject({ browseType: 'bysearch', param: '12' });
    expect(received[2]).toMatchObject({ browseType: 'undone', status: 'undone' });
    expect(received[3]).toMatchObject({ browseType: 'bysearch', param: '13' });
    expect(getModuleAction('my', 'bugs')!.params!.find(p => p.name === 'browseType')!.options)
      .toContainEqual({ value: 'assignedTo', label: '指派给我' });
  } finally { server.stop(true); }
});

test.each([
  ['process', 'processes', 'processList'],
  ['auditplan', 'auditplans', 'auditplans'],
  ['nc', 'ncs', 'ncs'],
  ['opportunity', 'opportunities', 'opportunities'],
])('%s lists resolve both project and execution scopes', (moduleName, resource, getter) => {
  const module = getModule(moduleName)!;
  expect(resolveActionRequest(module, 'list', { projectID: 2 }).path).toBe(`/projects/2/${resource}`);
  expect(resolveActionRequest(module, 'list', { executionID: 3 }).path).toBe(`/executions/3/${resource}`);
  expect(getModuleAction(moduleName, 'list')!.resultGetter).toBe(getter);
});
