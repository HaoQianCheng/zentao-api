import { describe, expect, test } from 'bun:test';
import { parseDescriptionOptions, requireMatchingScopedListValue } from '../scripts/update-registry';

test('finds options after informational parentheses and keeps nested labels', () => {
  expect(parseDescriptionOptions('状态，默认是assignedTo，字段名（区分大小写）。(assignedTo 指派给我 | openedBy 我创建的（含草稿）)'))
    .toMatchObject({
      defaultValue: 'assignedTo',
      options: [
        { value: 'assignedTo', label: '指派给我' },
        { value: 'openedBy', label: '我创建的（含草稿）' },
      ],
    });
  expect(parseDescriptionOptions('内容（纯说明）')).toEqual({
    description: '内容（纯说明）', defaultValue: undefined, options: undefined,
  });
});

test('does not invent a default from a reference to the server default', () => {
  expect(parseDescriptionOptions('贡献筛选类型，不传时使用禅道页面默认值。').defaultValue).toBeUndefined();
  expect(parseDescriptionOptions('状态，默认值为openedBy。').defaultValue).toBe('openedBy');
});

describe('registry generator scoped-list merge', () => {
  test('keeps matching response extractors', () => {
    expect(requireMatchingScopedListValue(['items', 'items'], 'widget', 'resultGetter'))
      .toBe('items');
    expect(requireMatchingScopedListValue([undefined, undefined], 'widget', 'pagerGetter'))
      .toBeUndefined();
  });

  test('rejects conflicting response extractors', () => {
    expect(() => requireMatchingScopedListValue(
      ['items', 'data'],
      'widget',
      'resultGetter',
    )).toThrow('Conflicting resultGetter for merged widget/list action.');
  });
});
