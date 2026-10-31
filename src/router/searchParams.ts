/**
 * 查询参数读写工具：页面把常用状态（视图、范围、锚点日期）以查询参数作为唯一来源，
 * 刷新、复制链接、切换标签页时都能恢复同样的界面状态。
 */

/** 读取枚举型参数，值不在允许集合内时回退默认值。 */
export function readEnumParam<T extends string>(
  search: string,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = new URLSearchParams(search).get(key);
  return allowed.find((item) => item === value) ?? fallback;
}

/** 批量写入参数并返回新的查询串；值为 null 时删除该参数（保持地址简洁）。 */
export function updateSearchParams(
  search: string,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
