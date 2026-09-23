import { db } from './index.ts';
import { monitors, trackedCourseGroups, quotaHistory } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getUserMonitors(userId: string) {
  try {
    return await db
      .select()
      .from(monitors)
      .where(eq(monitors.userId, userId))
      .orderBy(desc(monitors.createdAt));
  } catch (error) {
    console.error('Error in getUserMonitors:', error);
    return [];
  }
}

export async function getAllActiveMonitors() {
  try {
    return await db
      .select()
      .from(monitors)
      .where(eq(monitors.status, 'active'));
  } catch (error) {
    console.error('Error in getAllActiveMonitors:', error);
    return [];
  }
}

export async function getAllMonitors() {
  try {
    return await db
      .select()
      .from(monitors)
      .orderBy(desc(monitors.createdAt));
  } catch (error) {
    console.error('Error in getAllMonitors:', error);
    return [];
  }
}

export async function saveMonitor(data: typeof monitors.$inferInsert) {
  try {
    const result = await db
      .insert(monitors)
      .values(data)
      .onConflictDoUpdate({
        target: monitors.id,
        set: {
          ...data,
          lastChanged: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveMonitor:', error);
    throw new Error('Failed to save monitor');
  }
}

export async function updateMonitorQuota(
  id: string,
  capacity: number,
  enrolled: number,
  availableSeats: number
) {
  try {
    const result = await db
      .update(monitors)
      .set({
        totalCapacity: capacity,
        enrolled: enrolled,
        availableSeats: availableSeats,
        lastChecked: new Date(),
        lastChanged: new Date(),
      })
      .where(eq(monitors.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in updateMonitorQuota:', error);
    return null;
  }
}

export async function deleteMonitor(id: string, _userId?: string) {
  try {
    await db
      .delete(monitors)
      .where(eq(monitors.id, id));
    return { success: true };
  } catch (error) {
    console.error('Error in deleteMonitor:', error);
    throw new Error('Failed to delete monitor');
  }
}

export async function getUserTrackedGroups(userId: string) {
  try {
    return await db
      .select()
      .from(trackedCourseGroups)
      .where(eq(trackedCourseGroups.userId, userId))
      .orderBy(desc(trackedCourseGroups.createdAt));
  } catch (error) {
    console.error('Error in getUserTrackedGroups:', error);
    return [];
  }
}

export async function getAllActiveTrackedGroups() {
  try {
    return await db
      .select()
      .from(trackedCourseGroups)
      .where(eq(trackedCourseGroups.status, 'active'));
  } catch (error) {
    console.error('Error in getAllActiveTrackedGroups:', error);
    return [];
  }
}

export async function getAllTrackedGroups() {
  try {
    return await db
      .select()
      .from(trackedCourseGroups)
      .orderBy(desc(trackedCourseGroups.createdAt));
  } catch (error) {
    console.error('Error in getAllTrackedGroups:', error);
    return [];
  }
}

export async function saveTrackedGroup(data: typeof trackedCourseGroups.$inferInsert) {
  try {
    const result = await db
      .insert(trackedCourseGroups)
      .values(data)
      .onConflictDoUpdate({
        target: trackedCourseGroups.id,
        set: {
          ...data,
          lastChanged: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in saveTrackedGroup:', error);
    throw new Error('Failed to save tracked group');
  }
}

export async function updateTrackedGroupSections(
  id: string,
  sections: any,
  knownCrns: any
) {
  try {
    const result = await db
      .update(trackedCourseGroups)
      .set({
        sections,
        knownCrns,
        lastChecked: new Date(),
        lastChanged: new Date(),
      })
      .where(eq(trackedCourseGroups.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in updateTrackedGroupSections:', error);
    return null;
  }
}

export async function deleteTrackedGroup(id: string) {
  try {
    await db
      .delete(trackedCourseGroups)
      .where(eq(trackedCourseGroups.id, id));
    return { success: true };
  } catch (error) {
    console.error('Error in deleteTrackedGroup:', error);
    throw new Error('Failed to delete tracked group');
  }
}

export async function addQuotaHistoryEvent(data: typeof quotaHistory.$inferInsert) {
  try {
    const result = await db
      .insert(quotaHistory)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in addQuotaHistoryEvent:', error);
    return null;
  }
}
