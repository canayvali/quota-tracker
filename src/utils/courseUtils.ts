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

// Faculty mapping to department codes
const FACULTY_TO_CODES: Record<string, string[]> = {
  'bilgisayar ve bilişim fakültesi': ['BLG', 'BLGE', 'YZV', 'YZVE', 'SBR', 'SBRE', 'BIL-YAN', 'VER-YAN', 'YZV-YAN', 'SBR-YAN'],
  'inşaat fakültesi': ['INS', 'INSE', 'CEV', 'CEVE', 'GEO', 'GEOE', 'CEV-YAN'],
  'makina fakültesi': ['MAK', 'MAKE', 'IML', 'IMLE', 'OTO-YAN'],
  'elektrik-elektronik fakültesi': ['EHB', 'EHBE', 'ELK', 'ELKE', 'KOM', 'KOME', 'KON', 'ROB-YAN', 'BMO-YAN'],
  'işletme fakültesi': ['END', 'ENDE', 'ISL', 'ISLE', 'EKO', 'EKOE', 'YBS', 'FIN-YAN', 'GIR-YAN'],
  'fen edebiyat fakültesi': ['MAT', 'MATE', 'FIZ', 'FIZE', 'KMY', 'KMYE', 'MBG', 'MBGE'],
  'kimya-metalurji fakültesi': ['KMH', 'KMHE', 'MET', 'METE', 'GID', 'GIDE', 'BIO', 'BIOE'],
  'maden fakültesi': ['MAD', 'MADE', 'JEO', 'JEOE', 'JEF', 'JEFE', 'PET', 'PETE'],
  'uçak ve uzay bilimleri fakültesi': ['UCB', 'UCBE', 'UZB', 'UZBE', 'MTO', 'MTOE'],
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
  if (!rawRest) {
    // No restriction -> Open to everyone
    return {
      isEligible: true,
      hasRestrictions: false,
      reason: 'Kısıtlama bulunmuyor (Herkese açık).'
    };
  }

  const restLower = rawRest.toLowerCase();

  // Universal open phrases
  if (
    restLower.includes('tüm lisans') ||
    restLower.includes('tum lisans') ||
    restLower.includes('tüm program') ||
    restLower.includes('herkes') ||
    restLower.includes('bütün bölümler') ||
    restLower.includes('üniversite geneli') ||
    restLower.includes('all undergraduate')
  ) {
    return {
      isEligible: true,
      hasRestrictions: true,
      rawRestriction: rawRest,
      reason: 'Tüm lisans programlarına açık.'
    };
  }

  // Pre-requisite only (e.g. Önşart: MAT 101) without department restriction
  if (
    (restLower.startsWith('önşart:') || restLower.startsWith('onsart:')) &&
    !restLower.includes('sadece') &&
    !restLower.includes('öğrencileri') &&
    !restLower.includes('fakülte') &&
    !restLower.includes('bölüm')
  ) {
    return {
      isEligible: true,
      hasRestrictions: true,
      rawRestriction: rawRest,
      reason: 'Önşart koşulu mevcut, bölüm engeli bulunmuyor.'
    };
  }

  // Check user programs against restrictions
  for (const prog of userPrograms) {
    const pCode = prog.code.toUpperCase();
    const pCodeNoSuffix = pCode.replace(/(_LS|_YD|_YL|_DR|-YAN)$/, '');
    const pCodeBase = pCodeNoSuffix.replace(/E$/, '');
    const pNameTr = prog.nameTr.toLowerCase();
    const pFaculty = (prog.faculty || '').toLowerCase();

    // 1. Direct code mention in restriction (e.g. "BLG_LS", "BLGE", "BLG", "CEV", "SUR", "INS")
    const codeRegex = new RegExp(`\\b(${pCode}|${pCodeNoSuffix}|${pCodeBase}|${pCodeBase}E)\\b`, 'i');
    if (codeRegex.test(rawRest)) {
      return {
        isEligible: true,
        matchedProgram: prog,
        hasRestrictions: true,
        rawRestriction: rawRest,
        reason: `${prog.nameTr} (${prog.code}) programınız için kontenjan ayrılmıştır.`
      };
    }

    // Direct name matching if course restrictions mention the program name title
    const shortTitle = pNameTr.split(' ')[0];
    if (shortTitle.length > 3 && restLower.includes(shortTitle)) {
      return {
        isEligible: true,
        matchedProgram: prog,
        hasRestrictions: true,
        rawRestriction: rawRest,
        reason: `${prog.nameTr} programınız için uygundur.`
      };
    }

    // 2. Program name keyword matching
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

    if (pCode.includes('SUR') && (restLower.includes('sürdürülebilirlik') || restLower.includes('surdurulebilirlik') || restLower.includes('sustainability') || restLower.includes('yandal'))) {
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

    if (pCode.includes('MAK') && (restLower.includes('makina') || restLower.includes('makine'))) {
      return {
        isEligible: true,
        matchedProgram: prog,
        hasRestrictions: true,
        rawRestriction: rawRest,
        reason: `${prog.nameTr} programınız için uygundur.`
      };
    }

    if (pCode.includes('INS') && (restLower.includes('inşaat') || restLower.includes('insaat'))) {
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

    if (pCode.includes('EHB') && (restLower.includes('elektronik') || restLower.includes('haberleşme'))) {
      return {
        isEligible: true,
        matchedProgram: prog,
        hasRestrictions: true,
        rawRestriction: rawRest,
        reason: `${prog.nameTr} programınız için uygundur.`
      };
    }

    // 3. Faculty matching
    for (const [facultyKey, codes] of Object.entries(FACULTY_TO_CODES)) {
      if (restLower.includes(facultyKey)) {
        if (codes.includes(pCode) || codes.includes(pCodeBase) || pFaculty.includes(facultyKey)) {
          return {
            isEligible: true,
            matchedProgram: prog,
            hasRestrictions: true,
            rawRestriction: rawRest,
            reason: `${prog.nameTr} bağlı olduğu ${prog.faculty} kontenjanından yararlanabilir.`
          };
        }
      }
    }
  }

  // If we reach here, restriction is specific and none of user's programs match
  const userProgNames = userPrograms.map((p) => p.nameTr || p.code).join(', ');
  return {
    isEligible: false,
    hasRestrictions: true,
    rawRestriction: rawRest,
    reason: `Bu ders/şube kayıtlı programlarınız (${userProgNames}) için uygun görünmüyor. Kısıtlama: "${rawRest}"`
  };
}
