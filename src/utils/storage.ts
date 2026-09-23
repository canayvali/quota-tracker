import { AppLanguage, AppTheme, ClassMonitor, EmailSenderConfig, GlobalSettings, TrackedCourseGroup, UserAccount } from '../types';

const STORAGE_KEY_MONITORS = 'crn_quota_monitors_v4';
const STORAGE_KEY_SETTINGS = 'crn_quota_settings_v4';
const STORAGE_KEY_EMAIL_CONFIG = 'crn_quota_email_config_v4';
const STORAGE_KEY_ADMIN_AUTH = 'crn_quota_admin_auth_v4';
const STORAGE_KEY_USERS = 'crn_quota_users_v1';
const STORAGE_KEY_CURRENT_USER = 'crn_quota_current_user_v1';
const STORAGE_KEY_THEME = 'crn_quota_theme_v1';
const STORAGE_KEY_COURSE_GROUPS = 'crn_quota_course_groups_v5';

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

// Default registered account for Ahmet Can Ayvalı
export const DEFAULT_USER_ACCOUNT: UserAccount = {
  id: 'usr-ahmet-can-ayvali',
  name: 'Ahmet Can Ayvalı',
  email: 'ahmetcanayvali@gmail.com',
  password: 'password123',
  isVerified: true,
  preferredLanguage: 'tr',
  theme: 'light',
  enrolledPrograms: [
    {
      code: 'CEV_LS',
      nameTr: 'Çevre Mühendisliği Lisans (%30 İngilizce)',
      nameEn: 'Environmental Engineering B.S. (30% English)',
      degreeType: 'lisans',
      faculty: 'İnşaat Fakültesi'
    },
    {
      code: 'BLG_LS',
      nameTr: 'Bilgisayar Mühendisliği Lisans (%30 İngilizce)',
      nameEn: 'Computer Engineering B.S. (30% English)',
      degreeType: 'lisans',
      faculty: 'Bilgisayar ve Bilişim Fakültesi'
    },
    {
      code: 'SUR_YD',
      nameTr: 'Sürdürülebilirlik Yandal Programı',
      nameEn: 'Sustainability Minor Program',
      degreeType: 'yandal',
      faculty: 'Disiplinlerarası Yandal'
    }
  ],
  hasCompletedProgramOnboarding: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  lastLoginAt: new Date().toISOString()
};

export const INITIAL_USERS: UserAccount[] = [DEFAULT_USER_ACCOUNT];

export function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    const users: UserAccount[] = JSON.parse(raw);
    // Ensure Ahmet Can Ayvalı's account is preserved in saved accounts list
    if (!users.some((u) => u.email && u.email.toLowerCase() === DEFAULT_USER_ACCOUNT.email.toLowerCase())) {
      users.unshift(DEFAULT_USER_ACCOUNT);
      saveUsers(users);
    }
    return users;
  } catch {
    return INITIAL_USERS;
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
      saveCurrentUser(DEFAULT_USER_ACCOUNT);
      return DEFAULT_USER_ACCOUNT;
    }
    const user: UserAccount = JSON.parse(raw);
    return user;
  } catch {
    return DEFAULT_USER_ACCOUNT;
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

export function loadMonitors(): ClassMonitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MONITORS);
    if (!raw) {
      saveMonitors(INITIAL_MONITORS);
      return INITIAL_MONITORS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MONITORS;
  }
}

export function saveMonitors(monitors: ClassMonitor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MONITORS, JSON.stringify(monitors));
  } catch {
    // quota exceeded or privacy mode
  }
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
    if (
      parsed.smtpHost === 'smtp.itu.edu.tr' ||
      !parsed.smtpPassword ||
      parsed.smtpPassword === '••••••••••••••••' ||
      parsed.smtpPassword.startsWith('xsmtpsib-')
    ) {
      const updated = { ...INITIAL_EMAIL_CONFIG, ...parsed, smtpPassword: INITIAL_EMAIL_CONFIG.smtpPassword };
      saveEmailConfig(updated);
      return updated;
    }
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
  try {
    return sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuth(authenticated: boolean): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    }
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

export function loadTrackedCourseGroups(): TrackedCourseGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSE_GROUPS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTrackedCourseGroups(groups: TrackedCourseGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COURSE_GROUPS, JSON.stringify(groups));
  } catch {
    // ignore
  }
}
