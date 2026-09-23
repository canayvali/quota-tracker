import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Globe,
  GraduationCap,
  Hash,
  Layers,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Wifi,
  X
} from 'lucide-react';
import {
  AppLanguage,
  ClassMonitor,
  CourseGroupSection,
  ItuCourse,
  TeachingModeFilter,
  TrackedCourseGroup,
  UserAccount
} from '../types';
import { fetchCourseByCrn, fetchCoursesByCourseCode } from '../utils/ituScraperService';
import { checkCourseEligibility, isCourseOnline, matchesDeliveryFilter } from '../utils/courseUtils';
import { TRANSLATIONS } from '../utils/translations';

interface AddCrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonitor: (monitor: ClassMonitor) => void;
  onAddCourseGroup: (group: TrackedCourseGroup) => void;
  currentUser: UserAccount;
  defaultQuotaUrl: string;
  onOpenItuBrowser?: () => void;
  language?: AppLanguage;
  initialCourseCode?: string;
}

interface IneligibleGroupWarningData {
  allCourses: ItuCourse[];
  eligibleCourses: ItuCourse[];
  ineligibleCourses: ItuCourse[];
  courseCode: string;
  representativeTitle: string;
}

export const AddCrnModal: React.FC<AddCrnModalProps> = ({
  isOpen,
  onClose,
  onAddMonitor,
  onAddCourseGroup,
  currentUser,
  defaultQuotaUrl,
  onOpenItuBrowser,
  language = 'tr',
  initialCourseCode = ''
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.tr;

  const [activeTab, setActiveTab] = useState<'crn' | 'course_code'>(
    initialCourseCode ? 'course_code' : 'crn'
  );
  const [crn, setCrn] = useState('');
  const [courseCode, setCourseCode] = useState(initialCourseCode || '');
  const [deliveryFilter, setDeliveryFilter] = useState<TeachingModeFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredCourse, setDiscoveredCourse] = useState<ItuCourse | null>(null);
  const [discoveredCourses, setDiscoveredCourses] = useState<ItuCourse[]>([]);

  // Ineligible Course Confirmation for Single CRN
  const [ineligibleWarning, setIneligibleWarning] = useState<{
    course: ItuCourse;
    reason: string;
  } | null>(null);

  // Ineligible Group Confirmation for Batch Mode
  const [ineligibleGroupWarning, setIneligibleGroupWarning] = useState<IneligibleGroupWarningData | null>(
    null
  );

  if (!isOpen) return null;

  const userProgramSummary =
    currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0
      ? currentUser.enrolledPrograms.map((p) => `${p.code} (${p.nameTr.split(' ')[0]})`).join(', ')
      : language === 'tr'
      ? 'Belirtilmemiş'
      : 'Unspecified';

  const executeAddMonitor = (course: ItuCourse) => {
    const studentEmail = currentUser.email;

    const newMonitor: ClassMonitor = {
      id: 'mon-' + Date.now(),
      userId: currentUser.id,
      crn: course.crn,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      instructor: course.instructor,
      department: course.subjectCode,
      targetUrl: defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
      notificationEmail: studentEmail,
      studentName: currentUser.name,
      status: 'active',
      totalCapacity: course.capacity,
      enrolled: course.enrolled,
      availableSeats: course.remaining,
      lastChecked: new Date().toISOString(),
      lastChanged: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      alertPreference: 'any_change',
      checkIntervalSeconds: 45,
      trackMode: 'crn',
      restrictions: course.restrictions,
      history: [
        {
          id: 'hist-' + Date.now(),
          timestamp: new Date().toISOString(),
          type: 'initial',
          oldAvailable: course.remaining,
          newAvailable: course.remaining,
          oldEnrolled: course.enrolled,
          newEnrolled: course.enrolled,
          emailDispatched: false,
          emailRecipient: studentEmail,
          emailSubject: `Live tracking activated for CRN ${course.crn} (${course.courseCode})`,
          notes: `Information automatically gathered from İTÜ OBS (obs.itu.edu.tr). Quota: ${course.enrolled}/${course.capacity}`
        }
      ]
    };

    onAddMonitor(newMonitor);
    setCrn('');
    setDiscoveredCourse(null);
    setIneligibleWarning(null);
    setIsLoading(false);
  };

  // Single CRN Lookup and Track
  const handleLookupCrn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanCrn = crn.trim();
    if (!cleanCrn) {
      setError(t.errorEnterCrn);
      return;
    }

    if (!/^\d{4,6}$/.test(cleanCrn)) {
      setError(t.errorInvalidCrn);
      return;
    }

    setError(null);
    setIneligibleWarning(null);
    setIsLoading(true);

    try {
      const result = await fetchCourseByCrn(cleanCrn);
      const course = result.course;
      setDiscoveredCourse(course);

      // Check Eligibility for student's programs
      const eligibility = checkCourseEligibility(course, currentUser.enrolledPrograms);

      if (!eligibility.isEligible && currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0) {
        setIsLoading(false);
        setIneligibleWarning({
          course,
          reason:
            eligibility.reason ||
            (language === 'tr'
              ? `Bu ders (${course.courseCode}) kayıtlı bölümleriniz (${userProgramSummary}) için uygun görünmüyor.`
              : `This course is not open to your registered programs.`)
        });
        return;
      }

      // If eligible or no enrolled programs set, add directly
      setTimeout(() => {
        executeAddMonitor(course);
      }, 400);
    } catch {
      setIsLoading(false);
      setError(
        language === 'en'
          ? 'Could not query İTÜ OBS. Please verify the CRN and try again.'
          : 'İTÜ OBS sorgulanamadı. Lütfen CRN kodunu kontrol ediniz.'
      );
    }
  };

  const executeAddCourseGroup = (
    coursesToTrack: ItuCourse[],
    normCode: string,
    repTitle: string,
    notePrefix = '',
    allDiscoveredCourses?: ItuCourse[]
  ) => {
    const sections: CourseGroupSection[] = coursesToTrack.map((c) => ({
      crn: c.crn,
      courseCode: c.courseCode,
      courseTitle: c.courseTitle,
      instructor: c.instructor,
      teachingMethod:
        c.teachingMethod || (isCourseOnline(c) ? 'Çevrimiçi (Online)' : 'Fiziksel (Yüz yüze)'),
      isOnline: isCourseOnline(c),
      building: c.building,
      dayTime: c.dayTime,
      capacity: c.capacity,
      enrolled: c.enrolled,
      availableSeats: c.remaining,
      lastChecked: new Date().toISOString(),
      restrictions: c.restrictions
    }));

    const totalInitialAvailable = sections.reduce((acc, s) => acc + s.availableSeats, 0);
    const totalInitialEnrolled = sections.reduce((acc, s) => acc + s.enrolled, 0);

    const sourceCourses = allDiscoveredCourses && allDiscoveredCourses.length > 0 ? allDiscoveredCourses : coursesToTrack;
    const allKnownCrns = Array.from(new Set(sourceCourses.map((c) => c.crn)));

    const newGroup: TrackedCourseGroup = {
      id: 'grp-' + Date.now(),
      courseCode: normCode,
      courseTitle: repTitle,
      userId: currentUser.id,
      email: currentUser.email,
      deliveryFilter: deliveryFilter,
      sections: sections,
      knownCrns: allKnownCrns,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      lastChanged: new Date().toISOString(),
      history: [
        {
          id: 'hist-' + Date.now(),
          timestamp: new Date().toISOString(),
          type: 'initial',
          oldAvailable: totalInitialAvailable,
          newAvailable: totalInitialAvailable,
          oldEnrolled: totalInitialEnrolled,
          newEnrolled: totalInitialEnrolled,
          emailDispatched: false,
          emailRecipient: currentUser.email,
          emailSubject:
            language === 'en'
              ? `Course Code Tracker activated for ${normCode}`
              : `Toplu ders takibi başlatıldı: ${normCode}`,
          notes: notePrefix
            ? `${notePrefix} (${sections.length} şube)`
            : `${sections.length} şube takibe alındı. Filtre: ${deliveryFilter}`
        }
      ]
    };

    onAddCourseGroup(newGroup);
    setCourseCode('');
    setDiscoveredCourses([]);
    setIneligibleGroupWarning(null);
    setIsLoading(false);
  };

  // Course Code Lookup and Track (Toplu Ders Takibi)
  const handleLookupCourseCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanCode = courseCode.trim();
    if (!cleanCode) {
      setError(t.errorEnterCourseCode);
      return;
    }

    setError(null);
    setIneligibleGroupWarning(null);
    setIsLoading(true);

    try {
      const result = await fetchCoursesByCourseCode(cleanCode);
      const courses = result.courses;

      if (!courses || courses.length === 0) {
        setError(t.errorNoCrnsFoundForCourse);
        setIsLoading(false);
        return;
      }

      setDiscoveredCourses(courses);
      const normalizedCode = cleanCode.replace(/\s+/g, '').toUpperCase();
      const representativeTitle = courses[0]?.courseTitle || `${normalizedCode} Dersi`;

      // 1. Filter sections based on delivery filter (face-to-face vs online)
      const matchingCourses = courses.filter((c) => matchesDeliveryFilter(c, deliveryFilter));

      if (matchingCourses.length === 0) {
        setError(
          language === 'tr'
            ? `Seçilen öğretim türü filtresine (${deliveryFilter}) uygun şube bulunamadı.`
            : 'No sections match the selected delivery mode.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Partition sections into Eligible vs Ineligible (Uyarı veren / Alınamayan)
      const hasEnrolledPrograms =
        currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0;

      let eligibleCourses = matchingCourses;
      let ineligibleCourses: ItuCourse[] = [];

      if (hasEnrolledPrograms) {
        eligibleCourses = matchingCourses.filter(
          (c) => checkCourseEligibility(c, currentUser.enrolledPrograms).isEligible
        );
        ineligibleCourses = matchingCourses.filter(
          (c) => !checkCourseEligibility(c, currentUser.enrolledPrograms).isEligible
        );
      }

      // RULE:
      // "uyarı veren dersler harici dersleri uyarı vermeden ekle ve sadece uyarı veren, alınamayan dersler için alımda sor."
      // If NO ineligible sections exist (all can be taken): add immediately with zero warnings/prompts!
      if (ineligibleCourses.length === 0) {
        setTimeout(() => {
          executeAddCourseGroup(
            eligibleCourses,
            normalizedCode,
            representativeTitle,
            `${eligibleCourses.length} şube takibe alındı.`,
            courses
          );
        }, 300);
        return;
      }

      // If there ARE ineligible sections, pause and prompt ONLY for the warning/ineligible courses:
      setIsLoading(false);
      setIneligibleGroupWarning({
        allCourses: matchingCourses,
        eligibleCourses,
        ineligibleCourses,
        courseCode: normalizedCode,
        representativeTitle
      });
    } catch {
      setIsLoading(false);
      setError(
        language === 'en'
          ? 'Could not query İTÜ OBS for course code. Please try again.'
          : 'İTÜ OBS ders kodu sorgulanamadı. Lütfen tekrar deneyiniz.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
        <div
          className="relative w-full max-w-lg flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          {/* Header - Fixed top bar */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-white dark:bg-stone-900">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-stone-900 dark:bg-stone-800 text-amber-400 flex items-center justify-center shrink-0">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 id="modal-headline" className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {t.modalAddTitle}
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">
                  {t.modalAddSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Enrolled Department Bar */}
          {currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0 && (
            <div className="px-5 sm:px-6 py-2 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-950 dark:text-blue-200 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold">{language === 'tr' ? 'Bölüm Filtreniz:' : 'Your Major Filter:'}</span>
                <span className="truncate text-blue-800 dark:text-blue-300 font-medium">{userProgramSummary}</span>
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="shrink-0 px-5 sm:px-6 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex p-1 bg-stone-200/80 dark:bg-stone-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('crn');
                  setError(null);
                  setIneligibleWarning(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'crn'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Hash className="h-3.5 w-3.5" />
                <span>{t.tabByCrn}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('course_code');
                  setError(null);
                  setIneligibleGroupWarning(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'course_code'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                <span>{t.tabByCourseCode}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TRACK BY SINGLE CRN */}
          {activeTab === 'crn' && (
            <form onSubmit={handleLookupCrn} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-3.5 space-y-3.5">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* INELIGIBLE COURSE CONFIRMATION DIALOG */}
                {ineligibleWarning && (
                  <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 space-y-3 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">
                          {language === 'tr' ? 'Bölüm Uygunluk Uyarısı' : 'Major Eligibility Warning'}
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                          {language === 'tr' ? (
                            <>
                              Bu ders (<strong>CRN: {ineligibleWarning.course.crn} - {ineligibleWarning.course.courseCode}</strong>) okuduğunuz programlar (<strong>{userProgramSummary}</strong>) için uygun görünmüyor veya bu şubenin kontenjanı bölümünüze açık değil.
                            </>
                          ) : (
                            <>
                              This course (<strong>CRN: {ineligibleWarning.course.crn}</strong>) does not seem open to your registered programs (<strong>{userProgramSummary}</strong>).
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {ineligibleWarning.course.restrictions && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-amber-200 dark:border-amber-800/60 text-xs">
                        <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5">
                          {language === 'tr' ? 'OBS Ders Kısıtlaması:' : 'OBS Course Restriction:'}
                        </span>
                        <span className="text-stone-700 dark:text-stone-300 italic font-mono text-[11px]">
                          {ineligibleWarning.course.restrictions}
                        </span>
                      </div>
                    )}

                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                      {language === 'tr'
                        ? 'Yine de bu CRN\'i takip listesine eklemek istiyor musunuz?'
                        : 'Do you still wish to track this CRN anyway?'}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIneligibleWarning(null)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        {language === 'tr' ? 'Vazgeç' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => executeAddMonitor(ineligibleWarning.course)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {language === 'tr' ? 'Yine de Takip Et (Onayla)' : 'Track Anyway (Confirm)'}
                      </button>
                    </div>
                  </div>
                )}

                {/* CRN Input Field */}
                {!ineligibleWarning && (
                  <>
                    <div>
                      <label htmlFor="crn-input" className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                        <span>{t.crnInputLabel} <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 font-normal">{t.crnInputHint}</span>
                      </label>
                      <div className="relative">
                        <input
                          id="crn-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoFocus
                          placeholder={t.crnPlaceholder}
                          value={crn}
                          onChange={(e) => {
                            setCrn(e.target.value.replace(/\D/g, ''));
                            setError(null);
                            setIneligibleWarning(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-base font-mono font-bold tracking-wider rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/10 focus:border-amber-600 dark:focus:border-amber-400"
                        />
                        <div className="absolute right-3 top-3 text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                          {crn.length}/5
                        </div>
                      </div>
                    </div>

                    {/* Discovered Course Preview Banner */}
                    {discoveredCourse && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.gatheredFromObs}</span>
                        </div>
                        <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          <span className="font-mono font-bold">{discoveredCourse.courseCode}</span> — {discoveredCourse.courseTitle}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex flex-wrap gap-2">
                          <span>{t.instructorLabel}: {discoveredCourse.instructor}</span>
                          <span>•</span>
                          <span>{t.quotaLabel}: {discoveredCourse.enrolled}/{discoveredCourse.capacity}</span>
                          <span>•</span>
                          <span>{t.remainingLabel}: {discoveredCourse.remaining}</span>
                        </div>
                        {discoveredCourse.restrictions && (
                          <div className="text-[10px] font-mono text-emerald-800/80 dark:text-emerald-300/80 pt-1">
                            Şart: {discoveredCourse.restrictions}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Information Notice */}
                    <div className="p-3 bg-[#FAF9F5] dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 rounded-xl text-xs text-stone-600 dark:text-stone-400 flex items-start gap-2">
                      <Globe className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        {t.infoNotice}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Pinned Action Buttons Footer */}
              <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs flex items-center justify-between gap-3">
                {onOpenItuBrowser ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenItuBrowser();
                    }}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{t.btnBrowseObs}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {t.btnCancel}
                  </button>
                  {!ineligibleWarning && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          <span>{t.gatheringFromObsModal}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.btnTrackCrnSubmit}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: TRACK BY COURSE CODE (TOPLU DERS TAKİBİ) */}
          {activeTab === 'course_code' && (
            <form onSubmit={handleLookupCourseCode} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-3.5 space-y-3.5">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* INELIGIBLE GROUP CONFIRMATION / PROMPT */}
                {ineligibleGroupWarning && (
                  <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 space-y-3.5 animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">
                          {language === 'tr' ? 'Toplu Takip & Uyarı Veren Şubeler' : 'Batch Tracking Major Filter'}
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                          {ineligibleGroupWarning.eligibleCourses.length > 0 ? (
                            language === 'tr' ? (
                              <>
                                <strong>{ineligibleGroupWarning.courseCode}</strong> dersinin{' '}
                                <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                                  {ineligibleGroupWarning.eligibleCourses.length} şubesi
                                </strong>{' '}
                                bölümünüze uygundur.
                                <br />
                                Ancak{' '}
                                <strong className="text-amber-700 dark:text-amber-300 font-bold">
                                  {ineligibleGroupWarning.ineligibleCourses.length} şube
                                </strong>{' '}
                                kayıtlı programlarınız ({userProgramSummary}) için kapalıdır.
                              </>
                            ) : (
                              <>
                                {ineligibleGroupWarning.eligibleCourses.length} sections are open to your major.
                                However, {ineligibleGroupWarning.ineligibleCourses.length} sections are restricted.
                              </>
                            )
                          ) : (
                            language === 'tr' ? (
                              <>
                                <strong>{ineligibleGroupWarning.courseCode}</strong> dersinin bulunan{' '}
                                <strong>{ineligibleGroupWarning.allCourses.length} şubesinin tümü</strong> kayıtlı
                                programlarınız ({userProgramSummary}) için kapalı görünmektedir.
                              </>
                            ) : (
                              <>
                                All {ineligibleGroupWarning.allCourses.length} sections of {ineligibleGroupWarning.courseCode} are restricted for your registered programs.
                              </>
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Section breakdown chips */}
                    <div className="space-y-2">
                      {ineligibleGroupWarning.eligibleCourses.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                          <span className="font-semibold text-emerald-900 dark:text-emerald-300 block text-[11px] mb-1">
                            ✓ {language === 'tr' ? 'Bölümünüze Uygun Açık Şubeler:' : 'Open Sections for You:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {ineligibleGroupWarning.eligibleCourses.map((c) => (
                              <span
                                key={c.crn}
                                className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-bold"
                              >
                                CRN {c.crn} ({c.remaining} boş)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* List of Warning/Restricted CRNs only */}
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-900/80 border border-amber-200 dark:border-amber-800/60 text-xs">
                        <span className="font-semibold text-amber-900 dark:text-amber-300 block text-[11px] mb-1">
                          ⚠️ {language === 'tr' ? 'Uyarı Veren (Bölüm Kısıtlamalı) Şubeler:' : 'Restricted Sections:'}
                        </span>
                        <div className="max-h-28 overflow-y-auto space-y-1 divide-y divide-stone-100 dark:divide-stone-800">
                          {ineligibleGroupWarning.ineligibleCourses.map((c) => (
                            <div key={c.crn} className="pt-1 first:pt-0 flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-amber-950 dark:text-amber-200 shrink-0">
                                CRN {c.crn}
                              </span>
                              <span className="text-amber-800 dark:text-amber-300 italic text-[10px] truncate max-w-[220px] ml-2" title={c.restrictions}>
                                {c.restrictions || (language === 'tr' ? 'Bölüm şartı mevcut' : 'Department restricted')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      {language === 'tr'
                        ? 'Alınamayan / uyarı veren şubeleri de dahil etmek istiyor musunuz?'
                        : 'Do you want to include the restricted sections?'}
                    </p>

                    {/* Interactive Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIneligibleGroupWarning(null)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-center"
                      >
                        {language === 'tr' ? 'Vazgeç' : 'Cancel'}
                      </button>

                      {ineligibleGroupWarning.eligibleCourses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            executeAddCourseGroup(
                              ineligibleGroupWarning.eligibleCourses,
                              ineligibleGroupWarning.courseCode,
                              ineligibleGroupWarning.representativeTitle,
                              `Bölümünüze uygun ${ineligibleGroupWarning.eligibleCourses.length} şube takibe alındı.`,
                              ineligibleGroupWarning.allCourses
                            );
                          }}
                          className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {language === 'tr'
                              ? `Sadece Uygun ${ineligibleGroupWarning.eligibleCourses.length} Şubeyi Ekle`
                              : `Track Only ${ineligibleGroupWarning.eligibleCourses.length} Eligible`}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          executeAddCourseGroup(
                            ineligibleGroupWarning.allCourses,
                            ineligibleGroupWarning.courseCode,
                            ineligibleGroupWarning.representativeTitle,
                            `Kullanıcı onayı ile ${ineligibleGroupWarning.allCourses.length} şubenin tümü takibe alındı.`
                          );
                        }}
                        className="px-3 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                      >
                        <span>
                          {ineligibleGroupWarning.eligibleCourses.length > 0
                            ? language === 'tr'
                              ? `Tümünü Ekle (${ineligibleGroupWarning.allCourses.length} Şube)`
                              : `Track All (${ineligibleGroupWarning.allCourses.length})`
                            : language === 'tr'
                            ? 'Tümünü Takip Et (Onayla)'
                            : 'Track All (Confirm)'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Course Code Input Field */}
                {!ineligibleGroupWarning && (
                  <>
                    <div>
                      <label htmlFor="course-code-input" className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                        <span>{t.courseCodeInputLabel} <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{t.courseCodeInputHint}</span>
                      </label>
                      <div className="relative">
                        <input
                          id="course-code-input"
                          type="text"
                          autoFocus
                          placeholder={t.courseCodePlaceholder}
                          value={courseCode}
                          onChange={(e) => {
                            setCourseCode(e.target.value.toUpperCase());
                            setError(null);
                            setIneligibleGroupWarning(null);
                          }}
                          className="w-full px-3.5 py-2.5 text-base font-mono font-bold tracking-wider rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-400 uppercase"
                        />
                      </div>
                    </div>

                    {/* Teaching Delivery Mode Filter Selector (Face-to-Face vs Online) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {t.deliveryFilterLabel}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'all', label: t.deliveryFilterAll, icon: Globe },
                          { id: 'face_to_face', label: t.deliveryFilterFaceToFace, icon: MapPin },
                          { id: 'online', label: t.deliveryFilterOnline, icon: Wifi }
                        ].map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = deliveryFilter === mode.id;
                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setDeliveryFilter(mode.id as TeachingModeFilter)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/10'
                                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400'}`} />
                                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                              </div>
                              <span className="text-[11px] font-semibold leading-tight">
                                {mode.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                        {t.deliveryFilterHint}
                      </p>
                    </div>

                    {/* Explanatory Callout Banner */}
                    <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                      <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        {language === 'tr'
                          ? `Toplu ders takibinde uygun şubeler otomatik olarak takibe alınır. Yalnızca bölümünüze kapalı şubeler için onayınız sorulur.`
                          : t.courseCodeExplanation}
                      </div>
                    </div>

                    {/* Discovered Courses Preview Banner */}
                    {discoveredCourses.length > 0 && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            {discoveredCourses.length} {t.discoveredCrnsCount}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex flex-wrap gap-1.5">
                          {discoveredCourses.map((c) => {
                            const elig = checkCourseEligibility(c, currentUser.enrolledPrograms);
                            return (
                              <span
                                key={c.crn}
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                  elig.isEligible
                                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-200'
                                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300'
                                }`}
                                title={elig.isEligible ? 'Bölümünüze uygun' : `Kısıtlı: ${c.restrictions || 'Bölüm şartı'}`}
                              >
                                CRN {c.crn} ({c.remaining} boş) {elig.isEligible ? '✓ Uygun' : '⚠️ Kapalı'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* New CRN Alert Guarantee Notice */}
                    <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        {t.newCrnEmailNotice}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Pinned Action Buttons Footer */}
              <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs flex items-center justify-between gap-3">
                {onOpenItuBrowser ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenItuBrowser();
                    }}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{t.btnBrowseObs}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {t.btnCancel}
                  </button>
                  {!ineligibleGroupWarning && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                          <span>{t.gatheringFromObsModal}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.btnTrackCourseCodeSubmit}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
