import { api } from "@/services/api";

export const discountService = {
  getEligible: (payload) => api.post("/discounts/eligible", payload),
  getActive: () => api.get("/discounts/active"),
  validate: (payload) => api.post("/discounts/validate", payload),
};
