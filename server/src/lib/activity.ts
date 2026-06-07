import { ActivityLog } from '../models/ActivityLog';
import { Types } from 'mongoose';

export const logAdminActivity = async (
  adminId: string | Types.ObjectId,
  adminName: string,
  action: string,
  details: string,
  ipAddress?: string
): Promise<void> => {
  try {
    await ActivityLog.create({
      admin: adminId,
      adminName,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};
