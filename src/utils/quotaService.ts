import { AppLanguage, ClassMonitor, EmailSenderConfig, QuotaHistoryEvent } from '../types';
import { soundEffects } from './audio';

export interface CheckResult {
  updatedMonitor: ClassMonitor;
  hasChanged: boolean;
  emailSent: boolean;
  historyEvent?: QuotaHistoryEvent;
}

export type QuotaEventType = 'capacity_increase' | 'seat_dropped' | 'seat_claimed' | 'other';

/**
 * Generates email subject and body for quota notifications.
 * Based on user preference, the email is dispatched in either Turkish ('tr') or English ('en').
 * Defaults to Turkish if not specified or changed.
 */
export function generateEmailHtml(
  monitor: ClassMonitor,
  oldSeats: number,
  newSeats: number,
  senderConfig: EmailSenderConfig,
  eventType: 'capacity_increase' | 'seat_dropped' = 'seat_dropped',
  capacityChange?: { oldCapacity: number; newCapacity: number },
  language: AppLanguage = 'tr'
): { subject: string; body: string } {
  const changeDiff = newSeats - oldSeats;
  const now = new Date();
  const dateStrTR = now.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'medium' });
  const dateStrEN = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' });

  const isEnglish = language === 'en';

  // 1. Quota is increased by department / faculty
  if (eventType === 'capacity_increase') {
    if (isEnglish) {
      const subject = `Quota Increased! - CRN ${monitor.crn} (${monitor.courseCode})`;
      const body = `
🚨 QUOTA INCREASED!

Hello,

The department or faculty has increased the quota for your tracked course:

• Course Code: ${monitor.courseCode}
• Course Title: ${monitor.courseTitle}
• CRN: ${monitor.crn}
• Instructor: ${monitor.instructor}
• Quota Change: ${capacityChange ? `${capacityChange.oldCapacity} → ${capacityChange.newCapacity} total quota` : `Available seats: ${oldSeats} → ${newSeats}`}
• Available Seats Right Now: ${newSeats}
• Enrolled / Total: ${monitor.enrolled}/${capacityChange ? capacityChange.newCapacity : monitor.totalCapacity}
• Notification Time: ${dateStrEN}
• OBS Course Schedule: ${monitor.targetUrl}

⚡ ACTION RECOMMENDED: Log into the ITU Student Information System (OBS) immediately to finalize your course registration before seats fill up!

—
ITU OBS Quota Alert System (${senderConfig.senderAddress})
This notification was automatically sent for the student registered at ${monitor.notificationEmail}.
      `.trim();
      return { subject, body };
    }

    // Default Turkish
    const subject = `Kontenjan arttırıldı! - CRN ${monitor.crn} (${monitor.courseCode})`;
    const body = `
🚨 KONTENJAN ARTTIRILDI!

Merhaba,

Takip ettiğiniz derste bölüm/fakülte tarafından kontenjan artırımı yapılmıştır:

• Ders Kodu: ${monitor.courseCode}
• Ders Adı: ${monitor.courseTitle}
• CRN: ${monitor.crn}
• Öğretim Üyesi: ${monitor.instructor}
• Kontenjan Değişimi: ${capacityChange ? `${capacityChange.oldCapacity} → ${capacityChange.newCapacity} toplam kontenjan` : `Boş kontenjan: ${oldSeats} → ${newSeats}`}
• Mevcut Boş Kontenjan: ${newSeats}
• Kayıtlı / Toplam: ${monitor.enrolled}/${capacityChange ? capacityChange.newCapacity : monitor.totalCapacity}
• Bildirim Zamanı: ${dateStrTR}
• OBS Ders Programı Sayfası: ${monitor.targetUrl}

⚡ ÖNEMLİ: Kontenjan tükenmeden hemen İTÜ Öğrenci Bilgi Sistemi'ne (OBS) giriş yaparak ders kaydınızı tamamlayınız!

—
İTÜ OBS Kontenjan Uyarı Sistemi (${senderConfig.senderAddress})
Bu bildirim ${monitor.notificationEmail} adresine kayıtlı öğrenci için otomatik olarak gönderilmiştir.
    `.trim();

    return { subject, body };
  }

  // 2. Somebody dropped the class (A student dropped)
  const diffDisplay = changeDiff > 0 ? `+${changeDiff}` : `${changeDiff}`;

  if (isEnglish) {
    const subject = `Seat Opened - Student Dropped: CRN ${monitor.crn} (${monitor.courseCode})`;
    const body = `
🔔 SEAT OPENED - SOMEONE DROPPED THE CLASS

Hello,

A student has dropped your tracked class and an open seat is now available:

• Course Code: ${monitor.courseCode}
• Course Title: ${monitor.courseTitle}
• CRN: ${monitor.crn}
• Instructor: ${monitor.instructor}
• Available Seats: ${oldSeats} → ${newSeats} (${diffDisplay} open seat${Math.abs(changeDiff) === 1 ? '' : 's'})
• Enrolled / Total: ${monitor.enrolled}/${monitor.totalCapacity}
• Notification Time: ${dateStrEN}
• OBS Course Schedule: ${monitor.targetUrl}

⚡ ACTION RECOMMENDED: Log into your ITU Student Information System (OBS) immediately to register before this seat is taken!

—
ITU OBS Quota Alert System (${senderConfig.senderAddress})
This notification was automatically sent for the student registered at ${monitor.notificationEmail}.
    `.trim();

    return { subject, body };
  }

  // Default Turkish
  const subject = `Kontenjan açıldı - Biri dersi bıraktı: CRN ${monitor.crn} (${monitor.courseCode})`;
  const body = `
🔔 KONTENJAN AÇILDI - BİRİ DERSİ BIRAKTI

Merhaba,

Takip ettiğiniz derste bir öğrencinin dersi bırakması sonucu boş kontenjan açılmıştır:

• Ders Kodu: ${monitor.courseCode}
• Ders Adı: ${monitor.courseTitle}
• CRN: ${monitor.crn}
• Öğretim Üyesi: ${monitor.instructor}
• Boş Kontenjan Durumu: ${oldSeats} → ${newSeats} (${diffDisplay} boş yer açıldı)
• Kayıtlı / Toplam: ${monitor.enrolled}/${monitor.totalCapacity}
• Bildirim Zamanı: ${dateStrTR}
• OBS Ders Programı Sayfası: ${monitor.targetUrl}

⚡ ÖNEMLİ: Boşalan bu kontenjan başka bir öğrenci tarafından alınmadan önce hemen İTÜ OBS sistemine giriş yapınız!

—
İTÜ OBS Kontenjan Uyarı Sistemi (${senderConfig.senderAddress})
Bu bildirim ${monitor.notificationEmail} adresine kayıtlı öğrenci için otomatik olarak gönderilmiştir.
  `.trim();

  return { subject, body };
}

