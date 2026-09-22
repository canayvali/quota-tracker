export interface QuotaHistoryEvent {
  id: string;
  timestamp: string;
  type: 'increased' | 'decreased' | 'unchanged' | 'initial' | 'new_crn_opened' | 'seat_dropped' | 'capacity_increased';
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

export type AppLanguage = 'tr' | 'en';
export type AppTheme = 'light' | 'dark';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  isVerified?: boolean;
  preferredLanguage?: AppLanguage;
  theme?: AppTheme;
  createdAt: string;
  lastLoginAt: string;
}

export type TeachingModeFilter = 'all' | 'face_to_face' | 'online';

export interface CourseGroupSection {
  crn: string;
  courseCode: string;
  courseTitle: string;
  instructor: string;
  teachingMethod: string;
  isOnline: boolean;
  building?: string;
  dayTime?: string;
  capacity: number;
  enrolled: number;
  availableSeats: number;
  lastChecked: string;
}

export interface TrackedCourseGroup {
  id: string;
  courseCode: string;
  courseTitle: string;
  userId: string;
  email: string;
  deliveryFilter: TeachingModeFilter; // 'all' | 'face_to_face' | 'online'
  sections: CourseGroupSection[];
  knownCrns: string[];
  status: 'active' | 'paused';
  createdAt: string;
  lastChecked: string;
  lastChanged?: string;
  history?: QuotaHistoryEvent[];
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
  trackMode?: 'crn' | 'course_code';
  trackedCourseCode?: string;
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
