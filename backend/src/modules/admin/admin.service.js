import * as queries from './admin.queries.js';

export const getAdminLogs = async (limit, offset) => {
  return await queries.getAdminLogs(limit, offset);
};

export const getDashboardStats = async () => {
  return await queries.getDashboardStats();
};

export const logAction = async (adminId, action, targetId, targetType, metadata) => {
  return await queries.createLog({
    admin_id: adminId,
    action,
    target_id: targetId || null,
    target_type: targetType || null,
    metadata: metadata || null
  });
};
