const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * HTML 문자열에 넣을 텍스트 이스케이프
 * - ECharts tooltip formatter는 HTML 문자열을 그대로 렌더링하므로,
 *   외부 데이터(작품 제목 등)는 반드시 이스케이프해서 넣는다.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}
