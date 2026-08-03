export const getPagination = (query) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const from = (page - 1) * limit;

  return { page, limit, from, to: from + limit - 1 };
};

export const createPagination = (page, limit, count) => {
  return {
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
};
