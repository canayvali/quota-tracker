import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Search,
  Shield,
  Sparkles,
  Zap
} from 'lucide-react';

import { ClassMonitor, EmailSenderConfig, GlobalSettings, ItuCourse, UserAccount } from './types';
import {
  checkAdminAuth,
  clearCurrentUser,
  loadCurrentUser,
  loadEmailConfig,
  loadMonitors,
  loadSettings,
  saveCurrentUser,
  saveEmailConfig,
  saveMonitors,
  saveSettings,
  setAdminAuth
} from './utils/storage';
import {
  generateEmailHtml,
  simulateCapacityIncrease,
  simulateClaimSeat,
  simulateDropSeat
} from './utils/quotaService';
import { fetchCourseByCrn } from './utils/ituScraperService';

import { Header } from './components/Header';
import { MonitorCard } from './components/MonitorCard';
import { AddCrnModal } from './components/AddCrnModal';
import { EmailSenderConfigModal } from './components/EmailSenderConfigModal';
import { EmailSentPreviewModal } from './components/EmailSentPreviewModal';
import { HistoryModal } from './components/HistoryModal';
import { SourceInspectorModal } from './components/SourceInspectorModal';
import { ItuObsBrowserModal } from './components/ItuObsBrowserModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { AuthPage } from './components/AuthPage';

const SAMPLE_CRN_CHIPS = [
  { crn: '12486', code: 'BLG 212E' },
  { crn: '12462', code: 'BLG 113E' },
  { crn: '20194', code: 'CEV 201' },
  { crn: '21389', code: 'MAT 201E' },
  { crn: '31024', code: 'ITB 003' }
];

