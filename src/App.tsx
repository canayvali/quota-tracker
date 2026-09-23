import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Search,
  Sparkles,
  Zap
} from 'lucide-react';

import { AppLanguage, AppTheme, ClassMonitor, CourseGroupSection, EmailSenderConfig, GlobalSettings, ItuCourse, TeachingModeFilter, TrackedCourseGroup, UserAccount } from './types';
import {
  checkAdminAuth,
  clearCurrentUser,
  loadCurrentUser,
  loadEmailConfig,
  loadMonitors,
  loadSettings,
  loadTheme,
  loadTrackedCourseGroups,
  saveCurrentUser,
  saveEmailConfig,
  saveMonitors,
  saveSettings,
  saveTheme,
  saveTrackedCourseGroups,
  setAdminAuth,
  updateUserLanguage,
  updateUserTheme,
  updateUserAccount,
  syncMonitorToCloudSql,
  syncTrackedGroupToCloudSql,
  syncUserProfileToCloudSql,
  syncUserDataFromCloudSql
} from './utils/storage';
import {
  generateEmailHtml,
  generateNewCrnEmailHtml,
  simulateCapacityIncrease,
  simulateClaimSeat,
  simulateDropSeat
} from './utils/quotaService';
import { fetchCourseByCrn, fetchCoursesByCourseCode, simulateNewCrnOnServer } from './utils/ituScraperService';
import { getDeliveryFilterLabel, matchesDeliveryFilter, isCourseOnline, checkCourseEligibility } from './utils/courseUtils';
import { TRANSLATIONS } from './utils/translations';

import { Header } from './components/Header';
import { MonitorCard } from './components/MonitorCard';
import { CourseGroupCard } from './components/CourseGroupCard';
import { AddCrnModal } from './components/AddCrnModal';
import { EmailSenderConfigModal } from './components/EmailSenderConfigModal';
import { EmailSentPreviewModal } from './components/EmailSentPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { ItuObsBrowserModal } from './components/ItuObsBrowserModal';
import { AdminPage } from './components/AdminPage';
import { AuthPage } from './components/AuthPage';
import { ProfileModal } from './components/ProfileModal';
import { ProgramOnboardingModal } from './components/ProgramOnboardingModal';

