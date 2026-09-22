import { TeachingModeFilter } from '../types';

/**
 * Determines whether a course is taught online (çevrimiçi) according to İTÜ OBS conventions.
 * In İTÜ OBS, online courses have "(Çevrimiçi)" or "Çevrimiçi" in their course title or teaching method.
 */
export function isCourseOnline(course: {
  courseTitle?: string;
  teachingMethod?: string;
}): boolean {
  const title = (course.courseTitle || '').toLowerCase();
  const method = (course.teachingMethod || '').toLowerCase();

  return (
    title.includes('(çevrimiçi)') ||
    title.includes('(online)') ||
    title.includes('çevrimiçi') ||
    title.includes('online') ||
    method.includes('çevrimiçi') ||
    method.includes('online')
  );
}

/**
 * Checks whether an İTÜ course matches the specified delivery filter:
 * - 'all': matches both face-to-face and online courses
 * - 'face_to_face': matches only in-person courses
 * - 'online': matches only online (çevrimiçi) courses
 */
export function matchesDeliveryFilter(
  course: { courseTitle?: string; teachingMethod?: string },
  filter: TeachingModeFilter = 'all'
): boolean {
  if (filter === 'all') return true;
  const online = isCourseOnline(course);
  if (filter === 'online') return online;
  if (filter === 'face_to_face') return !online;
  return true;
}

/**
 * Returns human-readable label and styling classes for delivery mode.
 */
export function getDeliveryFilterLabel(
  filter: TeachingModeFilter,
  language: 'tr' | 'en' = 'tr'
): { label: string; shortLabel: string; badgeClass: string } {
  switch (filter) {
    case 'online':
      return {
        label: language === 'tr' ? 'Sadece Çevrimiçi (Online)' : 'Online Only (Çevrimiçi)',
        shortLabel: language === 'tr' ? 'Çevrimiçi' : 'Online',
        badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      };
    case 'face_to_face':
      return {
        label: language === 'tr' ? 'Sadece Yüz Yüze' : 'In-Person Only',
        shortLabel: language === 'tr' ? 'Yüz Yüze' : 'In-Person',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      };
    case 'all':
    default:
      return {
        label: language === 'tr' ? 'Tümü (Yüz Yüze & Çevrimiçi)' : 'All (In-Person & Online)',
        shortLabel: language === 'tr' ? 'Tümü' : 'All',
        badgeClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700'
      };
  }
}
