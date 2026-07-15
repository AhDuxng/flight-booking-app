import { api } from "../../services/api";

const airportService = {
  getAll: () => api.get("/airports"),
};

export default airportService;
