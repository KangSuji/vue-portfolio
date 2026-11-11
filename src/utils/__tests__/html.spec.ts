import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../html';

describe('escapeHtml', () => {
  it('HTML 특수문자를 이스케이프한다', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });

  it('일반 텍스트는 그대로', () => {
    expect(escapeHtml('기생충 (2019)')).toBe('기생충 (2019)');
  });
});
