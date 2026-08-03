import { api } from "@/services/api";

export const discountService = {
  getActive: () => api.get("/discounts/active"),
  validate: (payload) => api.post("/discounts/validate", payload),
};
