import { useMemo, useState } from "react";

export const usePagination = (items, pageSize = 10) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  const nextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

  const previousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  return {
    currentPage,
    nextPage,
    pageSize,
    paginatedItems,
    previousPage,
    setPage,
    totalPages,
  };
};
