import cron from 'node-cron';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Delete expired sessions from database
 * Industry standard: Run every hour
 */
export const DeleteExpiredSessions = async () => {
  try {
    const now = new Date();
    
    // Delete all sessions where expires_at is less than current time
    const result = await prisma.sessions.deleteMany({
      where: {
        expires_at: {
          lt: now  // lt = less than (expired)
        }
      }
    });
    
    if (result.count > 0) {
      logger.info(`Cron Job: Deleted ${result.count} expired sessions`);
    }
    
    return result.count;
  } catch (error) {
    logger.error('Cron Job Error: Failed to delete expired sessions', error);
    throw error;
  }
};