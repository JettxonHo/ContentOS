import { describe, expect, it } from 'vitest';

import { formatZhDate, SOURCE_ROLE_LABEL, UI_COPY } from './ui-copy';

describe('zh-CN UI copy', () => {
  it('keeps the bounded stage and artifact vocabulary centralized', () => {
    expect(Object.values(UI_COPY.stage)).toEqual(['项目信息', '资料', '研究', '观点与文章', '小红书']);
    expect(UI_COPY.artifact).toMatchObject({
      workingCopy: '当前草稿',
      checkpoint: '保存为版本',
      approve: '批准此版本',
    });
    expect(SOURCE_ROLE_LABEL).toEqual({ primary: '主资料', supporting: '补充资料' });
  });

  it('formats dates with stable Chinese workspace numerals', () => {
    expect(formatZhDate(new Date(2026, 7, 13, 16, 41))).toBe('2026-08-13 16:41');
  });
});
