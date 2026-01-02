/**
 * 分页工具函数
 * 生成智能分页页码数组，避免显示过多页码
 */

export type PaginationPage = number | 'ellipsis';

/**
 * 生成分页页码数组
 * @param currentPage 当前页码（从1开始）
 * @param totalPages 总页数
 * @param maxVisible 最大可见页码数（不包括省略号和首尾页，默认5）
 * @returns 页码数组，包含数字和 'ellipsis'（省略号）
 * 
 * @example
 * getPaginationPages(1, 10) // [1, 2, 3, 4, 5, 'ellipsis', 10]
 * getPaginationPages(5, 10) // [1, 'ellipsis', 3, 4, 5, 6, 7, 'ellipsis', 10]
 * getPaginationPages(10, 10) // [1, 'ellipsis', 6, 7, 8, 9, 10]
 */
export function getPaginationPages(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): PaginationPage[] {
  if (totalPages <= 0) {
    return [];
  }

  // 如果总页数很少，直接返回所有页码
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PaginationPage[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // 总是显示第一页
  pages.push(1);

  // 计算中间部分的起始和结束页码
  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  // 如果当前页靠近开头，调整结束页码
  if (currentPage <= halfVisible + 1) {
    endPage = Math.min(maxVisible + 1, totalPages - 1);
  }

  // 如果当前页靠近结尾，调整起始页码
  if (currentPage >= totalPages - halfVisible) {
    startPage = Math.max(2, totalPages - maxVisible);
  }

  // 如果起始页码和第一页之间有间隔，添加省略号
  if (startPage > 2) {
    pages.push('ellipsis');
  }

  // 添加中间页码
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // 如果结束页码和最后一页之间有间隔，添加省略号
  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }

  // 总是显示最后一页（如果总页数大于1）
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

