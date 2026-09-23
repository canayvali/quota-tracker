import { AppLanguage, AppTheme, ClassMonitor, EmailSenderConfig, GlobalSettings, TrackedCourseGroup, UserAccount } from '../types';

const STORAGE_KEY_SETTINGS = 'crn_quota_settings_v4';
const STORAGE_KEY_EMAIL_CONFIG = 'crn_quota_email_config_v4';
const STORAGE_KEY_ADMIN_AUTH = 'crn_quota_admin_auth_v4';
const STORAGE_KEY_USERS = 'crn_quota_users_v1';
const STORAGE_KEY_CURRENT_USER = 'crn_quota_current_user_v1';
const STORAGE_KEY_THEME = 'crn_quota_theme_v1';

// User-scoped storage prefix keys
const USER_MONITORS_PREFIX = 'crn_user_monitors_';
const USER_GROUPS_PREFIX = 'crn_user_groups_';

// Remove legacy unpartitioned storage keys to avoid cross-user state bleeding
try {
  localStorage.removeItem('crn_quota_monitors_v4');
  localStorage.removeItem('crn_quota_course_groups_v5');
  localStorage.removeItem('crn_quota_monitors_v3');
  localStorage.removeItem('crn_quota_course_groups_v4');
} catch {
  // ignore
}

export const DEFAULT_QUOTA_SOURCE_URL = 'https://obs.itu.edu.tr/public/DersProgram';
export const ADMIN_PASSWORD = 'HelloWorld';

// Start from a completely blank list of classes - no fake classes
export const INITIAL_MONITORS: ClassMonitor[] = [];

export const INITIAL_SETTINGS: GlobalSettings = {
  autoRefreshActive: true,
  autoRefreshInterval: 45, // seconds
  soundAlert: true,
  defaultEmail: 'emailadress@gmail.com',
  defaultQuotaUrl: DEFAULT_QUOTA_SOURCE_URL,
  adminPassword: ADMIN_PASSWORD
};

export const INITIAL_EMAIL_CONFIG: EmailSenderConfig = {
  provider: 'custom_smtp',
  senderAddress: 'ba7eed001@smtp-brevo.com',
  senderName: 'İTÜ OBS Quota Alert System',
  smtpHost: 'smtp-relay.brevo.com',
  smtpPort: 587,
  smtpUsername: 'ba7eed001@smtp-brevo.com',
  smtpPassword: 'bskD981CTehLLJb',
  isReady: true,
  notes: 'Brevo SMTP Relay configured for automated student quota dispatch.'
};

// No default pre-seeded user accounts - all users must sign up or sign in
export const INITIAL_USERS: UserAccount[] = [];

export function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      return [];
    }
    const users: UserAccount[] = JSON.parse(raw);
    return users.filter((u) => u.email !== 'ahmetcanayvali@gmail.com' && u.id !== 'usr-ahmet-can-ayvali');
  } catch {
    return [];
  }
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function loadCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!raw) {
      return null;
    }
    const user: UserAccount = JSON.parse(raw);
    // Discard any old hardcoded default account so user must freshly register/login
    if (user.id === 'usr-ahmet-can-ayvali' || user.email === 'ahmetcanayvali@gmail.com') {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  try {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    users[idx].password = newPassword;
    saveUsers(users);

    const curr = loadCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      curr.password = newPassword;
      saveCurrentUser(curr);
    }
    return true;
  } catch {
    return false;
  }
}

export function updateUserAccount(email: string, updates: Partial<UserAccount>): boolean {
  try {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;

    users[idx] = {
      ...users[idx],
      ...updates
    };
    saveUsers(users);

    const curr = loadCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      saveCurrentUser({
        ...curr,
        ...updates
      });
    }
    return true;
  } catch {
    return false;
  }
}

export function deleteUserAccount(email: string): boolean {
  try {
    const users = loadUsers().filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    saveUsers(users);
    const curr = loadCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      clearCurrentUser();
    }
    return true;
  } catch {
    return false;
  }
}

export function updateUserLanguage(email: string, language: AppLanguage): boolean {
  try {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx].preferredLanguage = language;
      saveUsers(users);
    }
    const curr = loadCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      curr.preferredLanguage = language;
      saveCurrentUser(curr);
    }
    return true;
  } catch {
    return false;
  }
}

export function saveCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch {
    // ignore
  }
}

export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } catch {
    // ignore
  }
}

export function getUserStorageKey(userKey?: string): string {
  if (!userKey) return 'anonymous';
  return userKey.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
}

