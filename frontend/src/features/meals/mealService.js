import { api } from "@/services/api";

export const mealService = {
  getOptions: (params) => api.get("/meals", { params }),
};
