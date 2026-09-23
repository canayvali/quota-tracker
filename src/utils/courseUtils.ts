import { ItuProgram, TeachingModeFilter } from '../types';

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

export interface CourseEligibilityResult {
  isEligible: boolean;
  reason?: string;
  matchedProgram?: ItuProgram;
  hasRestrictions: boolean;
  rawRestriction?: string;
}

// Common pool course subjects open to all university students at ITU
const COMMON_POOL_SUBJECTS = new Set([
  'MAT', 'FIZ', 'KIM', 'ING', 'TUR', 'ATA', 'ITB', 'BED', 'GSB', 'KHM', 'DAN', 'BIL', 'HUK', 'FEL', 'SOS', 'PSI', 'YDL'
]);

// Faculty mapping to department codes
const FACULTY_TO_CODES: Record<string, string[]> = {
  'bilgisayar ve bilişim fakültesi': ['BLG', 'BLGE', 'YZV', 'YZVE', 'SBR', 'SBRE', 'BIL-YAN', 'VER-YAN', 'YZV-YAN', 'SBR-YAN'],
  'inşaat fakültesi': ['INS', 'INSE', 'CEV', 'CEVE', 'GEO', 'GEOE', 'CEV-YAN'],
  'makina fakültesi': ['MAK', 'MAKE', 'IML', 'IMLE', 'OTO-YAN'],
  'elektrik-elektronik fakültesi': ['EHB', 'EHBE', 'ELK', 'ELKE', 'KOM', 'KOME', 'KON', 'ROB-YAN', 'BMO-YAN'],
  'işletme fakültesi': ['END', 'ENDE', 'ISL', 'ISLE', 'EKO', 'EKOE', 'YBS', 'FIN-YAN', 'GIR-YAN'],
  'fen edebiyat fakültesi': ['MAT', 'MATE', 'FIZ', 'FIZE', 'KMY', 'KMYE', 'MBG', 'MBGE'],
  'kimya-metalurji fakültesi': ['KMH', 'KMHE', 'MET', 'METE', 'GID', 'GIDE', 'BIO', 'BIOE', 'KMB', 'KMBE'],
  'maden fakültesi': ['MAD', 'MADE', 'JEO', 'JEOE', 'JEF', 'JEFE', 'PET', 'PETE'],
  'uçak ve uzay bilimleri fakültesi': ['UCB', 'UCBE', 'UCK', 'UCKE', 'UZB', 'UZBE', 'MTO', 'MTOE'],
  'mimarlık fakültesi': ['MIM', 'MIME', 'ICM', 'ICME', 'PEM', 'PEME', 'SBP', 'SBPE', 'ENT', 'ENTE'],
  'gemi inşaatı ve deniz bilimleri fakültesi': ['GEM', 'GEME', 'DEN', 'DENE'],
  'tekstil teknolojileri ve tasarımı fakültesi': ['TEK', 'TEKE']
};

/**
 * Checks if an İTÜ course/CRN is eligible for a student's enrolled programs
 */