export function loadUserMonitors(userKey?: string): ClassMonitor[] {
  if (!userKey) return [];
  try {
    const key = USER_MONITORS_PREFIX + getUserStorageKey(userKey);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserMonitors(userKey: string, monitors: ClassMonitor[]): void {
  if (!userKey) return;
  try {
    const key = USER_MONITORS_PREFIX + getUserStorageKey(userKey);
    localStorage.setItem(key, JSON.stringify(monitors));
  } catch {
    // quota exceeded or privacy mode
  }
}

// Backward compatibility helper
export function loadMonitors(): ClassMonitor[] {
  const curr = loadCurrentUser();
  if (!curr) return [];
  return loadUserMonitors(curr.email || curr.id);
}

export function saveMonitors(monitors: ClassMonitor[]): void {
  const curr = loadCurrentUser();
  if (!curr) return;
  saveUserMonitors(curr.email || curr.id, monitors);
}

export function loadUserTrackedCourseGroups(userKey?: string): TrackedCourseGroup[] {
  if (!userKey) return [];
  try {
    const key = USER_GROUPS_PREFIX + getUserStorageKey(userKey);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserTrackedCourseGroups(userKey: string, groups: TrackedCourseGroup[]): void {
  if (!userKey) return;
  try {
    const key = USER_GROUPS_PREFIX + getUserStorageKey(userKey);
    localStorage.setItem(key, JSON.stringify(groups));
  } catch {
    // ignore
  }
}

// Backward compatibility helper
export function loadTrackedCourseGroups(): TrackedCourseGroup[] {
  const curr = loadCurrentUser();
  if (!curr) return [];
  return loadUserTrackedCourseGroups(curr.email || curr.id);
}

export function saveTrackedCourseGroups(groups: TrackedCourseGroup[]): void {
  const curr = loadCurrentUser();
  if (!curr) return;
  saveUserTrackedCourseGroups(curr.email || curr.id, groups);
}

export function loadSettings(): GlobalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: GlobalSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadEmailConfig(): EmailSenderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAIL_CONFIG);
    if (!raw) {
      saveEmailConfig(INITIAL_EMAIL_CONFIG);
      return INITIAL_EMAIL_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_EMAIL_CONFIG, ...parsed };
  } catch {
    return INITIAL_EMAIL_CONFIG;
  }
}

export function saveEmailConfig(config: EmailSenderConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMAIL_CONFIG, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function checkAdminAuth(): boolean {
  return false;
}

export function setAdminAuth(_authenticated: boolean): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
  } catch {
    // ignore
  }
}

export function loadTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw === 'dark' || raw === 'light') return raw;
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // ignore
  }
}

export function updateUserTheme(email: string, theme: AppTheme): boolean {
  try {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx].theme = theme;
      saveUsers(users);
    }
    const curr = loadCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      curr.theme = theme;
      saveCurrentUser(curr);
    }
    return true;
  } catch {
    return false;
  }
}

// Background Cloud SQL API sync helpers
export async function syncUserDataFromCloudSql(userId: string, email?: string) {
  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (email) params.set('email', email);
    const res = await fetch(`/api/db/user-data?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Cloud SQL sync skipped or offline:', err);
  }
  return null;
}

export async function syncMonitorToCloudSql(monitor: ClassMonitor) {
  try {
    await fetch('/api/db/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monitor),
    });
  } catch (err) {
    console.warn('Failed to sync monitor to Cloud SQL:', err);
  }
}

export async function deleteMonitorFromCloudSql(id: string, userId?: string) {
  try {
    const url = userId
      ? `/api/db/monitors/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`
      : `/api/db/monitors/${encodeURIComponent(id)}`;
    await fetch(url, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete monitor from Cloud SQL:', err);
  }
}

export async function syncTrackedGroupToCloudSql(group: TrackedCourseGroup) {
  try {
    await fetch('/api/db/tracked-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
  } catch (err) {
    console.warn('Failed to sync group to Cloud SQL:', err);
  }
}

export async function deleteTrackedGroupFromCloudSql(id: string) {
  try {
    await fetch(`/api/db/tracked-groups/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete tracked group from Cloud SQL:', err);
  }
}

export async function syncUserProfileToCloudSql(user: UserAccount) {
  try {
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.id || user.email,
        email: user.email,
        name: user.name,
        enrolledPrograms: user.enrolledPrograms,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
        hasCompletedProgramOnboarding: user.hasCompletedProgramOnboarding,
      }),
    });
  } catch (err) {
    console.warn('Failed to sync user profile to Cloud SQL:', err);
  }
}

