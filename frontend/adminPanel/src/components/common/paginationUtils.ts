/**
 * Builds a sliding window of page numbers centred on the current page, so the
 * pagination controls keep a constant width across pages.
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  windowSize = 5,
): number[] {
  const size = Math.min(windowSize, totalPages);
  let start = 1;

  if (totalPages > windowSize) {
    if (currentPage <= 3) start = 1;
    else if (currentPage >= totalPages - 2) start = totalPages - windowSize + 1;
    else start = currentPage - Math.floor(windowSize / 2);
  }

  return Array.from({ length: size }, (_, i) => start + i);
}
