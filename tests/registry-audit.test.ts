import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

function audit(paths: Record<string, unknown>, actions: unknown[], map: Record<string, unknown> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'zentao-registry-audit-'));
  try {
    const script = join(root, '.agents/skills/update-openapi-registry/scripts/audit-generated-registry.ts');
    mkdirSync(dirname(script), { recursive: true });
    mkdirSync(join(root, 'src/modules'), { recursive: true });
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'data'));
    writeFileSync(script, readFileSync(new URL('../.agents/skills/update-openapi-registry/scripts/audit-generated-registry.ts', import.meta.url)));
    writeFileSync(join(root, 'src/modules/generated.ts'), `export const BUILTIN_MODULES = ${JSON.stringify([{ name: 'widget', actions }])};`);
    writeFileSync(join(root, 'scripts/zentao-api-map.json'), JSON.stringify(map));
    writeFileSync(join(root, 'data/zentao-openapi.json'), JSON.stringify({ paths }));
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const operation = { get: { tags: ['Widget'] } };
const scopedPaths = {
  '/projects/{projectID}/widgets': operation,
  '/executions/{executionID}/widgets': operation,
};
const scopedAction = {
  name: 'list', method: 'get', path: '/{scope}/{scopeID}/widgets', resultGetter: 'widgets',
  pathParams: { scope: { options: [{ value: 'projects' }, { value: 'executions' }] } },
};

test('coverage audit accounts for direct actions and every merged scope, excluding Token', () => {
  const result = audit({ ...scopedPaths, '/widgets/{id}': operation, '/tokens': { post: { tags: ['Token'] } } }, [
    scopedAction, { name: 'get', method: 'get', path: '/widgets/{id}', resultGetter: 'widget' },
  ]);
  expect(result.status, result.output).toBe(0);
  expect(result.output).toContain('3 non-Token OpenAPI operations: 1 direct, 2 merged, 0 uncovered; 1 Token excluded');
});

test('coverage audit rejects a scoped list hidden by a top-level list', () => {
  const result = audit({ ...scopedPaths, '/widgets': operation }, [
    { name: 'list', method: 'get', path: '/widgets', resultGetter: 'widgets' },
  ]);
  expect(result.status).toBe(1);
  expect(result.output).toContain('unmapped scoped list');
  expect(result.output).toContain('2 uncovered');
});

test('coverage audit rejects a missing scope option instead of counting it as merged', () => {
  const result = audit(scopedPaths, [{ ...scopedAction, pathParams: { scope: { options: [{ value: 'projects' }] } } }]);
  expect(result.status).toBe(1);
  expect(result.output).toContain('does not expose scope "executions"');
  expect(result.output).toContain('1 merged, 1 uncovered');
});

test('coverage audit rejects missing tags, incompatible children, and unresolved mappings', () => {
  const missingTag = audit({ '/widgets/{id}': { get: {} } }, []);
  expect(missingTag.status).toBe(1);
  expect(missingTag.output).toContain('1 uncovered');
  const incompatible = audit({ '/projects/{projectID}/widgets': operation, '/executions/{executionID}/otherWidgets': operation }, [scopedAction]);
  expect(incompatible.status).toBe(1);
  expect(incompatible.output).toContain('incompatible scoped lists');
  const unresolved = audit({ '/widgets': operation }, [], { 'get /widgets': { name: 'all' } });
  expect(unresolved.status).toBe(1);
  expect(unresolved.output).toContain('expected widget-all');
});