export function processQuotaChange(
  monitor: ClassMonitor,
  newAvailable: number,
  newEnrolled: number,
  senderConfig: EmailSenderConfig,
  enableSound: boolean,
  eventTypeOverride?: 'capacity_increase' | 'seat_dropped' | 'seat_claimed',
  forcedNote?: string,
  capacityChange?: { oldCapacity: number; newCapacity: number },
  language: AppLanguage = 'tr'
): CheckResult {
  const oldAvailable = monitor.availableSeats;
  const hasChanged = oldAvailable !== newAvailable || monitor.enrolled !== newEnrolled;

  const now = new Date().toISOString();

  let emailSent = false;
  let historyEvent: QuotaHistoryEvent | undefined;

  if (hasChanged) {
    const isCapIncrease =
      eventTypeOverride === 'capacity_increase' ||
      (capacityChange && capacityChange.newCapacity > capacityChange.oldCapacity);
    const isSeatDropped =
      eventTypeOverride === 'seat_dropped' || (!isCapIncrease && newAvailable > oldAvailable);

    // USER DIRECTIVE:
    // No emails for full quota or decrease of quota!
    // ONLY send emails when quota is increased or when someone drops the class and seats become available (> 0)
    const shouldSendEmail = (isCapIncrease || isSeatDropped) && newAvailable > 0;

    const eventType: 'capacity_increase' | 'seat_dropped' = isCapIncrease
      ? 'capacity_increase'
      : 'seat_dropped';

    const { subject } = generateEmailHtml(
      monitor,
      oldAvailable,
      newAvailable,
      senderConfig,
      eventType,
      capacityChange,
      language
    );

    const changeType: 'increased' | 'decreased' | 'unchanged' =
      newAvailable > oldAvailable ? 'increased' : newAvailable < oldAvailable ? 'decreased' : 'unchanged';

    emailSent = shouldSendEmail;

    const eventNote =
      forcedNote ||
      (isCapIncrease
        ? (language === 'en' ? 'Quota increased!' : 'Kontenjan arttırıldı!')
        : isSeatDropped
        ? (language === 'en' ? 'Seat opened - Student dropped' : 'Kontenjan açıldı - Biri dersi bıraktı')
        : (language === 'en' ? 'Quota decreased / full (No email dispatched)' : 'Kontenjan azaldı / doldu (E-posta gönderilmez)'));

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
      notes: eventNote
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

export function simulateDropSeat(
  monitor: ClassMonitor,
  senderConfig: EmailSenderConfig,
  sound: boolean,
  language: AppLanguage = 'tr'
): CheckResult {
  // A student dropped: available seats +1
  const newAvailable = Math.min(monitor.totalCapacity, monitor.availableSeats + 1);
  const newEnrolled = Math.max(0, monitor.totalCapacity - newAvailable);
  return processQuotaChange(
    monitor,
    newAvailable,
    newEnrolled,
    senderConfig,
    sound,
    'seat_dropped',
    language === 'en' ? 'Seat opened - Student dropped' : 'Kontenjan açıldı - Biri dersi bıraktı',
    undefined,
    language
  );
}

export function simulateClaimSeat(
  monitor: ClassMonitor,
  senderConfig: EmailSenderConfig,
  sound: boolean,
  language: AppLanguage = 'tr'
): CheckResult {
  // A seat was claimed / filled: available seats -1. NO EMAIL SENT!
  const newAvailable = Math.max(0, monitor.availableSeats - 1);
  const newEnrolled = Math.min(monitor.totalCapacity, monitor.totalCapacity - newAvailable);
  return processQuotaChange(
    monitor,
    newAvailable,
    newEnrolled,
    senderConfig,
    sound,
    'seat_claimed',
    language === 'en' ? 'Seat taken: quota decreased (No email sent)' : 'Ders alındı: kontenjan azaldı (E-posta gönderilmez)',
    undefined,
    language
  );
}

export function simulateCapacityIncrease(
  monitor: ClassMonitor,
  additionalQuota: number,
  senderConfig: EmailSenderConfig,
  sound: boolean,
  language: AppLanguage = 'tr'
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
    'capacity_increase',
    language === 'en' ? `Quota increased! (+${additionalQuota} new quota)` : `Kontenjan arttırıldı! (+${additionalQuota} yeni kontenjan)`,
    { oldCapacity: monitor.totalCapacity, newCapacity },
    language
  );
}

