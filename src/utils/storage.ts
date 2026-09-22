import { ClassMonitor, EmailSenderConfig, GlobalSettings, UserAccount } from '../types';

const STORAGE_KEY_MONITORS = 'crn_quota_monitors_v4';
const STORAGE_KEY_SETTINGS = 'crn_quota_settings_v4';
const STORAGE_KEY_EMAIL_CONFIG = 'crn_quota_email_config_v4';
const STORAGE_KEY_ADMIN_AUTH = 'crn_quota_admin_auth_v4';
const STORAGE_KEY_USERS = 'crn_quota_users_v1';
const STORAGE_KEY_CURRENT_USER = 'crn_quota_current_user_v1';

export const DEFAULT_QUOTA_SOURCE_URL = 'https://obs.itu.edu.tr/public/DersProgram';
export const ADMIN_PASSWORD = 'HelloWorld';

// Start from a completely blank list of classes - no fake classes
export const INITIAL_MONITORS: ClassMonitor[] = [];

export const INITIAL_SETTINGS: GlobalSettings = {
  autoRefreshActive: true,
  autoRefreshInterval: 45, // seconds
  soundAlert: true,
  defaultEmail: 'ahmetcanayvali@gmail.com',
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
  smtpPassword: 'xsmtpsib-d38db62788b3cffbc0ec7eb1d05453633fc71731870670d9fceed4dcea692cf1-WY7mckdl4MC0VvJ8',
  isReady: true,
  notes: 'Brevo SMTP Relay configured for automated student quota dispatch.'
};

// Initial sample student account
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-itu-1',
    name: 'Ahmet Can Ayvalı',
    email: 'ahmetcanayvali@gmail.com',
    password: 'password123',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
];

export function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
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
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
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
    if (parsed.smtpHost === 'smtp.itu.edu.tr' || !parsed.smtpPassword || parsed.smtpPassword === '••••••••••••••••') {
      const updated = { ...INITIAL_EMAIL_CONFIG, ...parsed, ...INITIAL_EMAIL_CONFIG };
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