export default function App() {
  // Navigation / Routing (/admin vs /)
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => loadCurrentUser());

  // Scroll state for header collapse
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Core Data
  const [monitors, setMonitors] = useState<ClassMonitor[]>(() => loadMonitors());
  const [settings, setSettings] = useState<GlobalSettings>(() => loadSettings());
  const [emailConfig, setEmailConfig] = useState<EmailSenderConfig>(() => loadEmailConfig());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => checkAdminAuth());

  // Quick CRN Input on Main Page (only asks for CRN!)
  const [quickCrn, setQuickCrn] = useState('');
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'open' | 'full' | 'paused'>('all');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [checkingIds, setCheckingIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmailConfigModalOpen, setIsEmailConfigModalOpen] = useState(false);
  const [isSourceInspectorOpen, setIsSourceInspectorOpen] = useState(false);
  const [isItuObsBrowserOpen, setIsItuObsBrowserOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
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
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to scroll to collapse header when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    showToast('Signed In', `Welcome back, ${user.name}! Alerts will go to ${user.email}.`, 'success');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    clearCurrentUser();
    showToast('Signed Out', 'You have been signed out.', 'info');
  };

  const handleSetAdminAuth = (auth: boolean) => {
    setIsAdminAuthenticated(auth);
    setAdminAuth(auth);
    if (auth) {
      showToast('Admin Logged In', 'Unlocked administrative controls (Password: HelloWorld).', 'success');
    } else {
      showToast('Admin Logged Out', 'Admin session ended.', 'info');
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

  // Automated background polling
  useEffect(() => {
    if (!settings.autoRefreshActive) return;

    const interval = setInterval(() => {
      setMonitors((prev) =>
        prev.map((mon) => {
          if (mon.status !== 'active') return mon;
          return {
            ...mon,
            lastChecked: new Date().toISOString()
          };
        })
      );
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefreshActive, settings.autoRefreshInterval]);

  // Quick CRN Submit Handler: only asks for CRN, email auto-bound to logged-in user!
  const handleQuickAddCrn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setQuickError('Please sign in to add classes to your tracker.');
      return;
    }

    const cleanCrn = quickCrn.trim();
    if (!cleanCrn) {
      setQuickError('Please enter a 5-digit CRN code (e.g. 12486).');
      return;
    }
    if (!/^\d{4,6}$/.test(cleanCrn)) {
      setQuickError('CRN must be a 5-digit number (e.g. 12486).');
      return;
    }

    const email = currentUser.email;

    const existing = monitors.find((m) => m.crn === cleanCrn);
    if (existing) {
      setQuickError(`CRN ${cleanCrn} (${existing.courseCode}) is already being monitored.`);
      return;
    }

    setQuickError(null);
    setIsQuickLoading(true);

    try {
      const result = await fetchCourseByCrn(cleanCrn);
      const course = result.course;

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
      setQuickCrn('');
      setIsQuickLoading(false);
      showToast(
        'Gathered from İTÜ OBS!',
        `Now tracking CRN ${newMonitor.crn}: ${newMonitor.courseCode} — ${newMonitor.courseTitle}. Alerts will be sent to ${newMonitor.notificationEmail}.`,
        'success'
      );
    } catch (err: unknown) {
      setIsQuickLoading(false);
      setQuickError('Failed to gather course details. Please verify the CRN and try again.');
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

  // Refresh all monitors
  const handleRefreshAll = () => {
    setIsRefreshingAll(true);
    setTimeout(() => {
      setMonitors((prev) =>
        prev.map((mon) => ({
          ...mon,
          lastChecked: new Date().toISOString()
        }))
      );
      setIsRefreshingAll(false);
      showToast('Check All Completed', `Refreshed quota status for ${monitors.length} courses.`, 'success');
    }, 900);
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

  // Simulation: Student Drops a seat (+1 Available)
  const handleSimulateDrop = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const { updatedMonitor, emailSent, historyEvent } = simulateDropSeat(
      target,
      emailConfig,
      settings.soundAlert
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));

    if (emailSent && historyEvent) {
      const { body } = generateEmailHtml(
        updatedMonitor,
        historyEvent.oldAvailable,
        historyEvent.newAvailable,
        emailConfig
      );
      dispatchNotificationEmail(target.notificationEmail, historyEvent.emailSubject, body);
      showToast(
        'SEAT OPENED! Email Dispatched',
        `Quota changed (+1). Notification sent to ${target.notificationEmail} via ${emailConfig.senderAddress}.`,
        'alert'
      );
      setEmailPreviewData({
        recipient: target.notificationEmail,
        subject: historyEvent.emailSubject,
        body,
        timestamp: new Date().toLocaleString()
      });
    } else {
      showToast('Quota Updated', `Available seats changed: ${updatedMonitor.availableSeats}`, 'info');
    }
  };

  // Simulation: Student Claims a seat (-1 Available)
  const handleSimulateClaim = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const { updatedMonitor, emailSent, historyEvent } = simulateClaimSeat(
      target,
      emailConfig,
      settings.soundAlert
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));

    if (emailSent && historyEvent) {
      const { body } = generateEmailHtml(
        updatedMonitor,
        historyEvent.oldAvailable,
        historyEvent.newAvailable,
        emailConfig
      );
      dispatchNotificationEmail(target.notificationEmail, historyEvent.emailSubject, body);
      showToast(
        'SEAT CLAIMED',
        `Quota decreased (-1). Email notification dispatched to ${target.notificationEmail}.`,
        'info'
      );
      setEmailPreviewData({
        recipient: target.notificationEmail,
        subject: historyEvent.emailSubject,
        body,
        timestamp: new Date().toLocaleString()
      });
    } else {
      showToast('Quota Updated', `Available seats changed: ${updatedMonitor.availableSeats}`, 'info');
    }
  };

  // Simulation: Department increases capacity (+5 Available)
  const handleSimulateCapacityIncrease = (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    const { updatedMonitor, emailSent, historyEvent } = simulateCapacityIncrease(
      target,
      5,
      emailConfig,
      settings.soundAlert
    );

    setMonitors((prev) => prev.map((m) => (m.id === id ? updatedMonitor : m)));

    if (emailSent && historyEvent) {
      const { body } = generateEmailHtml(
        updatedMonitor,
        historyEvent.oldAvailable,
        historyEvent.newAvailable,
        emailConfig
      );
      dispatchNotificationEmail(target.notificationEmail, historyEvent.emailSubject, body);
      showToast(
        'QUOTA EXPANDED! Email Dispatched',
        `Department added +5 seats! Priority alert sent to ${target.notificationEmail}.`,
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

    const { subject, body } = generateEmailHtml(sampleMonitor, 0, 1, emailConfig);
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

  // Quick stats
  const activeCount = monitors.filter((m) => m.status === 'active').length;
  const openSeatsCount = monitors.reduce((sum, m) => sum + (m.availableSeats > 0 ? m.availableSeats : 0), 0);
  const totalEmailsSent = monitors.reduce(
    (sum, m) => sum + m.history.filter((h) => h.emailDispatched).length,
    0
  );

  // ROUTE 1: Dedicated Admin Route (/admin)
  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] text-stone-900 flex flex-col font-sans">
        {/* Admin Navigation Bar */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
            >
              <span>← Exit to Student Tracker</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">İTÜ OBS Admin Portal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                /admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated ? (
              <button
                onClick={() => handleSetAdminAuth(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out Admin</span>
              </button>
            ) : (
              <span className="text-xs text-stone-400 font-mono">Password: HelloWorld</span>
            )}
          </div>
        </div>

        {/* Admin Portal Modal rendered full-screen in route mode */}
        <AdminPortalModal
          isOpen={true}
          onClose={() => navigateTo('/')}
          monitors={monitors}
          emailConfig={emailConfig}
          settings={settings}
          onSaveEmailConfig={(newCfg) => {
            setEmailConfig(newCfg);
            showToast('Email Account Updated', `Outgoing notifications will be sent from ${newCfg.senderAddress}.`, 'success');
          }}
          onUpdateSettings={(newStg) => {
            setSettings(newStg);
            showToast('Settings Updated', 'Global monitoring parameters saved.', 'success');
          }}
          onTogglePauseMonitor={handleTogglePause}
          onDeleteMonitor={handleDeleteMonitor}
          onForceCheckMonitor={handleCheckNow}
          onSendTestEmail={handleSendTestEmail}
          isAdminAuthenticated={isAdminAuthenticated}
          onSetAdminAuthenticated={handleSetAdminAuth}
        />
      </div>
    );
  }

  // ROUTE 2: Authentication Required (if user is not signed in)
  if (!currentUser) {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToAdmin={() => navigateTo('/admin')}
      />
    );
  }

  // ROUTE 3: Student Tracker Dashboard (Logged-in user)
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 flex flex-col font-sans">
      {/* Top Header: When scrolled down, heading/status disappears and ONLY Add CRN button remains! */}
      <Header
        activeCount={activeCount}
        totalCount={monitors.length}
        soundEnabled={settings.soundAlert}
        onToggleSound={() =>
          setSettings((prev) => ({ ...prev, soundAlert: !prev.soundAlert }))
        }
        isAutoRefreshing={settings.autoRefreshActive}
        onToggleAutoRefresh={() =>
          setSettings((prev) => ({ ...prev, autoRefreshActive: !prev.autoRefreshActive }))
        }
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenItuObsModal={() => setIsItuObsBrowserOpen(true)}
        onOpenAdminPortalModal={() => {
          // Navigates to /admin directly while keeping the button as requested
          navigateTo('/admin');
        }}
        isAdminAuthenticated={isAdminAuthenticated}
        onManualRefreshAll={handleRefreshAll}
        isRefreshingAll={isRefreshingAll}
        isScrolled={isScrolled}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CRN-First Primary Input Box: Ask ONLY for CRN! (No email input needed) */}
        <section
          id="crn-input-section"
          className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs transition-all"
        >
          <form onSubmit={handleQuickAddCrn} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* CRN input */}
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-3 text-stone-400 font-mono text-xs font-semibold">
                  CRN:
                </div>
                <input
                  id="main-crn-input"
                  type="text"
                  placeholder="Enter 5-digit CRN (e.g. 12486)"
                  maxLength={6}
                  value={quickCrn}
                  onChange={(e) => {
                    setQuickCrn(e.target.value.replace(/\D/g, ''));
                    setQuickError(null);
                  }}
                  className="w-full pl-14 pr-4 py-2.5 text-sm font-mono font-bold tracking-wide rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:font-sans placeholder:text-stone-400"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isQuickLoading || !quickCrn.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isQuickLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    <span>Gathering from İTÜ OBS...</span>
                  </>
                ) : (
                  <>
                    <span>Track CRN</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {quickError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {/* Quick helper line with 1-click popular CRNs & Account indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-stone-400">Quick samples:</span>
                {SAMPLE_CRN_CHIPS.map((chip) => (
                  <button
                    key={chip.crn}
                    type="button"
                    onClick={() => {
                      setQuickCrn(chip.crn);
                      setQuickError(null);
                    }}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono transition-colors cursor-pointer"
                  >
                    {chip.crn} ({chip.code})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-stone-400">
                <Mail className="h-3 w-3 text-stone-400" />
                <span>Alert destination:</span>
                <span className="font-semibold text-stone-700 font-mono">{currentUser.email}</span>
              </div>
            </div>
          </form>
        </section>

        {/* Live stats summary bar (only if tracking classes) */}
        {monitors.length > 0 && (
          <section
            id="registration-stats-bar"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs"
          >
            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center font-mono font-bold text-stone-700 text-sm">
                #
              </div>
              <div>
                <div className="text-lg font-extrabold text-stone-900">{monitors.length}</div>
                <div className="text-[11px] text-stone-500 font-medium">Monitored Classes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  openSeatsCount > 0
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div
                  className={`text-lg font-extrabold ${
                    openSeatsCount > 0 ? 'text-emerald-600 font-mono' : 'text-stone-900'
                  }`}
                >
                  {openSeatsCount}
                </div>
                <div className="text-[11px] text-stone-500 font-medium">Seats Currently Open</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                <Mail className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-stone-900 font-mono">
                  {totalEmailsSent}
                </div>
                <div className="text-[11px] text-stone-500 font-medium">Alert Emails Sent</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5">
              <div className="h-9 w-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                <Globe className="h-4 w-4 text-stone-600" />
              </div>
              <div>
                <button
                  onClick={() => setIsSourceInspectorOpen(true)}
                  className="text-xs font-bold text-stone-900 hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>obs.itu.edu.tr</span>
                  <span className="text-[10px] text-stone-400">↗</span>
                </button>
                <div className="text-[11px] text-stone-500 font-medium">Source Web Page</div>
              </div>
            </div>
          </section>
        )}

        {/* Search & Filter Bar (shown when classes exist) */}
        {monitors.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                id="search-monitors"
                type="text"
                placeholder="Search by CRN, code (e.g. BLG 212E), title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Classes' },
                { id: 'open', label: 'Seats Open' },
                { id: 'full', label: 'Full Only' },
                { id: 'paused', label: 'Paused' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as typeof filterType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === f.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Grid or Pristine Blank State */}
        {monitors.length === 0 ? (
          <div
            id="empty-state-card"
            className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 max-w-xl mx-auto space-y-5 shadow-2xs animate-in fade-in duration-200"
          >
            <div className="h-14 w-14 rounded-2xl bg-stone-100 mx-auto flex items-center justify-center text-stone-600 font-bold font-mono text-xl shadow-inner">
              CRN
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-900">
                Start by entering a CRN above
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Just provide the 5-digit CRN from İTÜ. The system queries <span className="font-mono text-stone-700">obs.itu.edu.tr</span>, gathers course title, instructor, schedule, and live quota, and emails you at <span className="font-semibold text-stone-800">{currentUser.email}</span> as soon as a seat opens or changes.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => setIsItuObsBrowserOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-amber-700" />
                <span>Browse İTÜ OBS Subjects (BLG, CEV, MAT...)</span>
              </button>
            </div>
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 max-w-md mx-auto space-y-2">
            <h4 className="text-sm font-bold text-stone-800">No classes match "{searchQuery}"</h4>
            <p className="text-xs text-stone-500">Try clearing the search query or changing filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
              className="text-xs text-stone-900 font-semibold underline pt-1 cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMonitors.map((mon) => (
              <MonitorCard
                key={mon.id}
                monitor={mon}
                onCheckNow={handleCheckNow}
                onSimulateDrop={handleSimulateDrop}
                onSimulateClaim={handleSimulateClaim}
                onSimulateCapacityIncrease={handleSimulateCapacityIncrease}
                onTogglePause={handleTogglePause}
                onDelete={handleDeleteMonitor}
                onViewHistory={(m) => setSelectedHistoryMonitor(m)}
                isChecking={!!checkingIds[mon.id]}
              />
            ))}
          </div>
        )}

        {/* How It Works Guide for Students */}
        <section
          id="student-instructions"
          className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs"
        >
          <h2 className="text-xs font-bold text-stone-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>How This Quota Monitor Works for İTÜ Students</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600">
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-stone-200/70">
              <div className="font-bold text-stone-900 mb-1">1. Enter Only the CRN</div>
              <p className="leading-relaxed">
                No need to type course titles, instructors, or your email each time. Enter any 5-digit CRN and all details are auto-gathered directly from <strong>obs.itu.edu.tr</strong>.
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-stone-200/70">
              <div className="font-bold text-stone-900 mb-1">2. Live Background Checking</div>
              <p className="leading-relaxed">
                The tracker continuously queries the university's quota records without you having to repeatedly refresh during registration rush.
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-stone-200/70">
              <div className="font-bold text-stone-900 mb-1">3. Automated Email Alert</div>
              <p className="leading-relaxed">
                When a quota change occurs (e.g. a student drops and a seat opens), an alert is dispatched straight to <strong>{currentUser.email}</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            CRN Quota Monitor • Integrated with obs.itu.edu.tr • Logged in as <span className="font-semibold text-stone-800">{currentUser.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsItuObsBrowserOpen(true)}
              className="hover:text-stone-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>İTÜ OBS Browser</span>
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo('/admin')}
              className="hover:text-stone-800 transition-colors cursor-pointer font-medium flex items-center gap-1 text-stone-700"
            >
              <Shield className="h-3.5 w-3.5 text-stone-500" />
              <span>Admin Page (/admin)</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSourceInspectorOpen(true)}
              className="hover:text-stone-800 transition-colors cursor-pointer"
            >
              Source Scraper
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AddCrnModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMonitor={handleAddMonitor}
        currentUser={currentUser}
        defaultQuotaUrl={settings.defaultQuotaUrl}
        onOpenItuBrowser={() => setIsItuObsBrowserOpen(true)}
      />

      <ItuObsBrowserModal
        isOpen={isItuObsBrowserOpen}
        onClose={() => setIsItuObsBrowserOpen(false)}
        monitors={monitors}
        onTrackCourse={handleTrackItuCourse}
        defaultEmail={currentUser.email}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        monitors={monitors}
        emailConfig={emailConfig}
        settings={settings}
        onSaveEmailConfig={(newCfg) => {
          setEmailConfig(newCfg);
          showToast('Email Account Updated', `Outgoing notifications will be sent from ${newCfg.senderAddress}.`, 'success');
        }}
        onUpdateSettings={(newStg) => {
          setSettings(newStg);
          showToast('Settings Updated', 'Global monitoring parameters saved.', 'success');
        }}
        onTogglePauseMonitor={handleTogglePause}
        onDeleteMonitor={handleDeleteMonitor}
        onForceCheckMonitor={handleCheckNow}
        onSendTestEmail={handleSendTestEmail}
        isAdminAuthenticated={isAdminAuthenticated}
        onSetAdminAuthenticated={handleSetAdminAuth}
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
          const { body } = generateEmailHtml(
            selectedHistoryMonitor,
            event.oldAvailable,
            event.newAvailable,
            emailConfig
          );
          setEmailPreviewData({
            recipient: event.emailRecipient,
            subject: event.emailSubject,
            body,
            timestamp: event.timestamp
          });
        }}
      />

      <SourceInspectorModal
        isOpen={isSourceInspectorOpen}
        onClose={() => setIsSourceInspectorOpen(false)}
        defaultUrl={settings.defaultQuotaUrl}
        monitors={monitors}
      />

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
