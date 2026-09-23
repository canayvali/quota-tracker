import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, or } from 'drizzle-orm';

export async function getUserByEmail(email: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const result = await db.select().from(users).where(eq(users.email, normalized));
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw new Error('Failed to get user by email');
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(or(eq(users.uid, uid), eq(users.email, uid.toLowerCase())));
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByUid:', error);
    throw new Error('Failed to get user by UID');
  }
}

export async function registerUserAccount(data: {
  uid?: string;
  email: string;
  password?: string;
  name: string;
  enrolledPrograms?: any;
  preferredLanguage?: string;
  theme?: string;
  hasCompletedProgramOnboarding?: boolean;
}) {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    const uid = data.uid || 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // Check if user already exists
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        password: data.password || null,
        name: data.name || normalizedEmail.split('@')[0],
        enrolledPrograms: data.enrolledPrograms || [],
        preferredLanguage: data.preferredLanguage || 'tr',
        theme: data.theme || 'light',
        hasCompletedProgramOnboarding: data.hasCompletedProgramOnboarding ?? false,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in registerUserAccount:', error);
    throw error;
  }
}

export async function authenticateUserAccount(email: string, passwordAttempt: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return null;
    }

    // Direct password match (or support OAuth accounts without password)
    if (user.password && user.password !== passwordAttempt) {
      return null;
    }

    // Update last login timestamp
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    return user;
  } catch (error) {
    console.error('Error in authenticateUserAccount:', error);
    throw new Error('Authentication query failed');
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  enrolledPrograms?: any,
  preferredLanguage = 'tr',
  theme = 'light',
  hasCompletedProgramOnboarding = false,
  password?: string
) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        password: password || null,
        name: name || normalizedEmail.split('@')[0],
        enrolledPrograms: enrolledPrograms || [],
        preferredLanguage,
        theme,
        hasCompletedProgramOnboarding,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          ...(password ? { password } : {}),
          ...(name ? { name } : {}),
          ...(enrolledPrograms ? { enrolledPrograms } : {}),
          lastLoginAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to get or create user');
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<{
    name: string;
    password?: string;
    enrolledPrograms: any;
    preferredLanguage: string;
    theme: string;
    hasCompletedProgramOnboarding: boolean;
  }>
) {
  try {
    const result = await db
      .update(users)
      .set(updates)
      .where(or(eq(users.uid, uid), eq(users.email, uid.toLowerCase())))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Failed to update user profile');
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}
