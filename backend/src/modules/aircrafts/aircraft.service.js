import aircraftQueries from './aircraft.queries.js';

/**
 * Lấy danh sách máy bay
 */
export const getAircraftsService = async () => {
  return await aircraftQueries.getAllAircrafts();
};

/**
 * Lấy chi tiết máy bay theo ID
 */
export const getAircraftByIdService = async (id) => {
  const aircraft = await aircraftQueries.getAircraftById(id);
  if (!aircraft) {
    const error = new Error('Không tìm thấy thông tin máy bay này.');
    error.statusCode = 404;
    throw error;
  }
  return aircraft;
};

/**
 * Thêm máy bay mới (Kiểm tra trùng mã code)
 */
export const createAircraftService = async (data) => {
  const existing = await aircraftQueries.getAircraftByCode(data.code);
  if (existing) {
    const error = new Error('Mã máy bay (code) này đã tồn tại trong hệ thống.');
    error.statusCode = 400;
    throw error;
  }
  return await aircraftQueries.createAircraft(data);
};

/**
 * Cập nhật thông tin máy bay
 */
export const updateAircraftService = async (id, updates) => {
  await getAircraftByIdService(id); // Kiểm tra tồn tại
  if (updates.code) {
    const existing = await aircraftQueries.getAircraftByCode(updates.code);
    if (existing && existing.id !== id) {
      const error = new Error('Mã máy bay (code) này đã được sử dụng bởi máy bay khác.');
      error.statusCode = 400;
      throw error;
    }
  }
  return await aircraftQueries.updateAircraft(id, updates);
};

/**
 * Xóa máy bay
 */
export const deleteAircraftService = async (id) => {
  await getAircraftByIdService(id); // Kiểm tra tồn tại
  return await aircraftQueries.deleteAircraft(id);
};

export default {
  getAircraftsService,
  getAircraftByIdService,
  createAircraftService,
  updateAircraftService,
  deleteAircraftService,
};
