export interface QuotaHistoryEvent {
  id: string;
  timestamp: string;
  type: 'increased' | 'decreased' | 'unchanged' | 'initial';
  oldAvailable: number;
  newAvailable: number;
  oldEnrolled: number;
  newEnrolled: number;
  emailDispatched: boolean;
  emailRecipient: string;
  emailSubject: string;
  notes?: string;
}

export type AlertTriggerPreference = 'any_change' | 'seats_opened_only' | 'waitlist_or_seats';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ClassMonitor {
  id: string;
  userId?: string;
  crn: string;
  courseCode: string;
  courseTitle: string;
  instructor: string;
  department?: string;
  targetUrl: string;
  notificationEmail: string;
  studentName?: string;
  status: 'active' | 'paused' | 'checking';
  totalCapacity: number;
  enrolled: number;
  availableSeats: number;
  waitlistCount?: number;
  waitlistCapacity?: number;
  lastChecked: string;
  lastChanged: string;
  createdAt: string;
  alertPreference: AlertTriggerPreference;
  checkIntervalSeconds: number;
  history: QuotaHistoryEvent[];
}

export interface EmailSenderConfig {
  senderAddress: string;
  senderName: string;
  provider: 'custom_smtp' | 'resend' | 'sendgrid' | 'gmail';
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string;
  isReady: boolean;
  notes: string;
}

export interface GlobalSettings {
  defaultEmail: string;
  defaultQuotaUrl: string;
  soundAlert: boolean;
  autoRefreshActive: boolean;
  autoRefreshInterval: number; // in seconds
  adminPassword?: string;
}

export type ItuEducationLevel = 'lisans' | 'lisansustu';

export interface ItuCourse {
  crn: string;
  subjectCode: string; // e.g. "BLG", "CEV", "ITB", "MAT", "FIZ", "KIM"
  courseCode: string; // e.g. "BLG 212E"
  courseTitle: string; // e.g. "Microprocessor Systems"
  educationLevel: ItuEducationLevel;
  teachingMethod: string;
  instructor: string;
  building: string;
  dayTime: string;
  capacity: number;
  enrolled: number;
  remaining: number;
  restrictions: string;
}
