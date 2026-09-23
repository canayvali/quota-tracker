import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table with Cloud SQL and Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique identifier or email
  email: text('email').notNull(),
  password: text('password'), // Hashed or stored credential
  name: text('name'),
  enrolledPrograms: jsonb('enrolled_programs'),
  preferredLanguage: text('preferred_language').default('tr'),
  theme: text('theme').default('light'),
  hasCompletedProgramOnboarding: boolean('has_completed_program_onboarding').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
});

// Single CRN Monitors table
export const monitors = pgTable('monitors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  crn: text('crn').notNull(),
  courseCode: text('course_code').notNull(),
  courseTitle: text('course_title').notNull(),
  instructor: text('instructor'),
  department: text('department'),
  targetUrl: text('target_url'),
  notificationEmail: text('notification_email').notNull(),
  studentName: text('student_name'),
  status: text('status').default('active').notNull(),
  totalCapacity: integer('total_capacity').default(0),
  enrolled: integer('enrolled').default(0),
  availableSeats: integer('available_seats').default(0),
  alertPreference: text('alert_preference').default('any_change'),
  checkIntervalSeconds: integer('check_interval_seconds').default(45),
  trackMode: text('track_mode').default('crn'),
  restrictions: text('restrictions'),
  lastChecked: timestamp('last_checked').defaultNow(),
  lastChanged: timestamp('last_changed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tracked Course Groups table (Batch tracking by course code)
export const trackedCourseGroups = pgTable('tracked_course_groups', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  courseCode: text('course_code').notNull(),
  courseTitle: text('course_title').notNull(),
  email: text('email').notNull(),
  deliveryFilter: text('delivery_filter').default('all'),
  sections: jsonb('sections').notNull(),
  knownCrns: jsonb('known_crns').notNull(),
  status: text('status').default('active').notNull(),
  lastChecked: timestamp('last_checked').defaultNow(),
  lastChanged: timestamp('last_changed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quota Change & Notification History
export const quotaHistory = pgTable('quota_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  monitorId: text('monitor_id'),
  groupId: text('group_id'),
  type: text('type').notNull(),
  oldAvailable: integer('old_available').default(0),
  newAvailable: integer('new_available').default(0),
  oldEnrolled: integer('old_enrolled').default(0),
  newEnrolled: integer('new_enrolled').default(0),
  emailDispatched: boolean('email_dispatched').default(false),
  emailRecipient: text('email_recipient'),
  emailSubject: text('email_subject'),
  notes: text('notes'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  monitors: many(monitors),
  trackedGroups: many(trackedCourseGroups),
}));
