import { ClassMonitor, EmailSenderConfig, QuotaHistoryEvent } from '../types';
import { soundEffects } from './audio';

export interface CheckResult {
  updatedMonitor: ClassMonitor;
  hasChanged: boolean;
  emailSent: boolean;
  historyEvent?: QuotaHistoryEvent;
}

export function generateEmailHtml(
  monitor: ClassMonitor,
  oldSeats: number,
  newSeats: number,
  senderConfig: EmailSenderConfig
): { subject: string; body: string } {
  const isAvailable = newSeats > 0;
  const changeDiff = newSeats - oldSeats;
  const directionText = changeDiff > 0 ? `+${changeDiff} seat(s) opened` : `${changeDiff} seat(s) taken`;

  const subject = isAvailable
    ? `🚨 SEAT OPENED: CRN ${monitor.crn} (${monitor.courseCode}) - Now ${newSeats} Available!`
    : `⚠️ Quota Changed: CRN ${monitor.crn} (${monitor.courseCode}) - ${oldSeats} → ${newSeats} Seats`;

  const body = `
Hello Student,

A quota update was detected for your tracked class:

• CRN: ${monitor.crn}
• Course: ${monitor.courseCode} - ${monitor.courseTitle}
• Instructor: ${monitor.instructor}
• Quota Change: ${oldSeats} → ${newSeats} available seats (${directionText})
• Enrolled: ${monitor.enrolled}/${monitor.totalCapacity}
• Detected at: ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})
• Source Web Page: ${monitor.targetUrl}

${isAvailable ? '⚡ ACTION RECOMMENDED: Log into your student portal immediately to register before this seat is taken!' : 'We will continue monitoring this CRN and notify you as soon as quotas change again.'}

—
Sent automatically by ${senderConfig.senderName} (${senderConfig.senderAddress})
Configured for student: ${monitor.notificationEmail}
  `.trim();

  return { subject, body };
}

export function processQuotaChange(
  monitor: ClassMonitor,
  newAvailable: number,
  newEnrolled: number,
  senderConfig: EmailSenderConfig,
  enableSound: boolean,
  forcedNote?: string
): CheckResult {
  const oldAvailable = monitor.availableSeats;
  const hasChanged = oldAvailable !== newAvailable || monitor.enrolled !== newEnrolled;

  const now = new Date().toISOString();

  let emailSent = false;
  let historyEvent: QuotaHistoryEvent | undefined;

  if (hasChanged) {
    let shouldSendEmail = false;
    if (monitor.alertPreference === 'any_change') {
      shouldSendEmail = true;
    } else if (monitor.alertPreference === 'seats_opened_only') {
      shouldSendEmail = newAvailable > oldAvailable && newAvailable > 0;
    } else if (monitor.alertPreference === 'waitlist_or_seats') {
      shouldSendEmail = newAvailable > 0 || (monitor.waitlistCount ?? 0) > 0;
    }

    const { subject } = generateEmailHtml(monitor, oldAvailable, newAvailable, senderConfig);

    const changeType: 'increased' | 'decreased' | 'unchanged' =
      newAvailable > oldAvailable ? 'increased' : newAvailable < oldAvailable ? 'decreased' : 'unchanged';

    emailSent = shouldSendEmail;

    historyEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: now,
      type: changeType,
      oldAvailable,
      newAvailable,
      oldEnrolled: monitor.enrolled,
      newEnrolled,
      emailDispatched: emailSent,
      emailRecipient: monitor.notificationEmail,
      emailSubject: subject,
      notes: forcedNote || (changeType === 'increased' ? 'Seat opened up on source portal.' : 'Seat was claimed.')
    };

    if (enableSound) {
      if (newAvailable > 0) {
        soundEffects.playSuccessAlert();
      } else {
        soundEffects.playQuotaChangeTone();
      }
    }
  }

  const updatedMonitor: ClassMonitor = {
    ...monitor,
    availableSeats: newAvailable,
    enrolled: newEnrolled,
    lastChecked: now,
    lastChanged: hasChanged ? now : monitor.lastChanged,
    status: 'active',
    history: historyEvent ? [historyEvent, ...(monitor.history || [])].slice(0, 30) : monitor.history
  };

  return {
    updatedMonitor,
    hasChanged,
    emailSent,
    historyEvent
  };
}

export function simulateDropSeat(monitor: ClassMonitor, senderConfig: EmailSenderConfig, sound: boolean): CheckResult {
  // A student dropped or capacity increased: available seats +1
  const newAvailable = Math.min(monitor.totalCapacity, monitor.availableSeats + 1);
  const newEnrolled = Math.max(0, monitor.totalCapacity - newAvailable);
  return processQuotaChange(
    monitor,
    newAvailable,
    newEnrolled,
    senderConfig,
    sound,
    'Simulated drop: +1 seat opened up'
  );
}

export function simulateClaimSeat(monitor: ClassMonitor, senderConfig: EmailSenderConfig, sound: boolean): CheckResult {
  // A seat was claimed: available seats -1
  const newAvailable = Math.max(0, monitor.availableSeats - 1);
  const newEnrolled = Math.min(monitor.totalCapacity, monitor.totalCapacity - newAvailable);
  return processQuotaChange(
    monitor,
    newAvailable,
    newEnrolled,
    senderConfig,
    sound,
    'Simulated claim: -1 seat filled'
  );
}

export function simulateCapacityIncrease(
  monitor: ClassMonitor,
  additionalQuota: number,
  senderConfig: EmailSenderConfig,
  sound: boolean
): CheckResult {
  const newCapacity = monitor.totalCapacity + additionalQuota;
  const newAvailable = monitor.availableSeats + additionalQuota;
  const updatedWithCap = {
    ...monitor,
    totalCapacity: newCapacity
  };
  return processQuotaChange(
    updatedWithCap,
    newAvailable,
    monitor.enrolled,
    senderConfig,
    sound,
    `Simulated department capacity increase: +${additionalQuota} total quota added`
  );
}