export function checkCourseEligibility(
  course: {
    restrictions?: string;
    courseCode?: string;
    subjectCode?: string;
    courseTitle?: string;
    department?: string;
  },
  userPrograms?: ItuProgram[] | null
): CourseEligibilityResult {
  // If user hasn't configured any programs yet, assume default eligible
  if (!userPrograms || userPrograms.length === 0) {
    return {
      isEligible: true,
      hasRestrictions: !!course.restrictions && course.restrictions.trim() !== '',
      rawRestriction: course.restrictions
    };
  }

  const rawRest = (course.restrictions || '').trim();
  const restLower = rawRest.toLowerCase();

  // Extract course subject prefix (e.g., 'BLG' from 'BLG 212E', 'INS' from 'INS 201')
  const courseCodeStr = (course.courseCode || '').trim();
  let subjectPrefix = (course.subjectCode || '').trim().toUpperCase();
  if (!subjectPrefix && courseCodeStr) {
    const match = courseCodeStr.match(/^([a-zA-ZçÇğĞıİöÖşŞüÜ]+)/);
    if (match) subjectPrefix = match[1].toUpperCase();
  }

  // 1. Universal open phrases (Tüm lisans, tüm programlar, herkes vs.)
  const isUniversalOpen =
    restLower.includes('tüm lisans') ||
    restLower.includes('tum lisans') ||
    restLower.includes('tüm program') ||
    restLower.includes('herkes') ||
    restLower.includes('bütün bölümler') ||
    restLower.includes('üniversite geneli') ||
    restLower.includes('all undergraduate') ||
    (restLower.includes('tüm öğrenciler') && !restLower.includes('hariç'));

  if (isUniversalOpen) {
    return {
      isEligible: true,
      hasRestrictions: !!rawRest,
      rawRestriction: rawRest,
      reason: 'Tüm lisans programlarına açık.'
    };
  }

  // 2. Pre-requisite only (e.g. Önşart: MAT 101) without department restriction
  if (
    (restLower.startsWith('önşart:') || restLower.startsWith('onsart:')) &&
    !restLower.includes('sadece') &&
    !restLower.includes('öğrencileri') &&
    !restLower.includes('fakülte') &&
    !restLower.includes('kısıtlama') &&
    !restLower.includes('bölüm')
  ) {
    return {
      isEligible: true,
      hasRestrictions: true,
      rawRestriction: rawRest,
      reason: 'Önşart koşulu mevcut, bölüm engeli bulunmuyor.'
    };
  }

  // 3. If explicit restrictions exist in text (e.g. "Kısıtlama: BLG_LS, BLGE_LS" or "Sadece INS_LS...")
  if (rawRest && rawRest !== 'Yok' && rawRest !== 'İTÜ Lisans Programları' && rawRest !== 'İTÜ Öğrencileri') {
    for (const prog of userPrograms) {
      const pCode = prog.code.toUpperCase();
      const pCodeNoSuffix = pCode.replace(/(_LS|_YD|_YL|_DR|-YAN)$/, '');
      const pCodeBase = pCodeNoSuffix.replace(/E$/, '');
      const pFaculty = (prog.faculty || '').toLowerCase();

      // A. Direct program code mention in restriction (e.g. "BLG_LS", "BLGE", "BLG", "CEV", "CEV_LS", "INS")
      const codeRegex = new RegExp(`\\b(${pCode}|${pCodeNoSuffix}|${pCodeBase}|${pCodeBase}E|${pCodeBase}_LS|${pCodeBase}E_LS)\\b`, 'i');
      if (codeRegex.test(rawRest)) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} (${prog.code}) programınız için kontenjan ayrılmıştır.`
        };
      }

      // B. Program name keyword matching in restrictions
      if (pCode.includes('CEV') && (restLower.includes('çevre') || restLower.includes('cevre'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('BLG') && (restLower.includes('bilgisayar') || restLower.includes('computer'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('INS') && (restLower.includes('inşaat müh') || restLower.includes('insaat muh') || restLower.includes('inşaat lisans'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('MAK') && (restLower.includes('makina müh') || restLower.includes('makine müh'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('EHB') && (restLower.includes('elektronik') || restLower.includes('haberleşme'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('END') && restLower.includes('endüstri')) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      if (pCode.includes('YZV') && (restLower.includes('yapay zeka') || restLower.includes('veri müh'))) {
        return {
          isEligible: true,
          matchedProgram: prog,
          hasRestrictions: true,
          rawRestriction: rawRest,
          reason: `${prog.nameTr} programınız için uygundur.`
        };
      }

      // C. Faculty matching if restriction mentions entire faculty (e.g. "Sadece İnşaat Fakültesi" or "Sadece Bilgisayar Fakültesi")
      for (const [facultyKey, codes] of Object.entries(FACULTY_TO_CODES)) {
        if (restLower.includes(facultyKey)) {
          if (codes.includes(pCode) || codes.includes(pCodeBase) || pFaculty.includes(facultyKey)) {
            return {
              isEligible: true,
              matchedProgram: prog,
              hasRestrictions: true,
              rawRestriction: rawRest,
              reason: `${prog.nameTr} bağlı olduğu ${prog.faculty || facultyKey} kontenjanından yararlanabilir.`
            };
          }
        }
      }
    }

    // Explicit restriction failed to match user's programs!
    const userProgNames = userPrograms.map((p) => `${p.code} (${p.nameTr.split(' ')[0]})`).join(', ');
    return {
      isEligible: false,
      hasRestrictions: true,
      rawRestriction: rawRest,
      reason: `Bu ders/şube kayıtlı programlarınız (${userProgNames}) için kapalıdır. Kısıtlama: "${rawRest}"`
    };
  }

  // 4. If no explicit restriction string, check if it is a departmental major course vs common pool
  const isCommonPool = COMMON_POOL_SUBJECTS.has(subjectPrefix);
  if (isCommonPool) {
    return {
      isEligible: true,
      hasRestrictions: false,
      reason: 'Ortak havuz dersi (Herkese açık).'
    };
  }

  // Check if subject prefix matches user's enrolled program departments
  const userDepartmentCodes = new Set<string>();
  for (const prog of userPrograms) {
    const pCodeNoSuffix = prog.code.toUpperCase().replace(/(_LS|_YD|_YL|_DR|-YAN)$/, '');
    const pCodeBase = pCodeNoSuffix.replace(/E$/, '');
    userDepartmentCodes.add(pCodeNoSuffix);
    userDepartmentCodes.add(pCodeBase);

    // Also add faculty affiliated department codes if course belongs to the same faculty
    const pFaculty = (prog.faculty || '').toLowerCase();
    for (const [facultyKey, codes] of Object.entries(FACULTY_TO_CODES)) {
      if (pFaculty.includes(facultyKey)) {
        codes.forEach((c) => userDepartmentCodes.add(c.replace(/E$/, '')));
      }
    }
  }

  // If the course is a department-specific major course (e.g., BLG, MAK, INS, CEV) and does NOT match user's department:
  if (subjectPrefix && !userDepartmentCodes.has(subjectPrefix)) {
    const userProgNames = userPrograms.map((p) => `${p.code} (${p.nameTr.split(' ')[0]})`).join(', ');
    return {
      isEligible: false,
      hasRestrictions: true,
      rawRestriction: `Sadece ${subjectPrefix} bölümü öğrencileri alabilir.`,
      reason: `Bu ders ${subjectPrefix} bölüm dersidir. Kayıtlı programlarınız (${userProgNames}) ile eşleşmiyor.`
    };
  }

  return {
    isEligible: true,
    hasRestrictions: false,
    reason: 'Kayıtlı programınız için uygundur.'
  };
}
