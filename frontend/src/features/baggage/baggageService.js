import { api } from "@/services/api";

export const baggageService = {
  getOptions: (params) => api.get("/baggage", { params }),
};