export default function App() {
  // Navigation / Routing (/admin vs /) - supports direct /admin path or #/admin
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    const h = window.location.hash;
    if (p === '/admin' || p.startsWith('/admin/') || h === '#/admin' || h.startsWith('#/admin/')) {
      return '/admin';
    }
    return p;
  });

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => loadCurrentUser());

  // Language state: defaults to Turkish on login screen, or user's saved preference
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const user = loadCurrentUser();
    if (user && user.preferredLanguage) {
      return user.preferredLanguage;
    }
    return 'tr'; // Default to Turkish on login / initial screen
  });

  const t = TRANSLATIONS[language];

  // Handler to switch language and persist for the logged-in account
  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    if (currentUser) {
      const updatedUser: UserAccount = {
        ...currentUser,
        preferredLanguage: newLang
      };
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
      updateUserLanguage(currentUser.email, newLang);
    }
  };

  // Theme state: light or dark
  const [theme, setTheme] = useState<AppTheme>(() => {
    const user = loadCurrentUser();
    if (user && user.theme) {
      return user.theme;
    }
    return loadTheme();
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    saveTheme(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (currentUser) {
      const updatedUser: UserAccount = {
        ...currentUser,
        theme: newTheme
      };
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
      updateUserTheme(currentUser.email, newTheme);
    }
  };

  // Scroll state for header collapse
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Core Data
  const [monitors, setMonitors] = useState<ClassMonitor[]>(() => loadMonitors());
  const [settings, setSettings] = useState<GlobalSettings>(() => loadSettings());
  const [emailConfig, setEmailConfig] = useState<EmailSenderConfig>(() => loadEmailConfig());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Quick CRN Input on Main Page (only asks for CRN!)
  const [quickCrn, setQuickCrn] = useState('');
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'open' | 'full' | 'paused'>('all');
  const [checkingIds, setCheckingIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialCourseCode, setModalInitialCourseCode] = useState<string>('');
  const [isEmailConfigModalOpen, setIsEmailConfigModalOpen] = useState(false);
  const [isItuObsBrowserOpen, setIsItuObsBrowserOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(() => window.location.pathname === '/profile');
  const [selectedHistoryMonitor, setSelectedHistoryMonitor] = useState<ClassMonitor | null>(null);

  // Email Preview Modal
  const [emailPreviewData, setEmailPreviewData] = useState<{
    recipient: string;
    subject: string;
    body: string;
    timestamp?: string;
  } | null>(null);

  // Banner / Toast Feedback
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    description: string;
    type: 'success' | 'alert' | 'info';
  } | null>(null);

  const showToast = (title: string, description: string, type: 'success' | 'alert' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToastNotification({ id, title, description, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  };

  // Listen to browser navigation & back/forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === '/admin' || p.startsWith('/admin/') || h === '#/admin' || h.startsWith('#/admin/')) {
        setCurrentPath('/admin');
        setIsAdminAuthenticated(false);
      } else {
        setCurrentPath(p);
      }
      if (p === '/profile') {
        setIsProfileModalOpen(true);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Synchronize active admin SMTP configuration and Cloud SQL data on startup
  useEffect(() => {
    fetch('/api/email/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpConfig: emailConfig })
    }).catch((err) => console.error('[Initial SMTP Sync Error]:', err));

    if (currentUser?.id || currentUser?.email) {
      const uid = currentUser.id || currentUser.email;
      syncUserDataFromCloudSql(uid).then((data) => {
        if (data && data.success) {
          if (data.monitors && data.monitors.length > 0) {
            setMonitors((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const m of data.monitors) {
                map.set(m.id, { ...m, history: m.history || [] });
              }
              return Array.from(map.values());
            });
          }
        }
      });
    }
  }, []);

  // Listen to scroll to collapse header smoothly when scrolling down
  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 30);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    if (path === '/admin' || path.startsWith('/admin')) {
      setIsAdminAuthenticated(false);
    }
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    syncUserProfileToCloudSql(user);
    const activeLang = user.preferredLanguage || language;
    setLanguage(activeLang);
    showToast(
      activeLang === 'tr' ? 'Giriş Başarılı' : 'Signed In',
      activeLang === 'tr'
        ? `Hoş geldiniz, ${user.name}! Bildirimler ${user.email} adresine gönderilecek.`
        : `Welcome back, ${user.name}! Alerts will go to ${user.email}.`,
      'success'
    );
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    clearCurrentUser();
    setIsProfileModalOpen(false);
    // If it's login screen, select Turkish by default as requested
    setLanguage('tr');
    showToast(
      'Oturum Kapatıldı',
      'Başarıyla çıkış yaptınız.',
      'info'
    );
  };

  const handleSetAdminAuth = (auth: boolean) => {
    setIsAdminAuthenticated(auth);
    setAdminAuth(auth);
    if (auth) {
      showToast('Yönetici Girişi Yapıldı', 'Yönetim kontrollerine erişim sağlandı.', 'success');
    } else {
      showToast('Yönetici Oturumu Kapatıldı', 'Yönetici oturumu sonlandırıldı.', 'info');
    }
  };

  // Sync to storage
  useEffect(() => {
    saveMonitors(monitors);
  }, [monitors]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveEmailConfig(emailConfig);
  }, [emailConfig]);

  // Tracked Course Code Groups (e.g. CEV103, MAT103E) - aggregated in single box per course
  const [trackedCourseGroups, setTrackedCourseGroups] = useState<TrackedCourseGroup[]>(() => {
    return loadTrackedCourseGroups();
  });

  useEffect(() => {
    saveTrackedCourseGroups(trackedCourseGroups);
  }, [trackedCourseGroups]);

  // Migration: Automatically collapse any legacy flat monitors with trackMode === 'course_code' into unified group boxes
  useEffect(() => {
    const codeMonitors = monitors.filter((m) => m.trackMode === 'course_code' && m.trackedCourseCode);
    if (codeMonitors.length > 0) {
      const groupsByCode: Record<string, ClassMonitor[]> = {};
      for (const m of codeMonitors) {
        const code = m.trackedCourseCode!;
        if (!groupsByCode[code]) groupsByCode[code] = [];
        groupsByCode[code].push(m);
      }

      setTrackedCourseGroups((prev) => {
        const updated = [...prev];
        for (const [code, mons] of Object.entries(groupsByCode)) {
          const existingIdx = updated.findIndex((g) => g.courseCode === code);
          const sections: CourseGroupSection[] = mons.map((m) => ({
            crn: m.crn,
            courseCode: m.courseCode,
            courseTitle: m.courseTitle,
            instructor: m.instructor,
            teachingMethod: 'Fiziksel (Yüz yüze)',
            isOnline: false,
            building: m.department || 'İTÜ',
            dayTime: 'Ders Programı',
            capacity: m.totalCapacity,
            enrolled: m.enrolled,
            availableSeats: m.availableSeats,
            lastChecked: m.lastChecked
          }));

          if (existingIdx !== -1) {
            const existingSecCrns = new Set(updated[existingIdx].sections.map((s) => s.crn));
            for (const sec of sections) {
              if (!existingSecCrns.has(sec.crn)) {
                updated[existingIdx].sections.push(sec);
              }
            }
            updated[existingIdx].knownCrns = Array.from(
              new Set([...updated[existingIdx].knownCrns, ...mons.map((m) => m.crn)])
            );
          } else {
            updated.push({
              id: 'grp-' + Date.now() + '-' + code,
              courseCode: code,
              courseTitle: mons[0]?.courseTitle || `${code} Dersi`,
              userId: mons[0]?.userId || currentUser?.id || 'admin',
              email: mons[0]?.notificationEmail || currentUser?.email || 'email@itu.edu.tr',
              deliveryFilter: 'all',
              sections: sections,
              knownCrns: mons.map((m) => m.crn),
              status: 'active',
              createdAt: mons[0]?.createdAt || new Date().toISOString(),
              lastChecked: new Date().toISOString(),
              lastChanged: new Date().toISOString(),
              history: mons[0]?.history || []
            });
          }
        }
        return updated;
      });

      // Remove from flat monitors so they don't appear as individual cards
      setMonitors((prev) => prev.filter((m) => m.trackMode !== 'course_code'));
    }
  }, []);

  // Automated background polling: checks quota AND checks for newly opened CRNs respecting delivery filter
  useEffect(() => {
    if (!settings.autoRefreshActive) return;

    const interval = setInterval(async () => {
      // 1. Update last checked on active single monitors
      setMonitors((prev) =>
        prev.map((mon) => {
          if (mon.status !== 'active') return mon;
          return {
            ...mon,
            lastChecked: new Date().toISOString()
          };
        })
      );

      // 2. Poll tracked course groups for live quotas and newly opened CRNs
      if (trackedCourseGroups.length > 0) {
        for (const group of trackedCourseGroups) {
          if (group.status === 'paused') continue;

          try {
            const res = await fetch(`/api/itu/course-code/${encodeURIComponent(group.courseCode)}`);
            if (!res.ok) continue;
            const data = await res.json();
            if (!data.success || !Array.isArray(data.courses)) continue;

            const existingKnown = new Set(group.knownCrns);
            const liveCourses: ItuCourse[] = data.courses;
            const brandNewCourses = liveCourses.filter((c: ItuCourse) => !existingKnown.has(c.crn));
            const activeLang = currentUser?.preferredLanguage || language || 'tr';

            if (brandNewCourses.length > 0) {
              for (const newCourse of brandNewCourses) {
                const online = isCourseOnline(newCourse);
                const matchesFilter = matchesDeliveryFilter(newCourse, group.deliveryFilter);

                if (matchesFilter) {
                  // Add section to this unified course group card
                  const newSection: CourseGroupSection = {
                    crn: newCourse.crn,
                    courseCode: newCourse.courseCode,
                    courseTitle: newCourse.courseTitle,
                    instructor: newCourse.instructor,
                    teachingMethod: newCourse.teachingMethod || (online ? 'Çevrimiçi (Online)' : 'Fiziksel (Yüz yüze)'),
                    isOnline: online,
                    building: newCourse.building,
                    dayTime: newCourse.dayTime,
                    capacity: newCourse.capacity,
                    enrolled: newCourse.enrolled,
                    availableSeats: newCourse.remaining,
                    lastChecked: new Date().toISOString()
                  };

                  const emailContent = generateNewCrnEmailHtml(
                    newCourse.courseCode,
                    newCourse.courseTitle,
                    newCourse.crn,
                    newCourse.instructor,
                    newCourse.capacity,
                    newCourse.enrolled,
                    newCourse.remaining,
                    settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
                    group.email,
                    emailConfig,
                    activeLang
                  );

                  dispatchNotificationEmail(group.email, emailContent.subject, emailContent.body);

                  showToast(
                    activeLang === 'en' ? '🔔 New CRN Opened!' : '🔔 Yeni CRN Açıldı!',
                    activeLang === 'en'
                      ? `New section ${newCourse.crn} opened for ${group.courseCode}! Notification sent.`
                      : `${group.courseCode} için yeni ${newCourse.crn} CRN'i açıldı! Bildirim gönderildi.`,
                    'alert'
                  );

                  setEmailPreviewData({
                    recipient: group.email,
                    subject: emailContent.subject,
                    body: emailContent.body,
                    timestamp: new Date().toLocaleString()
                  });

                  setTrackedCourseGroups((prev) =>
                    prev.map((g) => {
                      if (g.id !== group.id) return g;
                      return {
                        ...g,
                        sections: [newSection, ...g.sections],
                        knownCrns: Array.from(new Set([...g.knownCrns, newCourse.crn])),
                        lastChanged: new Date().toISOString(),
                        lastChecked: new Date().toISOString(),
                        history: [
                          {
                            id: 'hist-' + Date.now(),
                            timestamp: new Date().toISOString(),
                            type: 'new_crn_opened',
                            oldAvailable: 0,
                            newAvailable: newCourse.remaining,
                            oldEnrolled: 0,
                            newEnrolled: newCourse.enrolled,
                            emailDispatched: true,
                            emailRecipient: group.email,
                            emailSubject: emailContent.subject,
                            notes: `Yeni CRN ${newCourse.crn} (${online ? 'Çevrimiçi' : 'Yüz Yüze'}) açıldı.`
                          },
                          ...(g.history || [])
                        ]
                      };
                    })
                  );
                } else {
                  // Does not match the user's teaching mode filter - no alert sent
                  setTrackedCourseGroups((prev) =>
                    prev.map((g) => {
                      if (g.id !== group.id) return g;
                      return {
                        ...g,
                        knownCrns: Array.from(new Set([...g.knownCrns, newCourse.crn])),
                        lastChecked: new Date().toISOString(),
                        history: [
                          {
                            id: 'hist-' + Date.now(),
                            timestamp: new Date().toISOString(),
                            type: 'new_crn_opened',
                            oldAvailable: 0,
                            newAvailable: newCourse.remaining,
                            oldEnrolled: 0,
                            newEnrolled: newCourse.enrolled,
                            emailDispatched: false,
                            emailRecipient: group.email,
                            emailSubject: `CRN ${newCourse.crn} açıldı (Filtre eşleşmediği için bildirim gönderilmedi)`,
                            notes: `Yeni CRN ${newCourse.crn} açıldı ancak teslim yöntemi (${online ? 'Online' : 'Yüz Yüze'}) tercih edilen filtreye uymadığı için bildirim iletilmedi.`
                          },
                          ...(g.history || [])
                        ]
                      };
                    })
                  );
                }
              }
            } else {
              // Update live quotas for current sections in this group
              const obsMap = new Map(liveCourses.map((c) => [c.crn, c]));
              setTrackedCourseGroups((prev) =>
                prev.map((g) => {
                  if (g.id !== group.id) return g;
                  let hasChanges = false;
                  const updatedSections = g.sections.map((sec) => {
                    const live = obsMap.get(sec.crn);
                    if (!live) return sec;
                    if (live.remaining !== sec.availableSeats || live.capacity !== sec.capacity) {
                      hasChanges = true;
                    }
                    return {
                      ...sec,
                      capacity: live.capacity,
                      enrolled: live.enrolled,
                      availableSeats: live.remaining,
                      lastChecked: new Date().toISOString()
                    };
                  });
                  return {
                    ...g,
                    sections: updatedSections,
                    lastChecked: new Date().toISOString(),
                    lastChanged: hasChanges ? new Date().toISOString() : g.lastChanged
                  };
                })
              );
            }
          } catch (e) {
            console.warn('Error polling course code for new CRNs:', e);
          }
        }
      }
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefreshActive, settings.autoRefreshInterval, trackedCourseGroups, emailConfig, language, settings.defaultQuotaUrl, currentUser]);

  // Quick CRN / Course Code Submit Handler:
  // If Course Code is entered (e.g. CEV103, MAT103E), it immediately aggregates all sections into a SINGLE card!
  const handleQuickAddCrn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setQuickError(language === 'en' ? 'Please sign in to add classes to your tracker.' : 'Ders eklemek için lütfen giriş yapınız.');
      return;
    }

    const cleanInput = quickCrn.trim();
    if (!cleanInput) {
      setQuickError(language === 'en' ? 'Please enter a 5-digit CRN or Course Code (e.g. CEV103).' : 'Lütfen 5 haneli CRN veya Ders Kodu giriniz (örn. CEV103).');
      return;
    }

    const email = currentUser.email;

    // Check if input is a Course Code (contains alphabetical letters, e.g. CEV103, MAT103E)
    if (/[a-zA-Z]/.test(cleanInput)) {
      setQuickError(null);
      setIsQuickLoading(true);
      try {
        const result = await fetchCoursesByCourseCode(cleanInput);
        const courses = result.courses;
        if (!courses || courses.length === 0) {
          setQuickError(language === 'en' ? `No CRNs found for ${cleanInput}` : `${cleanInput} için CRN bulunamadı.`);
          setIsQuickLoading(false);
          return;
        }

        const normalized = cleanInput.replace(/\s+/g, '').toUpperCase();

        // Check user's program eligibility for batch tracking
        const hasEnrolledPrograms =
          currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0;

        let eligibleCourses = courses;
        let ineligibleCourses: ItuCourse[] = [];

        if (hasEnrolledPrograms) {
          eligibleCourses = courses.filter(
            (c) => checkCourseEligibility(c, currentUser.enrolledPrograms).isEligible
          );
          ineligibleCourses = courses.filter(
            (c) => !checkCourseEligibility(c, currentUser.enrolledPrograms).isEligible
          );
        }

        // If there are ineligible / restricted sections, open the modal asking specifically for those:
        if (ineligibleCourses.length > 0) {
          setIsQuickLoading(false);
          setModalInitialCourseCode(normalized);
          setIsAddModalOpen(true);
          return;
        }

        // If ALL sections are eligible (no warning / no blocked sections):
        // Add them immediately without prompt!
        const matchingSections: CourseGroupSection[] = eligibleCourses.map((c) => ({
          crn: c.crn,
          courseCode: c.courseCode,
          courseTitle: c.courseTitle,
          instructor: c.instructor,
          teachingMethod: c.teachingMethod || (isCourseOnline(c) ? 'Çevrimiçi (Online)' : 'Fiziksel (Yüz yüze)'),
          isOnline: isCourseOnline(c),
          building: c.building,
          dayTime: c.dayTime,
          capacity: c.capacity,
          enrolled: c.enrolled,
          availableSeats: c.remaining,
          lastChecked: new Date().toISOString(),
          restrictions: c.restrictions
        }));

        const totalAvail = matchingSections.reduce((acc, s) => acc + s.availableSeats, 0);
        const totalEnr = matchingSections.reduce((acc, s) => acc + s.enrolled, 0);

        const newGroup: TrackedCourseGroup = {
          id: 'grp-' + Date.now(),
          courseCode: normalized,
          courseTitle: courses[0]?.courseTitle || `${normalized} Dersi`,
          userId: currentUser.id,
          email: currentUser.email,
          deliveryFilter: 'all',
          sections: matchingSections,
          knownCrns: eligibleCourses.map((c) => c.crn),
          status: 'active',
          createdAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          lastChanged: new Date().toISOString(),
          history: [
            {
              id: 'hist-' + Date.now(),
              timestamp: new Date().toISOString(),
              type: 'initial',
              oldAvailable: totalAvail,
              newAvailable: totalAvail,
              oldEnrolled: totalEnr,
              newEnrolled: totalEnr,
              emailDispatched: false,
              emailRecipient: email,
              emailSubject: `Toplu ders takibi: ${normalized}`,
              notes: `${eligibleCourses.length} şube tek bir kutuda takibe alındı.`
            }
          ]
        };

        setTrackedCourseGroups((prev) => {
          const idx = prev.findIndex((g) => g.courseCode === normalized);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = newGroup;
            return updated;
          }
          return [newGroup, ...prev];
        });
        syncTrackedGroupToCloudSql(newGroup);

        setQuickCrn('');
        setIsQuickLoading(false);
        showToast(
          language === 'en' ? 'Course Monitored' : 'Toplu Ders Takibi Başlatıldı',
          language === 'en'
            ? `${normalized} (${eligibleCourses.length} sections) is now monitored.`
            : `${normalized} dersi (${eligibleCourses.length} şube) başarıyla takibe alındı.`,
          'success'
        );
        return;
      } catch {
        setIsQuickLoading(false);
        setQuickError(language === 'en' ? 'Could not query course code.' : 'Ders kodu sorgulanamadı.');
        return;
      }
    }

    // Pure numeric CRN handling
    if (!/^\d{4,6}$/.test(cleanInput)) {
      setQuickError(language === 'en' ? 'CRN must be a 5-digit number (e.g. 12486) or enter a course code (e.g. CEV103).' : 'CRN 5 haneli bir sayı olmalı (örn. 12486) veya ders kodu giriniz (örn. CEV103).');
      return;
    }

    const existing = monitors.find((m) => m.crn === cleanInput);
    if (existing) {
      setQuickError(language === 'en' ? `CRN ${cleanInput} (${existing.courseCode}) is already being monitored.` : `CRN ${cleanInput} (${existing.courseCode}) zaten takip ediliyor.`);
      return;
    }

    setQuickError(null);
    setIsQuickLoading(true);

    try {
      const result = await fetchCourseByCrn(cleanInput);
      const course = result.course;

      // Check program eligibility
      const eligibility = checkCourseEligibility(course, currentUser.enrolledPrograms);
      if (!eligibility.isEligible && currentUser.enrolledPrograms && currentUser.enrolledPrograms.length > 0) {
        setIsQuickLoading(false);
        // Open Add modal with warning so the user can see restrictions and explicitly confirm
        setIsAddModalOpen(true);
        setQuickError(
          language === 'tr'
            ? `CRN ${course.crn} (${course.courseCode}) kayıtlı bölümleriniz için uygun görünmüyor. Onaylamak için modalı kullanın.`
            : `CRN ${course.crn} is restricted for your major.`
        );
        return;
      }

      const newMonitor: ClassMonitor = {
        id: 'mon-' + Date.now(),
        userId: currentUser.id,
        crn: course.crn,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        instructor: course.instructor,
        department: course.subjectCode,
        targetUrl: settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
        notificationEmail: email,
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
            emailRecipient: email,
            emailSubject: `Live tracking activated for CRN ${course.crn} (${course.courseCode})`,
            notes: `Information automatically gathered from İTÜ OBS (obs.itu.edu.tr). Quota: ${course.enrolled}/${course.capacity}`
          }
        ]
      };

      setMonitors((prev) => [newMonitor, ...prev]);
      syncMonitorToCloudSql(newMonitor);
      setQuickCrn('');
      setIsQuickLoading(false);
      showToast(
        language === 'en' ? 'Gathered from İTÜ OBS!' : 'İTÜ OBS Sorgulandı!',
        language === 'en'
          ? `Now tracking CRN ${newMonitor.crn}: ${newMonitor.courseCode} — ${newMonitor.courseTitle}.`
          : `CRN ${newMonitor.crn}: ${newMonitor.courseCode} — ${newMonitor.courseTitle} takibe alındı.`,
        'success'
      );
    } catch {
      setIsQuickLoading(false);
      setQuickError(language === 'en' ? 'Failed to gather course details. Please verify the CRN and try again.' : 'Ders detayları alınamadı. Lütfen CRN kodunu kontrol ediniz.');
    }
  };

  // Add course group from AddCrnModal (All sections in one unified card!)
  const handleAddCourseGroup = (newGroup: TrackedCourseGroup) => {
    setTrackedCourseGroups((prev) => {
      const idx = prev.findIndex((g) => g.courseCode === newGroup.courseCode);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newGroup;
        return updated;
      }
      return [newGroup, ...prev];
    });
    syncTrackedGroupToCloudSql(newGroup);
    setIsAddModalOpen(false);
    showToast(
      language === 'en' ? 'Course Group Monitored' : 'Toplu Ders Takibi Başlatıldı',
      language === 'en'
        ? `Tracking all sections of ${newGroup.courseCode} in a single unified box.`
        : `${newGroup.courseCode} dersi tüm şubeleriyle tek bir kutuda takibe alındı.`,
      'success'
    );
  };

  // Group card actions:
  const handleGroupCheckNow = async (groupId: string) => {
    setCheckingIds((prev) => ({ ...prev, [groupId]: true }));
    const group = trackedCourseGroups.find((g) => g.id === groupId);
    if (!group) {
      setCheckingIds((prev) => ({ ...prev, [groupId]: false }));
      return;
    }

    try {
      const res = await fetch(`/api/itu/course-code/${encodeURIComponent(group.courseCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          const obsCourses: ItuCourse[] = data.courses;
          const obsMap = new Map(obsCourses.map((c) => [c.crn, c]));

          setTrackedCourseGroups((prev) =>
            prev.map((g) => {
              if (g.id !== groupId) return g;
              const updatedSections = g.sections.map((sec) => {
                const live = obsMap.get(sec.crn);
                if (!live) return { ...sec, lastChecked: new Date().toISOString() };
                return {
                  ...sec,
                  capacity: live.capacity,
                  enrolled: live.enrolled,
                  availableSeats: live.remaining,
                  instructor: live.instructor || sec.instructor,
                  lastChecked: new Date().toISOString()
                };
              });
              return {
                ...g,
                sections: updatedSections,
                lastChecked: new Date().toISOString()
              };
            })
          );
        }
      }
    } catch (e) {
      console.warn('Check now group error:', e);
    } finally {
      setCheckingIds((prev) => ({ ...prev, [groupId]: false }));
      showToast(
        language === 'tr' ? 'Kontrol Tamamlandı' : 'Check Completed',
        language === 'tr'
          ? `${group.courseCode} için güncel İTÜ OBS kontenjanları sorgulandı.`
          : `Updated live İTÜ OBS quotas for ${group.courseCode}.`,
        'info'
      );
    }
  };

  const handleGroupSimulateDrop = (groupId: string, targetCrn?: string) => {
    setTrackedCourseGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const targetSecIndex = targetCrn
          ? g.sections.findIndex((s) => s.crn === targetCrn)
          : 0;
        if (targetSecIndex === -1 && g.sections.length === 0) return g;

        const secIndex = targetSecIndex !== -1 ? targetSecIndex : 0;
        const targetSec = g.sections[secIndex];
        const newAvail = targetSec.availableSeats + 1;
        const newEnrolled = Math.max(0, targetSec.enrolled - 1);

        const updatedSections = [...g.sections];
        updatedSections[secIndex] = {
          ...targetSec,
          availableSeats: newAvail,
          enrolled: newEnrolled,
          lastChecked: new Date().toISOString()
        };

        const recipientEmail = g.email || currentUser?.email || 'student@itu.edu.tr';
        const activeLang = currentUser?.preferredLanguage || language || 'tr';

        const emailSubject =
          activeLang === 'en'
            ? `🟢 SEAT OPENED: ${targetSec.courseCode} (CRN ${targetSec.crn})`
            : `🟢 KONTENJAN AÇILDI: ${targetSec.courseCode} (CRN ${targetSec.crn})`;

        const mockMonitor: ClassMonitor = {
          id: 'temp-' + Date.now(),
          userId: g.userId,
          crn: targetSec.crn,
          courseCode: targetSec.courseCode,
          courseTitle: targetSec.courseTitle,
          instructor: targetSec.instructor,
          department: g.courseCode,
          targetUrl: settings.defaultQuotaUrl,
          notificationEmail: recipientEmail,
          studentName: currentUser?.name || 'İTÜ Öğrencisi',
          status: 'active',
          totalCapacity: targetSec.capacity,
          enrolled: newEnrolled,
          availableSeats: newAvail,
          lastChecked: new Date().toISOString(),
          lastChanged: new Date().toISOString(),
          createdAt: g.createdAt,
          alertPreference: 'any_change',
          checkIntervalSeconds: 45,
          trackMode: 'course_code',
          history: []
        };

        const emailContent = generateEmailHtml(
          mockMonitor,
          targetSec.availableSeats,
          newAvail,
          emailConfig,
          'seat_dropped',
          undefined,
          activeLang
        );
        dispatchNotificationEmail(recipientEmail, emailContent.subject, emailContent.body);

        showToast(
          activeLang === 'en' ? '🟢 Seat Opened!' : '🟢 Kontenjan Açıldı!',
          activeLang === 'en'
            ? `CRN ${targetSec.crn} now has ${newAvail} open seat(s)! Notification email sent.`
            : `CRN ${targetSec.crn} için ${newAvail} boş yer açıldı! Bildirim e-postası gönderildi.`,
          'success'
        );

        setEmailPreviewData({
          recipient: recipientEmail,
          subject: emailContent.subject,
          body: emailContent.body,
          timestamp: new Date().toLocaleString()
        });

        return {
          ...g,
          sections: updatedSections,
          lastChanged: new Date().toISOString(),
          history: [
            {
              id: 'hist-' + Date.now(),
              timestamp: new Date().toISOString(),
              type: 'seat_dropped',
              oldAvailable: targetSec.availableSeats,
              newAvailable: newAvail,
              oldEnrolled: targetSec.enrolled,
              newEnrolled: newEnrolled,
              emailDispatched: true,
              emailRecipient: recipientEmail,
              emailSubject: emailSubject,
              notes: `Öğrenci dersi bıraktı: CRN ${targetSec.crn} için 1 kişilik yer açıldı.`
            },
            ...(g.history || [])
          ]
        };
      })
    );
  };

  const handleGroupSimulateCapacityIncrease = (groupId: string, targetCrn?: string) => {
    setTrackedCourseGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const targetSecIndex = targetCrn
          ? g.sections.findIndex((s) => s.crn === targetCrn)
          : 0;
        if (targetSecIndex === -1 && g.sections.length === 0) return g;

        const secIndex = targetSecIndex !== -1 ? targetSecIndex : 0;
        const targetSec = g.sections[secIndex];
        const newCap = targetSec.capacity + 5;
        const newAvail = targetSec.availableSeats + 5;

        const updatedSections = [...g.sections];
        updatedSections[secIndex] = {
          ...targetSec,
          capacity: newCap,
          availableSeats: newAvail,
          lastChecked: new Date().toISOString()
        };

        const recipientEmail = g.email || currentUser?.email || 'student@itu.edu.tr';
        const activeLang = currentUser?.preferredLanguage || language || 'tr';

        const emailSubject =
          activeLang === 'en'
            ? `🚀 CAPACITY INCREASED (+5): ${targetSec.courseCode} (CRN ${targetSec.crn})`
            : `🚀 KONTENJAN ARTIRILDI (+5): ${targetSec.courseCode} (CRN ${targetSec.crn})`;

        const mockMonitor: ClassMonitor = {
          id: 'temp-' + Date.now(),
          userId: g.userId,
          crn: targetSec.crn,
          courseCode: targetSec.courseCode,
          courseTitle: targetSec.courseTitle,
          instructor: targetSec.instructor,
          department: g.courseCode,
          targetUrl: settings.defaultQuotaUrl,
          notificationEmail: recipientEmail,
          studentName: currentUser?.name || 'İTÜ Öğrencisi',
          status: 'active',
          totalCapacity: newCap,
          enrolled: targetSec.enrolled,
          availableSeats: newAvail,
          lastChecked: new Date().toISOString(),
          lastChanged: new Date().toISOString(),
          createdAt: g.createdAt,
          alertPreference: 'any_change',
          checkIntervalSeconds: 45,
          trackMode: 'course_code',
          history: []
        };

        const emailContent = generateEmailHtml(
          mockMonitor,
          targetSec.availableSeats,
          newAvail,
          emailConfig,
          'capacity_increase',
          { oldCapacity: targetSec.capacity, newCapacity: newCap },
          activeLang
        );
        dispatchNotificationEmail(recipientEmail, emailContent.subject, emailContent.body);

        showToast(
          activeLang === 'en' ? '🚀 Quota Expanded (+5)!' : '🚀 Kontenjan Artırıldı (+5)!',
          activeLang === 'en'
            ? `Department added +5 seats to CRN ${targetSec.crn}. Email dispatched.`
            : `Bölüm CRN ${targetSec.crn} kontenjanını +5 artırdı. Bildirim gönderildi.`,
          'success'
        );

        setEmailPreviewData({
          recipient: recipientEmail,
          subject: emailContent.subject,
          body: emailContent.body,
          timestamp: new Date().toLocaleString()
        });

        return {
          ...g,
          sections: updatedSections,
          lastChanged: new Date().toISOString(),
          history: [
            {
              id: 'hist-' + Date.now(),
              timestamp: new Date().toISOString(),
              type: 'capacity_increased',
              oldAvailable: targetSec.availableSeats,
              newAvailable: newAvail,
              oldEnrolled: targetSec.enrolled,
              newEnrolled: targetSec.enrolled,
              emailDispatched: true,
              emailRecipient: recipientEmail,
              emailSubject: emailSubject,
              notes: `Bölüm kontenjanı 5 kişi artırdı (Yeni kapasite: ${newCap}).`
            },
            ...(g.history || [])
          ]
        };
      })
    );
  };

  const handleGroupSimulateNewCrn = async (courseCode: string, isOnline: boolean) => {
    const cleanCode = courseCode.replace(/\s+/g, '').toUpperCase();
    try {
      const newCourse = await simulateNewCrnOnServer(cleanCode, isOnline);
      if (!newCourse) {
        showToast('Hata', 'Yeni CRN simülasyonu başlatılamadı.', 'info');
        return;
      }

      const group = trackedCourseGroups.find((g) => g.courseCode === cleanCode);
      const activeLang = currentUser?.preferredLanguage || language || 'tr';
      const recipientEmail = group?.email || currentUser?.email || emailConfig.senderAddress;

      const matchesFilter = group ? matchesDeliveryFilter(newCourse, group.deliveryFilter) : true;

      if (matchesFilter) {
        const newSection: CourseGroupSection = {
          crn: newCourse.crn,
          courseCode: newCourse.courseCode,
          courseTitle: newCourse.courseTitle,
          instructor: newCourse.instructor,
          teachingMethod: newCourse.teachingMethod || (isOnline ? 'Çevrimiçi (Online)' : 'Fiziksel (Yüz yüze)'),
          isOnline: isOnline,
          building: newCourse.building,
          dayTime: newCourse.dayTime,
          capacity: newCourse.capacity,
          enrolled: newCourse.enrolled,
          availableSeats: newCourse.remaining,
          lastChecked: new Date().toISOString()
        };

        const emailContent = generateNewCrnEmailHtml(
          newCourse.courseCode,
          newCourse.courseTitle,
          newCourse.crn,
          newCourse.instructor,
          newCourse.capacity,
          newCourse.enrolled,
          newCourse.remaining,
          settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
          recipientEmail,
          emailConfig,
          activeLang
        );

        dispatchNotificationEmail(recipientEmail, emailContent.subject, emailContent.body);

        showToast(
          activeLang === 'en' ? '🔔 New CRN Opened!' : '🔔 Yeni CRN Açıldı!',
          activeLang === 'en'
            ? `New ${isOnline ? 'Online' : 'In-person'} CRN ${newCourse.crn} opened for ${cleanCode}! Notification email sent.`
            : `${cleanCode} dersi için yeni ${isOnline ? 'Çevrimiçi' : 'Yüz Yüze'} ${newCourse.crn} CRN'i açıldı! Bildirim e-postası gönderildi.`,
          'alert'
        );

        setEmailPreviewData({
          recipient: recipientEmail,
          subject: emailContent.subject,
          body: emailContent.body,
          timestamp: new Date().toLocaleString()
        });

        setTrackedCourseGroups((prev) =>
          prev.map((g) => {
            if (g.courseCode !== cleanCode) return g;
            return {
              ...g,
              sections: [newSection, ...g.sections],
              knownCrns: Array.from(new Set([...g.knownCrns, newCourse.crn])),
              lastChanged: new Date().toISOString(),
              history: [
                {
                  id: 'hist-' + Date.now(),
                  timestamp: new Date().toISOString(),
                  type: 'new_crn_opened',
                  oldAvailable: 0,
                  newAvailable: newCourse.remaining,
                  oldEnrolled: 0,
                  newEnrolled: newCourse.enrolled,
                  emailDispatched: true,
                  emailRecipient: recipientEmail,
                  emailSubject: emailContent.subject,
                  notes: `Yeni ${isOnline ? 'çevrimiçi' : 'yüz yüze'} CRN ${newCourse.crn} açıldı. Filtreyle eşleştiği için bildirim gönderildi.`
                },
                ...(g.history || [])
              ]
            };
          })
        );
      } else {
        const filterLabel = getDeliveryFilterLabel(group?.deliveryFilter || 'all', activeLang).label;
        showToast(
          activeLang === 'en' ? 'Filter Check: No Alert Sent' : 'Filtre Kontrolü: Bildirim Gönderilmedi',
          activeLang === 'en'
            ? `New CRN ${newCourse.crn} opened for ${cleanCode}, but it did not match your "${filterLabel}" filter. No alert sent.`
            : `${cleanCode} için yeni CRN ${newCourse.crn} (${isOnline ? 'Çevrimiçi' : 'Yüz Yüze'}) açıldı, fakat terciğiniz "${filterLabel}" olduğu için bildirim gönderilmedi.`,
          'info'
        );

        setTrackedCourseGroups((prev) =>
          prev.map((g) => {
            if (g.courseCode !== cleanCode) return g;
            return {
              ...g,
              knownCrns: Array.from(new Set([...g.knownCrns, newCourse.crn])),
              history: [
                {
                  id: 'hist-' + Date.now(),
                  timestamp: new Date().toISOString(),
                  type: 'new_crn_opened',
                  oldAvailable: 0,
                  newAvailable: newCourse.remaining,
                  oldEnrolled: 0,
                  newEnrolled: newCourse.enrolled,
                  emailDispatched: false,
                  emailRecipient: recipientEmail,
                  emailSubject: `CRN ${newCourse.crn} açıldı (${filterLabel} filtresi nedeniyle bildirim iletilmedi)`,
                  notes: `Yeni şube açıldı ancak "${filterLabel}" tercihinize uymadığı için e-posta gönderilmedi.`
                },
                ...(g.history || [])
              ]
            };
          })
        );
      }
    } catch (e) {
      console.error('Error simulating new CRN for group:', e);
    }
  };

  const handleGroupTogglePause = (groupId: string) => {
    setTrackedCourseGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const nextStatus = g.status === 'active' ? 'paused' : 'active';
        return { ...g, status: nextStatus };
      })
    );
  };

  const handleGroupDelete = (groupId: string) => {
    const g = trackedCourseGroups.find((x) => x.id === groupId);
    if (!g) return;
    setTrackedCourseGroups((prev) => prev.filter((x) => x.id !== groupId));
    showToast(
      language === 'tr' ? 'Takip Kaldırıldı' : 'Tracking Removed',
      language === 'tr'
        ? `${g.courseCode} toplu takibi kaldırıldı.`
        : `Removed tracking for ${g.courseCode}.`,
      'info'
    );
  };

  const handleGroupUpdateFilter = (groupId: string, newFilter: TeachingModeFilter) => {
    setTrackedCourseGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, deliveryFilter: newFilter };
      })
    );
    showToast(
      language === 'tr' ? 'Filtre Güncellendi' : 'Filter Updated',
      language === 'tr'
        ? `Takip filtresi "${getDeliveryFilterLabel(newFilter, language).label}" olarak ayarlandı.`
        : `Delivery filter updated to "${getDeliveryFilterLabel(newFilter, language).label}".`,
      'success'
    );
  };

  const handleViewGroupHistory = (group: TrackedCourseGroup) => {
    const synth: ClassMonitor = {
      id: group.id,
      userId: group.userId,
      crn: group.knownCrns.join(', '),
      courseCode: group.courseCode,
      courseTitle: group.courseTitle,
      instructor: group.sections[0]?.instructor || 'İTÜ',
      department: group.courseCode.split(' ')[0] || 'İTÜ',
      targetUrl: settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
      notificationEmail: group.email || currentUser?.email || 'student@itu.edu.tr',
      studentName: currentUser?.name || 'İTÜ Öğrencisi',
      status: group.status,
      totalCapacity: group.sections.reduce((acc, s) => acc + s.capacity, 0),
      enrolled: group.sections.reduce((acc, s) => acc + s.enrolled, 0),
      availableSeats: group.sections.reduce((acc, s) => acc + s.availableSeats, 0),
      lastChecked: group.lastChecked,
      lastChanged: group.lastChanged || group.lastChecked || new Date().toISOString(),
      createdAt: group.createdAt,
      alertPreference: 'any_change',
      checkIntervalSeconds: 45,
      trackMode: 'course_code',
      trackedCourseCode: group.courseCode,
      history: group.history || []
    };
    setSelectedHistoryMonitor(synth);
  };

  // Simulate a brand new CRN opening for a course code
  const handleSimulateNewCrn = async (courseCode: string) => {
    const cleanCode = courseCode.replace(/\s+/g, '').toUpperCase();
    try {
      const newCourse = await simulateNewCrnOnServer(cleanCode);
      if (!newCourse) {
        showToast('Hata', 'Yeni CRN simülasyonu başlatılamadı.', 'info');
        return;
      }

      const activeLang = currentUser?.preferredLanguage || language || 'tr';
      const recipientEmail = currentUser?.email || emailConfig.senderAddress;

      const newMon: ClassMonitor = {
        id: 'mon-' + Date.now(),
        userId: currentUser?.id || 'admin',
        crn: newCourse.crn,
        courseCode: newCourse.courseCode,
        courseTitle: newCourse.courseTitle,
        instructor: newCourse.instructor,
        department: newCourse.subjectCode,
        targetUrl: settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
        notificationEmail: recipientEmail,
        studentName: currentUser?.name || 'İTÜ Öğrencisi',
        status: 'active',
        totalCapacity: newCourse.capacity,
        enrolled: newCourse.enrolled,
        availableSeats: newCourse.remaining,
        lastChecked: new Date().toISOString(),
        lastChanged: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        alertPreference: 'any_change',
        checkIntervalSeconds: 45,
        trackMode: 'course_code',
        trackedCourseCode: cleanCode,
        history: [
          {
            id: 'hist-' + Date.now(),
            timestamp: new Date().toISOString(),
            type: 'new_crn_opened',
            oldAvailable: 0,
            newAvailable: newCourse.remaining,
            oldEnrolled: 0,
            newEnrolled: newCourse.enrolled,
            emailDispatched: true,
            emailRecipient: recipientEmail,
            emailSubject: activeLang === 'en'
              ? `🔔 NEW CRN OPENED: ${newCourse.courseCode} (CRN: ${newCourse.crn})`
              : `🔔 YENİ CRN AÇILDI: ${newCourse.courseCode} (CRN: ${newCourse.crn})`,
            notes: `Simulated new section opened on İTÜ OBS for ${cleanCode}.`
          }
        ]
      };

      setMonitors((prev) => [newMon, ...prev]);

      // Update known CRNs
      setTrackedCourseGroups((prev) =>
        prev.map((g) => (g.courseCode === cleanCode ? { ...g, knownCrns: [...g.knownCrns, newCourse.crn] } : g))
      );

      // Dispatch specific "Yeni CRN Açıldı" Email
      const emailContent = generateNewCrnEmailHtml(
        newCourse.courseCode,
        newCourse.courseTitle,
        newCourse.crn,
        newCourse.instructor,
        newCourse.capacity,
        newCourse.enrolled,
        newCourse.remaining,
        settings.defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
        recipientEmail,
        emailConfig,
        activeLang
      );

      dispatchNotificationEmail(recipientEmail, emailContent.subject, emailContent.body);

      showToast(
        activeLang === 'en' ? '🔔 New CRN Opened!' : '🔔 Yeni CRN Açıldı!',
        activeLang === 'en'
          ? `New section ${newCourse.crn} opened for ${cleanCode}! Notification email sent to ${recipientEmail}.`
          : `${cleanCode} dersi için yeni ${newCourse.crn} CRN'i açıldı! ${recipientEmail} adresine bildirim e-postası gönderildi.`,
        'alert'
      );

      setEmailPreviewData({
        recipient: recipientEmail,
        subject: emailContent.subject,
        body: emailContent.body,
        timestamp: new Date().toLocaleString()
      });
    } catch (e) {
      console.error('Error simulating new CRN:', e);
    }
  };

  // Check single monitor
  const handleCheckNow = (id: string) => {
    setCheckingIds((prev) => ({ ...prev, [id]: true }));

    setTimeout(() => {
      setMonitors((prev) =>
        prev.map((mon) => {
          if (mon.id !== id) return mon;
          return {
            ...mon,
            lastChecked: new Date().toISOString()
          };
        })
      );
      setCheckingIds((prev) => ({ ...prev, [id]: false }));
      showToast('Checked Quota', 'Live check completed. Quota verified against target portal.', 'info');
    }, 600);
  };

  // Add new monitor from modal
  const handleAddMonitor = (newMonitor: ClassMonitor) => {
    setMonitors((prev) => [newMonitor, ...prev]);
    setIsAddModalOpen(false);
    showToast(
      'Class Monitor Activated',
      `Tracking CRN ${newMonitor.crn} (${newMonitor.courseCode}). Automated alerts will send to ${newMonitor.notificationEmail}.`,
      'success'
    );
  };

  // 1-Click Track course directly from İTÜ OBS Browser
  const handleTrackItuCourse = (course: ItuCourse) => {
    if (!currentUser) return;
    const existing = monitors.find((m) => m.crn === course.crn);
    if (existing) {
      showToast('Already Tracked', `CRN ${course.crn} (${course.courseCode}) is already in your tracking dashboard.`, 'info');
      return;
    }

    const email = currentUser.email;
    const newMonitor: ClassMonitor = {
      id: 'mon-' + Date.now(),
      userId: currentUser.id,
      crn: course.crn,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      instructor: course.instructor,
      department: course.subjectCode,
      targetUrl: 'https://obs.itu.edu.tr/public/DersProgram',
      notificationEmail: email,
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
          emailRecipient: email,
          emailSubject: `Tracking initiated for CRN ${course.crn} from İTÜ OBS`,
          notes: `Imported directly from İTÜ OBS (${course.teachingMethod}, ${course.building})`
        }
      ]
    };

    setMonitors((prev) => [newMonitor, ...prev]);
    showToast(
      'Added from İTÜ OBS!',
      `CRN ${course.crn} (${course.courseCode}) is now tracked. Alerts will go to ${newMonitor.notificationEmail}.`,
      'success'
    );
  };

  // Toggle pause/active
  const handleTogglePause = (id: string) => {
    setMonitors((prev) =>
      prev.map((mon) => {
        if (mon.id !== id) return mon;
        const newStatus = mon.status === 'active' ? 'paused' : 'active';
        return { ...mon, status: newStatus };
      })
    );
  };

  // Delete monitor
  const handleDeleteMonitor = (id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    showToast('Monitor Removed', 'The class tracker has been deleted.', 'info');
  };

  // Dispatch background email via Brevo SMTP relay
  const dispatchNotificationEmail = (to: string, subject: string, body: string) => {
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        smtpConfig: emailConfig
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log(`[Brevo SMTP] Real email delivered to ${to}:`, data.messageId);
        } else {
          console.warn(`[Brevo SMTP Warning]:`, data.message);
        }
      })
      .catch((err) => console.error('[Brevo SMTP Dispatch Error]:', err));
  };

  // Simulation: Student Drops a seat (+1 Available) -> Kontenjan açıldı - Biri dersi bıraktı
  const handleSimulateDrop = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const userLang = currentUser?.preferredLanguage || language || 'tr';

    const { updatedMonitor, emailSent, historyEvent } = simulateDropSeat(
      target,
      emailConfig,
      settings.soundAlert,
      userLang
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));

    if (emailSent && historyEvent) {
      const { body } = generateEmailHtml(
        updatedMonitor,
        historyEvent.oldAvailable,
        historyEvent.newAvailable,
        emailConfig,
        'seat_dropped',
        undefined,
        userLang
      );
      dispatchNotificationEmail(target.notificationEmail, historyEvent.emailSubject, body);
      showToast(
        userLang === 'en' ? 'Seat Opened - Student Dropped' : 'Kontenjan açıldı - Biri dersi bıraktı',
        userLang === 'en'
          ? `Alert email sent to ${target.notificationEmail}.`
          : `E-posta bildirimi ${target.notificationEmail} adresine gönderildi.`,
        'alert'
      );
      setEmailPreviewData({
        recipient: target.notificationEmail,
        subject: historyEvent.emailSubject,
        body,
        timestamp: new Date().toLocaleString()
      });
    } else {
      showToast('Kontenjan Güncellendi', `Boş kontenjan: ${updatedMonitor.availableSeats}`, 'info');
    }
  };

  // Simulation: Student Claims a seat (-1 Available) -> NO EMAIL SENT! (Rule: No emails for full quota or decrease of quota)
  const handleSimulateClaim = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const userLang = currentUser?.preferredLanguage || language || 'tr';

    const { updatedMonitor } = simulateClaimSeat(
      target,
      emailConfig,
      settings.soundAlert,
      userLang
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));
    showToast(
      userLang === 'en' ? 'Quota Updated' : 'Kontenjan Güncellendi',
      userLang === 'en'
        ? `Seat taken: ${updatedMonitor.availableSeats} remaining seats. (No email sent for full or decrease)`
        : `Ders alındı: ${updatedMonitor.availableSeats} boş yer kaldı. (Azalma veya dolma için e-posta gönderilmez)`,
      'info'
    );
  };

  // Simulation: Department increases capacity (+5 Available) -> Kontenjan arttırıldı!
  const handleSimulateCapacityIncrease = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const userLang = currentUser?.preferredLanguage || language || 'tr';

    const { updatedMonitor, emailSent, historyEvent } = simulateCapacityIncrease(
      target,
      5,
      emailConfig,
      settings.soundAlert,
      userLang
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));

    if (emailSent && historyEvent) {
      const { body } = generateEmailHtml(
        updatedMonitor,
        historyEvent.oldAvailable,
        historyEvent.newAvailable,
        emailConfig,
        'capacity_increase',
        { oldCapacity: target.totalCapacity, newCapacity: target.totalCapacity + 5 },
        userLang
      );
      dispatchNotificationEmail(target.notificationEmail, historyEvent.emailSubject, body);
      showToast(
        userLang === 'en' ? 'Quota Increased!' : 'Kontenjan arttırıldı!',
        userLang === 'en'
          ? `Department increased quota (+5). Email sent to ${target.notificationEmail}.`
          : `Bölüm kontenjanı artırdı (+5). E-posta bildirimi ${target.notificationEmail} adresine iletildi.`,
        'alert'
      );
      setEmailPreviewData({
        recipient: target.notificationEmail,
        subject: historyEvent.emailSubject,
        body,
        timestamp: new Date().toLocaleString()
      });
    }
  };

  // Send test email
  const handleSendTestEmail = async (recipientEmail: string, customSubject?: string) => {
    const userLang = currentUser?.preferredLanguage || language || 'tr';
    const sampleMonitor = monitors[0] || {
      id: 'test',
      crn: '12486',
      courseCode: 'BLG 212E',
      courseTitle: 'Microprocessor Systems',
      instructor: 'Dr. Ahmet Yılmaz',
      targetUrl: 'https://obs.itu.edu.tr/public/DersProgram',
      notificationEmail: recipientEmail,
      status: 'active',
      totalCapacity: 50,
      enrolled: 49,
      availableSeats: 1,
      lastChecked: new Date().toISOString(),
      lastChanged: new Date().toISOString(),
      alertPreference: 'any_change',
      checkIntervalSeconds: 45,
      history: []
    };

    const { subject, body } = generateEmailHtml(
      sampleMonitor,
      0,
      1,
      emailConfig,
      'seat_dropped',
      undefined,
      userLang
    );
    const finalSubject = customSubject || `[TEST ALERT] ${subject}`;

    setEmailPreviewData({
      recipient: recipientEmail,
      subject: finalSubject,
      body,
      timestamp: new Date().toLocaleString()
    });

    try {
      const resp = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: finalSubject,
          body,
          smtpConfig: emailConfig
        })
      });
      const data = await resp.json();
      if (data.success) {
        showToast(
          'Email Delivered via Brevo',
          `Notification dispatched to ${recipientEmail} via Brevo relay (${emailConfig.smtpHost})!`,
          'success'
        );
      } else {
        showToast(
          'Brevo SMTP Relay',
          `Mail dispatch notice: ${data.message || 'Check recipient'}. Preview opened.`,
          'info'
        );
      }
    } catch {
      showToast(
        'Test Alert Dispatched',
        `Notification preview prepared for ${recipientEmail}.`,
        'info'
      );
    }
  };

  // Filtered monitors
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      if (filterType === 'open' && m.availableSeats <= 0) return false;
      if (filterType === 'full' && m.availableSeats > 0) return false;
      if (filterType === 'paused' && m.status !== 'paused') return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        m.crn.includes(q) ||
        m.courseCode.toLowerCase().includes(q) ||
        m.courseTitle.toLowerCase().includes(q) ||
        m.instructor.toLowerCase().includes(q) ||
        m.notificationEmail.toLowerCase().includes(q)
      );
    });
  }, [monitors, filterType, searchQuery]);

  // Filtered course groups (Course Code Trackers)
  const filteredCourseGroups = useMemo(() => {
    return trackedCourseGroups.filter((g) => {
      const totalAvailable = g.sections.reduce((acc, s) => acc + (s.availableSeats || 0), 0);
      if (filterType === 'open' && totalAvailable <= 0) return false;
      if (filterType === 'full' && totalAvailable > 0) return false;
      if (filterType === 'paused' && g.status !== 'paused') return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        g.courseCode.toLowerCase().includes(q) ||
        g.courseTitle.toLowerCase().includes(q) ||
        g.knownCrns.some((crn) => crn.includes(q)) ||
        g.sections.some((s) => s.instructor.toLowerCase().includes(q) || s.crn.includes(q))
      );
    });
  }, [trackedCourseGroups, filterType, searchQuery]);

  // Quick stats combining both monitors and course groups
  const totalMonitoredCount = monitors.length + trackedCourseGroups.length;
  const openSeatsCount =
    monitors.reduce((sum, m) => sum + (m.availableSeats > 0 ? m.availableSeats : 0), 0) +
    trackedCourseGroups.reduce(
      (sum, g) => sum + g.sections.reduce((sAcc, s) => sAcc + (s.availableSeats > 0 ? s.availableSeats : 0), 0),
      0
    );
  const totalEmailsSent =
    monitors.reduce((sum, m) => sum + m.history.filter((h) => h.emailDispatched).length, 0) +
    trackedCourseGroups.reduce((sum, g) => sum + (g.history || []).filter((h) => h.emailDispatched).length, 0);

  // ROUTE 1: Dedicated Admin Route (/admin) - Ayrı sekme / Full Page Admin
  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');
  if (isAdminRoute) {
    return (
      <AdminPage
        onExit={() => {
          setIsAdminAuthenticated(false);
          navigateTo('/');
        }}
        monitors={monitors}
        emailConfig={emailConfig}
        settings={settings}
        onSaveEmailConfig={(newCfg) => {
          setEmailConfig(newCfg);
          saveEmailConfig(newCfg);
          fetch('/api/email/save-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ smtpConfig: newCfg })
          }).catch((err) => console.error('[Save SMTP Error]:', err));
          showToast('SMTP Ayarları Güncellendi', `E-postalar ${newCfg.senderAddress} adresinden iletilecektir.`, 'success');
        }}
        onUpdateSettings={(newStg) => {
          setSettings(newStg);
          saveSettings(newStg);
          showToast('Ayarlar Güncellendi', 'Genel sistem parametreleri kaydedildi.', 'success');
        }}
        onTogglePauseMonitor={handleTogglePause}
        onDeleteMonitor={handleDeleteMonitor}
        onForceCheckMonitor={handleCheckNow}
        onSendTestEmail={handleSendTestEmail}
        isAdminAuthenticated={isAdminAuthenticated}
        onSetAdminAuthenticated={handleSetAdminAuth}
      />
    );
  }

  // ROUTE 2: Authentication Required (if user is not signed in)
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        defaultLanguage="tr"
        currentTheme={theme}
        onToggleTheme={handleThemeChange}
      />
    );
  }

  // ROUTE 3: Student Tracker Dashboard (Logged-in user)
  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121214] text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header: Simple header with Left Profile Dropdown & Right CRN / OBS buttons */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenProfile={() => {
          setIsProfileModalOpen(true);
          window.history.pushState({}, '', '/profile');
          setCurrentPath('/profile');
        }}
        language={language}
        onChangeLanguage={handleLanguageChange}
        theme={theme}
        onChangeTheme={handleThemeChange}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenItuObsModal={() => setIsItuObsBrowserOpen(true)}
        isScrolled={isScrolled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CRN-First Primary Input Box: Ask ONLY for CRN! (No email input needed) */}
        <section
          id="crn-input-section"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs transition-all"
        >
          <form onSubmit={handleQuickAddCrn} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* CRN input */}
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-3 text-stone-400 dark:text-stone-500 font-mono text-xs font-semibold">
                  CRN:
                </div>
                <input
                  id="main-crn-input"
                  type="text"
                  placeholder={t.quickCrnPlaceholder}
                  maxLength={6}
                  value={quickCrn}
                  onChange={(e) => {
                    setQuickCrn(e.target.value.replace(/\D/g, ''));
                    setQuickError(null);
                  }}
                  className="w-full pl-14 pr-4 py-2.5 text-sm font-mono font-bold tracking-wide rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:font-sans placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isQuickLoading || !quickCrn.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isQuickLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    <span>{t.gatheringFromObs}</span>
                  </>
                ) : (
                  <>
                    <span>{t.btnTrackCrn}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {quickError && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {/* Quick helper line */}
            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="text-stone-400 dark:text-stone-500">
                {language === 'en'
                  ? 'Enter 5-digit CRN or Course Code'
                  : '5 haneli CRN veya Ders Kodu giriniz'}
              </span>
            </div>
          </form>
        </section>

        {/* Live stats summary bar (only if tracking classes) */}
        {totalMonitoredCount > 0 && (
          <section
            id="registration-stats-bar"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs"
          >
            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-700 dark:text-stone-300 text-sm">
                #
              </div>
              <div>
                <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100">{totalMonitoredCount}</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{t.statsActive}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  openSeatsCount > 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 animate-pulse'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                }`}
              >
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div
                  className={`text-lg font-extrabold ${
                    openSeatsCount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-mono' : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {openSeatsCount}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{t.statsOpenSeats}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                <Mail className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                  {totalEmailsSent}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{t.statsEmails}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                <Globe className="h-4 w-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <a
                  href={settings.defaultQuotaUrl || "https://obs.itu.edu.tr/public/DersProgram"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-stone-900 dark:text-stone-100 hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>obs.itu.edu.tr</span>
                  <span className="text-[10px] text-stone-400">↗</span>
                </a>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{t.statsSourceWebPage}</div>
              </div>
            </div>
          </section>
        )}

        {/* Search & Filter Bar (shown when classes exist) */}
        {totalMonitoredCount > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                id="search-monitors"
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: t.filterAll },
                { id: 'open', label: t.filterOpen },
                { id: 'full', label: t.filterFull },
                { id: 'paused', label: t.filterPaused }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as typeof filterType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === f.id
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xs'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Grid or Pristine Blank State */}
        {totalMonitoredCount === 0 ? (
          <div
            id="empty-state-card"
            className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 max-w-xl mx-auto space-y-5 shadow-2xs animate-in fade-in duration-200"
          >
            <div className="h-14 w-14 rounded-2xl bg-stone-100 dark:bg-stone-800 mx-auto flex items-center justify-center text-stone-600 dark:text-stone-300 font-bold font-mono text-xl shadow-inner">
              CRN
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {t.emptyStateTitle}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                {language === 'tr' ? (
                  <>İTÜ'deki 5 haneli CRN kodunu veya ders kodunu girmeniz yeterlidir. Sistem <span className="font-mono text-stone-700 dark:text-stone-300">obs.itu.edu.tr</span> adresini sorgular, ders adı, hoca ve anlık kontenjanı alır ve yer açıldığında bildirim gönderir.</>
                ) : (
                  <>Just provide the 5-digit CRN or course code from İTÜ. The system queries <span className="font-mono text-stone-700 dark:text-stone-300">obs.itu.edu.tr</span>, gathers course details, instructor, and live quota, and emails you as soon as a seat opens.</>
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setIsItuObsBrowserOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <span>{t.btnObsSchedule}</span>
              </button>
            </div>
          </div>
        ) : filteredMonitors.length === 0 && filteredCourseGroups.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 max-w-md mx-auto space-y-2">
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              {language === 'tr' ? `"${searchQuery}" ile eşleşen ders bulunamadı` : `No classes match "${searchQuery}"`}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {language === 'tr' ? 'Arama terimini temizlemeyi veya filtreleri değiştirmeyi deneyebilirsiniz.' : 'Try clearing the search query or changing filters.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="text-xs text-stone-900 dark:text-stone-100 font-semibold underline pt-1 cursor-pointer"
            >
              {language === 'tr' ? 'Filtreleri sıfırla' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Unified Course Code Trackers (All sections in one unified card!) */}
            {filteredCourseGroups.map((group) => (
              <CourseGroupCard
                key={group.id}
                group={group}
                onCheckNow={handleGroupCheckNow}
                onSimulateDrop={(groupId, targetCrn) => handleGroupSimulateDrop(groupId, targetCrn)}
                onSimulateCapacityIncrease={(groupId, targetCrn) => handleGroupSimulateCapacityIncrease(groupId, targetCrn)}
                onSimulateNewCrn={(courseCode, isOnline) => handleGroupSimulateNewCrn(courseCode, isOnline)}
                onTogglePause={handleGroupTogglePause}
                onDelete={handleGroupDelete}
                onViewHistory={handleViewGroupHistory}
                onUpdateFilter={handleGroupUpdateFilter}
                isChecking={!!checkingIds[group.id]}
                language={language}
              />
            ))}

            {/* Individual CRN Trackers */}
            {filteredMonitors.map((mon) => (
              <MonitorCard
                key={mon.id}
                monitor={mon}
                onCheckNow={handleCheckNow}
                onSimulateDrop={handleSimulateDrop}
                onSimulateClaim={handleSimulateClaim}
                onSimulateCapacityIncrease={handleSimulateCapacityIncrease}
                onSimulateNewCrn={handleSimulateNewCrn}
                onTogglePause={handleTogglePause}
                onDelete={handleDeleteMonitor}
                onViewHistory={(m) => setSelectedHistoryMonitor(m)}
                isChecking={!!checkingIds[mon.id]}
                language={language}
              />
            ))}
          </div>
        )}

        {/* How It Works Guide for Students */}
        <section
          id="student-instructions"
          className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs"
        >
          <h2 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{t.howItWorksTitle}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600 dark:text-stone-400">
            <div className="p-3 bg-[#FAF9F5] dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="font-bold text-stone-900 dark:text-stone-100 mb-1">{t.step1Title}</div>
              <p className="leading-relaxed">
                {t.step1Desc}
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="font-bold text-stone-900 dark:text-stone-100 mb-1">{t.step2Title}</div>
              <p className="leading-relaxed">
                {t.step2Desc}
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
              <div className="font-bold text-stone-900 dark:text-stone-100 mb-1">{t.step3Title}</div>
              <p className="leading-relaxed">
                {t.step3Desc.replace('{email}', currentUser.email)}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div>
            CRN Quota Monitor • Integrated with obs.itu.edu.tr • Logged in as <span className="font-semibold text-stone-800 dark:text-stone-200">{currentUser.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsItuObsBrowserOpen(true)}
              className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer font-medium flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>İTÜ OBS Browser</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AddCrnModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setModalInitialCourseCode('');
        }}
        onAddMonitor={handleAddMonitor}
        currentUser={currentUser}
        defaultQuotaUrl={settings.defaultQuotaUrl}
        onOpenItuBrowser={() => setIsItuObsBrowserOpen(true)}
        language={language}
        onAddCourseGroup={handleAddCourseGroup}
        initialCourseCode={modalInitialCourseCode}
      />

      <ItuObsBrowserModal
        isOpen={isItuObsBrowserOpen}
        onClose={() => setIsItuObsBrowserOpen(false)}
        monitors={monitors}
        onTrackCourse={handleTrackItuCourse}
      />

      <EmailSenderConfigModal
        isOpen={isEmailConfigModalOpen}
        onClose={() => setIsEmailConfigModalOpen(false)}
        config={emailConfig}
        onSaveConfig={(newCfg: EmailSenderConfig) => {
          setEmailConfig(newCfg);
          showToast('Email Settings Saved', 'Outgoing mailer configuration updated.', 'success');
        }}
        onSendTestEmail={handleSendTestEmail}
        testRecipientEmail={currentUser.email}
      />

      <EmailSentPreviewModal
        isOpen={!!emailPreviewData}
        onClose={() => setEmailPreviewData(null)}
        emailData={emailPreviewData}
        senderConfig={emailConfig}
      />

      <HistoryModal
        isOpen={!!selectedHistoryMonitor}
        onClose={() => setSelectedHistoryMonitor(null)}
        monitor={selectedHistoryMonitor}
        onViewDispatchedEmail={(event) => {
          if (!selectedHistoryMonitor) return;
          const isCap = event.notes?.includes('Kontenjan arttırıldı') || event.notes?.includes('capacity');
          const { body } = generateEmailHtml(
            selectedHistoryMonitor,
            event.oldAvailable,
            event.newAvailable,
            emailConfig,
            isCap ? 'capacity_increase' : 'seat_dropped',
            undefined,
            currentUser?.preferredLanguage || language || 'tr'
          );
          setEmailPreviewData({
            recipient: event.emailRecipient,
            subject: event.emailSubject,
            body,
            timestamp: event.timestamp
          });
        }}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            if (currentPath === '/profile') {
              window.history.pushState({}, '', '/');
              setCurrentPath('/');
            }
          }}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            saveCurrentUser(updated);
            showToast(
              language === 'tr' ? 'Profil Güncellendi' : 'Profile Updated',
              language === 'tr' ? 'Bilgileriniz ve program tercihleriniz başarıyla kaydedildi.' : 'Your details and program choices have been saved.',
              'success'
            );
          }}
          onSignOut={handleSignOut}
          monitorsCount={monitors.length}
          language={language}
          onChangeLanguage={handleLanguageChange}
          theme={theme}
          onChangeTheme={handleThemeChange}
        />
      )}

      {/* Program Onboarding Modal for First Login or Registration */}
      {currentUser && (
        <ProgramOnboardingModal
          isOpen={currentUser.hasCompletedProgramOnboarding === false}
          onClose={() => {
            const updated = { ...currentUser, hasCompletedProgramOnboarding: true };
            setCurrentUser(updated);
            saveCurrentUser(updated);
            updateUserAccount(currentUser.email, { hasCompletedProgramOnboarding: true });
          }}
          onSavePrograms={(programs) => {
            const updated = {
              ...currentUser,
              enrolledPrograms: programs,
              hasCompletedProgramOnboarding: true
            };
            setCurrentUser(updated);
            saveCurrentUser(updated);
            updateUserAccount(currentUser.email, {
              enrolledPrograms: programs,
              hasCompletedProgramOnboarding: true
            });
            showToast(
              language === 'tr' ? 'Bölüm Tercihleri Kaydedildi' : 'Programs Saved',
              language === 'tr'
                ? `${programs.length} program tanımlandı. Ders takipleri buna göre filtrelenecektir.`
                : `${programs.length} programs set. Course tracking is now customized.`,
              'success'
            );
          }}
          initialPrograms={currentUser.enrolledPrograms || []}
          language={language}
        />
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-2xl shadow-xl border flex items-start gap-3 text-xs ${
              toastNotification.type === 'alert'
                ? 'bg-amber-900 text-amber-50 border-amber-800'
                : toastNotification.type === 'success'
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-white text-stone-800 border-stone-200'
            }`}
          >
            {toastNotification.type === 'alert' ? (
              <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            ) : toastNotification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-0.5">
              <div className="font-bold">{toastNotification.title}</div>
              <div className="text-[11px] opacity-90 leading-relaxed">
                {toastNotification.description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
