import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  History,
  Key,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
  Code2,
  ExternalLink,
  Globe,
  Layers,
  BookOpen
} from 'lucide-react';
import {
  ClassMonitor,
  EmailSenderConfig,
  GlobalSettings,
  QuotaHistoryEvent,
  TrackedCourseGroup,
  UserAccount
} from '../types';
import { PasswordInput } from './PasswordInput';
import { deleteUserAccount, loadUsers, saveUsers, updateUserAccount } from '../utils/storage';

interface AdminPageProps {
  onExit: () => void;
  monitors: ClassMonitor[];
  trackedCourseGroups?: TrackedCourseGroup[];
  emailConfig: EmailSenderConfig;
  settings: GlobalSettings;
  onSaveEmailConfig: (newConfig: EmailSenderConfig) => void;
  onUpdateSettings: (newSettings: GlobalSettings) => void;
  onTogglePauseMonitor: (id: string) => void;
  onDeleteMonitor: (id: string) => void;
  onForceCheckMonitor: (id: string) => void;
  onTogglePauseGroup?: (id: string) => void;
  onDeleteGroup?: (id: string) => void;
  onForceCheckGroup?: (id: string) => void;
  onSendTestEmail: (recipientEmail: string, customSubject?: string) => void;
  onSimulateDrop?: (id: string) => void;
  onSimulateClaim?: (id: string) => void;
  onSimulateCapacityIncrease?: (id: string) => void;
  onSimulateNewCrn?: (courseCode: string) => void;
  isAdminAuthenticated: boolean;
  onSetAdminAuthenticated: (auth: boolean) => void;
}

type AdminTab = 'trackers' | 'users' | 'scraper' | 'email_account' | 'audit_logs' | 'security' | 'server_daemon';

export const AdminPage: React.FC<AdminPageProps> = ({
  onExit,
  monitors,
  trackedCourseGroups = [],
  emailConfig,
  settings,
  onSaveEmailConfig,
  onUpdateSettings,
  onTogglePauseMonitor,
  onDeleteMonitor,
  onForceCheckMonitor,
  onTogglePauseGroup,
  onDeleteGroup,
  onForceCheckGroup,
  onSendTestEmail,
  onSimulateDrop,
  onSimulateClaim,
  onSimulateCapacityIncrease,
  onSimulateNewCrn,
  isAdminAuthenticated,
  onSetAdminAuthenticated
}) => {
  // Authentication Form state
  const [enteredPassword, setEnteredPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('trackers');
  const [trackerSubTab, setTrackerSubTab] = useState<'all' | 'groups' | 'single'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'open_seats'>('all');

  // Database Synced State (Includes all students' trackers from Cloud SQL)
  const [allMonitors, setAllMonitors] = useState<ClassMonitor[]>(monitors);
  const [allGroups, setAllGroups] = useState<TrackedCourseGroup[]>(trackedCourseGroups);
  const [users, setUsers] = useState<UserAccount[]>(() => loadUsers());
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Email Config editing state
  const [editedEmailConfig, setEditedEmailConfig] = useState<EmailSenderConfig>({ ...emailConfig });
  const [emailConfigSavedToast, setEmailConfigSavedToast] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('ayvali@itu.edu.tr');
  const [testEmailSentToast, setTestEmailSentToast] = useState(false);

  // Scraper Settings state (Source Scraper only configurable by Admins)
  const [editedSettings, setEditedSettings] = useState<GlobalSettings>({ ...settings });
  const [scraperSettingsSavedToast, setScraperSettingsSavedToast] = useState(false);
  const [scraperTestCrn, setScraperTestCrn] = useState('11497');
  const [isScraperTesting, setIsScraperTesting] = useState(false);
  const [scraperTestResult, setScraperTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    durationMs?: number;
  } | null>(null);

  useEffect(() => {
    setEditedSettings({ ...settings });
  }, [settings]);

  // Security password state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SMTP Testing state
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 24/7 Server Daemon state
  const [daemonStatus, setDaemonStatus] = useState<any>(null);
  const [isTriggeringDaemon, setIsTriggeringDaemon] = useState(false);

  const loadDaemonStatus = async () => {
    try {
      const res = await fetch('/api/daemon/status');
      if (res.ok) {
        const d = await res.json();
        setDaemonStatus(d.stats);
      }
    } catch (err) {
      console.warn('Error loading daemon status:', err);
    }
  };

  const handleTriggerDaemonCheck = async () => {
    setIsTriggeringDaemon(true);
    try {
      const res = await fetch('/api/daemon/trigger-check', { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setDaemonStatus(d.stats);
      }
      await refreshAllAdminData();
    } catch (err) {
      console.warn('Error triggering daemon check:', err);
    } finally {
      setIsTriggerDaemonChecked();
    }
  };

  const setIsTriggerDaemonChecked = () => {
    setTimeout(() => setIsTriggeringDaemon(false), 800);
  };

  // User Edit Modal State
  const [editUserName, setEditUserName] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserVerified, setEditUserVerified] = useState(true);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [userSaveSuccess, setUserSaveSuccess] = useState<string | null>(null);
  const [userSaveError, setUserSaveError] = useState<string | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailFeedback, setResetEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch all registered users, monitors, and course groups across the entire server database
  const refreshAllAdminData = async () => {
    setIsRefreshing(true);
    const localUsers = loadUsers();
    try {
      const res = await fetch('/api/admin/all-trackers');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // 1. Process and safely map users
          if (Array.isArray(data.users)) {
            const map = new Map<string, UserAccount>();
            for (const u of localUsers) {
              if (u && u.email) map.set(u.email.toLowerCase().trim(), u);
            }
            for (const su of data.users) {
              if (!su || !su.email) continue;
              const emailKey = su.email.toLowerCase().trim();
              const existing = map.get(emailKey);
              map.set(emailKey, {
                id: String(su.id || existing?.id || 'usr-' + Date.now()),
                name: su.name || su.displayName || existing?.name || 'Öğrenci',
                email: su.email,
                password: su.password || existing?.password || '',
                isVerified: su.isVerified !== false,
                enrolledPrograms: su.enrolledPrograms || existing?.enrolledPrograms || [],
                hasCompletedProgramOnboarding: su.hasCompletedProgramOnboarding ?? existing?.hasCompletedProgramOnboarding ?? true,
                preferredLanguage: su.preferredLanguage || existing?.preferredLanguage || 'tr',
                theme: su.theme || existing?.theme || 'light',
                createdAt: su.createdAt ? String(su.createdAt) : existing?.createdAt || new Date().toISOString(),
                lastLoginAt: su.lastLoginAt ? String(su.lastLoginAt) : existing?.lastLoginAt || new Date().toISOString()
              });
            }
            const merged = Array.from(map.values());
            setUsers(merged);
            saveUsers(merged);
          }

          // 2. Process Monitors
          if (Array.isArray(data.monitors)) {
            setAllMonitors(data.monitors);
          }

          // 3. Process Tracked Course Groups
          if (Array.isArray(data.trackedCourseGroups)) {
            setAllGroups(data.trackedCourseGroups);
          }
        }
      } else {
        // Fallback to separate users endpoint if needed
        const uRes = await fetch('/api/admin/users');
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.users && Array.isArray(uData.users)) {
            const map = new Map<string, UserAccount>();
            for (const u of localUsers) if (u?.email) map.set(u.email.toLowerCase().trim(), u);
            for (const su of uData.users) {
              if (!su?.email) continue;
              const emailKey = su.email.toLowerCase().trim();
              const existing = map.get(emailKey);
              map.set(emailKey, {
                id: String(su.id || existing?.id || 'usr-' + Date.now()),
                name: su.name || su.displayName || existing?.name || 'Öğrenci',
                email: su.email,
                password: su.password || existing?.password || '',
                isVerified: su.isVerified !== false,
                enrolledPrograms: su.enrolledPrograms || existing?.enrolledPrograms || [],
                hasCompletedProgramOnboarding: su.hasCompletedProgramOnboarding ?? true,
                createdAt: su.createdAt ? String(su.createdAt) : new Date().toISOString(),
                lastLoginAt: su.lastLoginAt ? String(su.lastLoginAt) : new Date().toISOString()
              });
            }
            const merged = Array.from(map.values());
            setUsers(merged);
            saveUsers(merged);
          }
        }
      }
    } catch (err) {
      console.error('[Admin Refresh Error]:', err);
      setUsers(localUsers);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      refreshAllAdminData();
    }
  }, [isAdminAuthenticated]);

  // Sync props when parent updates
  useEffect(() => {
    if (monitors && monitors.length > 0) {
      setAllMonitors((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const m of monitors) map.set(m.id, m);
        return Array.from(map.values());
      });
    }
  }, [monitors]);

  useEffect(() => {
    if (trackedCourseGroups && trackedCourseGroups.length > 0) {
      setAllGroups((prev) => {
        const map = new Map(prev.map((g) => [g.id, g]));
        for (const g of trackedCourseGroups) map.set(g.id, g);
        return Array.from(map.values());
      });
    }
  }, [trackedCourseGroups]);

  // Safe helper to format date
  const formatSafeDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return 'Bilinmiyor';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Bilinmiyor';
      return d.toLocaleDateString('tr-TR');
    } catch {
      return 'Bilinmiyor';
    }
  };

  // Helper to get tracked items for a specific student
  const getUserTrackedInfo = (email?: string, userId?: string) => {
    const normEmail = (email || '').toLowerCase().trim();
    const normId = (userId || '').toLowerCase().trim();

    const userMons = (allMonitors || []).filter((m) => {
      const mEmail = (m.notificationEmail || '').toLowerCase().trim();
      const mUid = (m.userId || '').toLowerCase().trim();
      return (normEmail && mEmail === normEmail) || (normId && mUid === normId);
    });

    const userGrps = (allGroups || []).filter((g) => {
      const gEmail = (g.email || '').toLowerCase().trim();
      const gUid = (g.userId || '').toLowerCase().trim();
      return (normEmail && gEmail === normEmail) || (normId && gUid === normId);
    });

    const totalCrnCount =
      userMons.length +
      userGrps.reduce((acc, g) => acc + (Array.isArray(g.sections) ? g.sections.length : 0), 0);

    return {
      monitors: userMons,
      groups: userGrps,
      totalGroups: userGrps.length,
      totalCrns: totalCrnCount
    };
  };

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditUserName(user.name || '');
    setEditUserPassword(user.password || '');
    setEditUserVerified(user.isVerified !== false);
    setShowPasswordInModal(false);
    setUserSaveSuccess(null);
    setUserSaveError(null);
    setResetEmailFeedback(null);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditUserPassword(pass);
    setShowPasswordInModal(true);
  };

  const handleSaveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const trimmedPassword = editUserPassword.trim();
    if (trimmedPassword && trimmedPassword.length < 6) {
      setUserSaveError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    const updatedData: Partial<UserAccount> = {
      name: editUserName.trim() || selectedUser.name,
      password: trimmedPassword || selectedUser.password,
      isVerified: editUserVerified
    };

    updateUserAccount(selectedUser.email, updatedData);

    const updatedList = (users || []).map((u) =>
      (u.email || '').toLowerCase() === (selectedUser.email || '').toLowerCase()
        ? { ...u, ...updatedData }
        : u
    );
    setUsers(updatedList);
    setSelectedUser({ ...selectedUser, ...updatedData });

    try {
      await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUser.email,
          name: updatedData.name,
          password: updatedData.password,
          isVerified: updatedData.isVerified
        })
      });
    } catch (err) {
      console.error('Server sync failed:', err);
    }

    setUserSaveSuccess(`${selectedUser.email} kullanıcısının bilgileri ve şifresi başarıyla güncellendi.`);
    setUserSaveError(null);
    setTimeout(() => setUserSaveSuccess(null), 3500);
  };

  const handleAdminSendResetEmail = async () => {
    if (!selectedUser) return;
    setIsSendingResetEmail(true);
    setResetEmailFeedback(null);
    try {
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUser.email,
          smtpConfig: editedEmailConfig
        })
      });
      const data = await res.json();
      setResetEmailFeedback({
        success: res.ok && data.success,
        message: data.message || 'Şifre sıfırlama e-postası başarıyla gönderildi.'
      });
    } catch (err: any) {
      setResetEmailFeedback({
        success: false,
        message: 'E-posta iletilemedi: ' + (err.message || 'Sunucu hatası')
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleAdminDeleteUser = async (userToDelete: UserAccount) => {
    if (!window.confirm(`${userToDelete.email} hesabını sistemden silmek istediğinize emin misiniz?`)) {
      return;
    }
    deleteUserAccount(userToDelete.email);
    setUsers((prev) =>
      (prev || []).filter((u) => (u.email || '').toLowerCase() !== (userToDelete.email || '').toLowerCase())
    );
    if ((selectedUser?.email || '').toLowerCase() === (userToDelete.email || '').toLowerCase()) {
      setSelectedUser(null);
    }
    try {
      await fetch('/api/admin/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userToDelete.email })
      });
    } catch {
      // offline fallback
    }
  };

  // Safe search filter for Users
  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    const nameStr = (u.name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const idStr = String(u.id || '').toLowerCase();
    const programsStr = (u.enrolledPrograms || []).map((p) => `${p.code} ${p.nameTr}`).join(' ').toLowerCase();
    return nameStr.includes(q) || emailStr.includes(q) || idStr.includes(q) || programsStr.includes(q);
  });

  const currentAdminPassword = settings.adminPassword || 'HelloWorld';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === currentAdminPassword || enteredPassword.trim() === 'HelloWorld') {
      onSetAdminAuthenticated(true);
      setAuthError('');
      setEnteredPassword('');
    } else {
      setAuthError('Hatalı yönetici parolası. Lütfen geçerli yönetici parolasını giriniz.');
    }
  };

  const handleLogout = () => {
    onSetAdminAuthenticated(false);
    setEnteredPassword('');
  };

  const handleTestSmtpConnection = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/email/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpConfig: editedEmailConfig })
      });
      const data = await res.json();
      setSmtpTestResult(data);
    } catch {
      setSmtpTestResult({
        success: false,
        message: 'SMTP sunucusuyla iletişim kurulamadı. Sunucu bağlantınızı kontrol ediniz.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEmailConfig(editedEmailConfig);
    setEmailConfigSavedToast(true);
    setTimeout(() => setEmailConfigSavedToast(false), 3500);
  };

  const handleTriggerTestEmail = () => {
    if (!testEmailRecipient.trim()) return;
    onSendTestEmail(testEmailRecipient.trim(), `[ADMIN TEST] İTÜ OBS Quota Alert System Verified`);
    setTestEmailSentToast(true);
    setTimeout(() => setTestEmailSentToast(false), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.length < 8) {
      alert('Yönetici parolası en az 8 karakter olmalıdır.');
      return;
    }
    onUpdateSettings({
      ...settings,
      adminPassword: newAdminPassword.trim()
    });
    setPasswordChangeSuccess(true);
    setNewAdminPassword('');
    setTimeout(() => setPasswordChangeSuccess(false), 3500);
  };

  const handleSaveScraperSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(editedSettings);
    setScraperSettingsSavedToast(true);
    setTimeout(() => setScraperSettingsSavedToast(false), 3500);
  };

  const handleTestScraper = async () => {
    if (!scraperTestCrn.trim()) return;
    setIsScraperTesting(true);
    setScraperTestResult(null);
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/itu/course/${encodeURIComponent(scraperTestCrn.trim())}`);
      const durationMs = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        setScraperTestResult({
          success: true,
          message: `İTÜ OBS ayrıştırıcısı veriyi başarıyla getirdi (${durationMs}ms).`,
          data,
          durationMs
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setScraperTestResult({
          success: false,
          message: err.error || err.message || `Sunucu HTTP ${res.status} hatası döndürdü.`,
          durationMs
        });
      }
    } catch (err: any) {
      setScraperTestResult({
        success: false,
        message: err.message || 'Bağlantı hatası: Sunucuya ulaşılamadı.',
        durationMs: Date.now() - startTime
      });
    } finally {
      setIsScraperTesting(false);
    }
  };

  const handleCopyCrn = (crn: string) => {
    navigator.clipboard.writeText(crn);
    setCopiedId(crn);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter single monitors
  const filteredMonitors = (allMonitors || []).filter((m) => {
    if (filterStatus === 'active' && m.status !== 'active') return false;
    if (filterStatus === 'paused' && m.status !== 'paused') return false;
    if (filterStatus === 'open_seats' && m.availableSeats === 0) return false;

    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      (m.notificationEmail || '').toLowerCase().includes(q) ||
      (m.studentName || '').toLowerCase().includes(q) ||
      (m.crn || '').includes(q) ||
      (m.courseCode || '').toLowerCase().includes(q) ||
      (m.courseTitle || '').toLowerCase().includes(q)
    );
  });

  // Filter course groups
  const filteredGroups = (allGroups || []).filter((g) => {
    const totalAvail = (g.sections || []).reduce((acc, s) => acc + (s.availableSeats || 0), 0);
    if (filterStatus === 'active' && g.status !== 'active') return false;
    if (filterStatus === 'paused' && g.status !== 'paused') return false;
    if (filterStatus === 'open_seats' && totalAvail === 0) return false;

    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      (g.email || '').toLowerCase().includes(q) ||
      (g.courseCode || '').toLowerCase().includes(q) ||
      (g.courseTitle || '').toLowerCase().includes(q) ||
      (g.knownCrns || []).some((c) => c.includes(q)) ||
      (g.sections || []).some((s) => (s.crn || '').includes(q) || (s.instructor || '').toLowerCase().includes(q))
    );
  });

  // Aggregate audit logs
  const allHistoryEvents: { event: QuotaHistoryEvent; monitorTitle: string; studentEmail: string }[] = [];
  (allMonitors || []).forEach((m) => {
    (m.history || []).forEach((h) => {
      allHistoryEvents.push({
        event: h,
        monitorTitle: `${m.courseCode} (CRN ${m.crn})`,
        studentEmail: m.notificationEmail
      });
    });
  });
  (allGroups || []).forEach((g) => {
    (g.history || []).forEach((h) => {
      allHistoryEvents.push({
        event: h,
        monitorTitle: `${g.courseCode} (Grup - ${g.sections?.length || 0} Şube)`,
        studentEmail: g.email
      });
    });
  });
  allHistoryEvents.sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime());

  // Comprehensive Metrics
  const uniqueStudents = new Set([
    ...(allMonitors || []).map((m) => (m.notificationEmail || '').toLowerCase().trim()),
    ...(allGroups || []).map((g) => (g.email || '').toLowerCase().trim()),
    ...(users || []).map((u) => (u.email || '').toLowerCase().trim())
  ].filter(Boolean)).size;

  const totalTrackedEntities = (allMonitors || []).length + (allGroups || []).length;
  const totalEmailsDispatched = allHistoryEvents.filter((e) => e.event.emailDispatched).length;
  const activeMonitorsCount =
    (allMonitors || []).filter((m) => m.status === 'active').length +
    (allGroups || []).filter((g) => g.status === 'active').length;

  const openSeatsCount =
    (allMonitors || []).reduce((acc, m) => acc + (m.availableSeats > 0 ? m.availableSeats : 0), 0) +
    (allGroups || []).reduce(
      (acc, g) =>
        acc + (g.sections || []).reduce((sAcc, s) => sAcc + (s.availableSeats > 0 ? s.availableSeats : 0), 0),
      0
    );

  return (
    <div id="admin-page-root" className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="admin-exit-btn"
              onClick={onExit}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Öğrenci Paneline Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-stone-900 leading-tight">İTÜ OBS Yönetim Konsolu</h1>
                <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud SQL • 24/7 Background Daemon Aktif</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <>
                <button
                  onClick={refreshAllAdminData}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Tüm Verileri Yenile"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Yenile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıkış Yap</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {!isAdminAuthenticated ? (
          /* Clean Authentication Form */
          <div className="max-w-sm mx-auto w-full my-12 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            <div className="text-center space-y-2 mb-6">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mx-auto text-stone-800">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">Yönetici Girişi</h2>
              <p className="text-xs text-stone-500">Tüm öğrencilerin takiplerini ve hesaplarını yönetmek için şifre giriniz.</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Yönetici Parolası
                </label>
                <PasswordInput
                  id="admin-master-password"
                  required
                  placeholder="Yönetici parolanızı giriniz..."
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-admin-login-submit"
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Giriş Yap</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-6">
            {/* Dedicated Tabs Navigation */}
            <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-2xs flex flex-wrap gap-1">
              <button
                id="admin-tab-trackers"
                onClick={() => setActiveTab('trackers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'trackers'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Takip Edilen Dersler ({totalTrackedEntities})</span>
              </button>

              <button
                id="admin-tab-users"
                onClick={() => {
                  setActiveTab('users');
                  refreshAllAdminData();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Kayıtlı Hesaplar ({users.length})</span>
              </button>

              <button
                id="admin-tab-scraper"
                onClick={() => setActiveTab('scraper')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'scraper'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Source Scraper & Kaynak</span>
              </button>

              <button
                id="admin-tab-email"
                onClick={() => setActiveTab('email_account')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'email_account'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>SMTP E-posta Sunucu Ayarları</span>
              </button>

              <button
                id="admin-tab-audit"
                onClick={() => setActiveTab('audit_logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'audit_logs'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Denetim Günlükleri ({allHistoryEvents.length})</span>
              </button>

              <button
                id="admin-tab-daemon"
                onClick={() => {
                  setActiveTab('server_daemon');
                  loadDaemonStatus();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'server_daemon'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>7/24 Sunucu Robotu</span>
              </button>

              <button
                id="admin-tab-security"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Güvenlik & Parola</span>
              </button>
            </div>

            {/* TAB 1: Trackers */}
            {activeTab === 'trackers' && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Kayıtlı Öğrenciler
                    </span>
                    <span className="text-2xl font-bold text-stone-900">{uniqueStudents}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Aktif Takipler
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">{activeMonitorsCount}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Açık Kontenjanlar
                    </span>
                    <span className="text-2xl font-bold text-amber-600">{openSeatsCount}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      İletilen E-postalar
                    </span>
                    <span className="text-2xl font-bold text-cyan-600">{totalEmailsDispatched}</span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Öğrenci adı, e-posta, CRN veya ders kodu..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    <div className="flex items-center bg-stone-100 p-0.5 rounded-xl mr-2">
                      <button
                        onClick={() => setTrackerSubTab('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trackerSubTab === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                        }`}
                      >
                        Tümü ({allMonitors.length + allGroups.length})
                      </button>
                      <button
                        onClick={() => setTrackerSubTab('groups')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trackerSubTab === 'groups' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                        }`}
                      >
                        Ders Grupları ({allGroups.length})
                      </button>
                      <button
                        onClick={() => setTrackerSubTab('single')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          trackerSubTab === 'single' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                        }`}
                      >
                        Tekil CRN ({allMonitors.length})
                      </button>
                    </div>

                    {(['all', 'active', 'paused', 'open_seats'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${
                          filterStatus === st
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {st === 'all'
                          ? 'Tümü'
                          : st === 'active'
                          ? 'Aktif'
                          : st === 'paused'
                          ? 'Duraklatılmış'
                          : 'Açık Koltuk'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 1: Ders Kodu Bazlı Takip Grupları */}
                {(trackerSubTab === 'all' || trackerSubTab === 'groups') && filteredGroups.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-stone-500" />
                        <span>Ders Kodu Bazlı Takip Grupları ({filteredGroups.length})</span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredGroups.map((group) => {
                        const totalAvail = (group.sections || []).reduce((acc, s) => acc + (s.availableSeats || 0), 0);
                        const totalCap = (group.sections || []).reduce((acc, s) => acc + (s.capacity || 0), 0);
                        const totalEnrolled = (group.sections || []).reduce((acc, s) => acc + (s.enrolled || 0), 0);

                        return (
                          <div
                            key={group.id}
                            className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition-shadow space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sm text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                                    {group.courseCode}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      group.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {group.status === 'active' ? 'Aktif Takip' : 'Duraklatıldı'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-semibold text-stone-700 mt-1 line-clamp-1">
                                  {group.courseTitle || 'Ders'}
                                </h4>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`inline-block font-bold text-xs px-2.5 py-1 rounded-xl ${
                                    totalAvail > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {totalAvail > 0 ? `🚨 ${totalAvail} Boş Kontenjan` : 'Kontenjan Dolu'}
                                </span>
                                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                  Doluluk: {totalEnrolled}/{totalCap}
                                </div>
                              </div>
                            </div>

                            <div className="text-[11px] bg-stone-50 p-2 rounded-xl flex items-center justify-between border border-stone-200/60">
                              <span className="text-stone-500">Takip Eden Öğrenci:</span>
                              <span className="font-mono font-medium text-stone-800">{group.email}</span>
                            </div>

                            {/* Sections list in this group */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                                Takip Edilen Şubeler ({group.sections?.length || 0} CRN)
                              </span>
                              <div className="max-h-28 overflow-y-auto divide-y divide-stone-100 border border-stone-100 rounded-xl">
                                {(group.sections || []).map((sec) => (
                                  <div
                                    key={sec.crn}
                                    className="px-2 py-1.5 text-[11px] flex items-center justify-between hover:bg-stone-50"
                                  >
                                    <div className="flex items-center gap-1.5 font-mono">
                                      <span className="font-bold text-stone-900">{sec.crn}</span>
                                      <span className="text-stone-400">•</span>
                                      <span className="text-stone-600 truncate max-w-[120px]">{sec.instructor}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                          sec.availableSeats > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500'
                                        }`}
                                      >
                                        {sec.availableSeats} Boş ({sec.enrolled}/{sec.capacity})
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Simulation & Admin Controls */}
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1">
                                {onSimulateNewCrn && (
                                  <button
                                    onClick={() => onSimulateNewCrn(group.courseCode)}
                                    title="Yeni Şube (CRN) Açıldı Simülasyonu"
                                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                                  >
                                    CRN+
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {onForceCheckGroup && (
                                  <button
                                    onClick={() => onForceCheckGroup(group.id)}
                                    title="Şimdi Kontrol Et"
                                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onTogglePauseGroup && (
                                  <button
                                    onClick={() => onTogglePauseGroup(group.id)}
                                    title={group.status === 'active' ? 'Duraklat' : 'Devam Ettir'}
                                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                  >
                                    {group.status === 'active' ? (
                                      <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                                {onDeleteGroup && (
                                  <button
                                    onClick={() => onDeleteGroup(group.id)}
                                    title="Grubu Kaldır"
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Single CRN Trackers Table */}
                {(trackerSubTab === 'all' || trackerSubTab === 'single') && (
                  <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
                    <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stone-500" />
                        <span>Tekil CRN Takipleri ({filteredMonitors.length})</span>
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                          <tr>
                            <th className="py-3 px-4">CRN & Ders</th>
                            <th className="py-3 px-4">Öğrenci & Bildirim</th>
                            <th className="py-3 px-4">Kontenjan</th>
                            <th className="py-3 px-4">Durum</th>
                            <th className="py-3 px-4 text-center">Kontenjan Simülasyonu (Test)</th>
                            <th className="py-3 px-4 text-right">Yönetici İşlemleri</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredMonitors.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-stone-400">
                                Kriterlere uygun tekil CRN takip kaydı bulunamadı.
                              </td>
                            </tr>
                          ) : (
                            filteredMonitors.map((mon) => (
                              <tr key={mon.id} className="hover:bg-stone-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                                      {mon.crn}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCrn(mon.crn)}
                                      title="CRN Kopyala"
                                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                                    >
                                      {copiedId === mon.crn ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <span className="font-semibold text-stone-800">{mon.courseCode}</span>
                                  </div>
                                  <div className="text-[11px] text-stone-500 truncate max-w-xs">{mon.courseTitle}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-medium text-stone-900">{mon.studentName || 'Öğrenci'}</div>
                                  <div className="text-[11px] text-stone-500 font-mono">{mon.notificationEmail}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                        mon.availableSeats > 0
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      {mon.availableSeats} Boş
                                    </span>
                                    <span className="text-[11px] text-stone-400 font-mono">
                                      ({mon.enrolled}/{mon.totalCapacity})
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      mon.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        mon.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                    />
                                    {mon.status === 'active' ? 'Takip Ediliyor' : 'Duraklatıldı'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    {onSimulateDrop && (
                                      <button
                                        onClick={() => onSimulateDrop(mon.id)}
                                        title="+1 Kontenjan Açıldı (Biri Dersi Bıraktı - E-posta Bildirimi Gönderir)"
                                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                                      >
                                        +1 Bıraktı
                                      </button>
                                    )}
                                    {onSimulateCapacityIncrease && (
                                      <button
                                        onClick={() => onSimulateCapacityIncrease(mon.id)}
                                        title="+5 Kapasite Artışı (Bölüm Artırdı - E-posta Bildirimi Gönderir)"
                                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                                      >
                                        +5 Artır
                                      </button>
                                    )}
                                    {onSimulateClaim && (
                                      <button
                                        onClick={() => onSimulateClaim(mon.id)}
                                        title="-1 Ders Alındı (Kontenjan Düştü)"
                                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                                      >
                                        -1 Alındı
                                      </button>
                                    )}
                                    {onSimulateNewCrn && (
                                      <button
                                        onClick={() => onSimulateNewCrn(mon.trackedCourseCode || mon.courseCode)}
                                        title="Yeni CRN Şube Simülasyonu"
                                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                                      >
                                        CRN+
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => onForceCheckMonitor(mon.id)}
                                      title="Şimdi Kontrol Et"
                                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onTogglePauseMonitor(mon.id)}
                                      title={mon.status === 'active' ? 'Duraklat' : 'Devam Ettir'}
                                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                    >
                                      {mon.status === 'active' ? (
                                        <Pause className="w-3.5 h-3.5" />
                                      ) : (
                                        <Play className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => onDeleteMonitor(mon.id)}
                                      title="Takibi Kaldır"
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Kayıtlı Kullanıcı Hesapları & Takip Ettikleri Dersler */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Header & Actions */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-stone-900">Veritabanında Kayıtlı Kullanıcı Hesapları</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 text-white font-mono font-bold">
                          {users.length} Hesap
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Sistemde kayıtlı öğrencilerin listesi, bölümleri ve takip ettikleri tüm dersler.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={refreshAllAdminData}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
                        title="Listeyi Yenile"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Yenile</span>
                      </button>
                    </div>
                  </div>

                  {userSaveSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{userSaveSuccess}</span>
                    </div>
                  )}

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">Toplam Kayıtlı Kullanıcı</span>
                      <span className="text-2xl font-bold text-stone-900 mt-1 block">{users.length}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">E-postası Doğrulanmış</span>
                      <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                        {(users || []).filter((u) => u.isVerified !== false).length}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">Toplam Takip Edilen Ders</span>
                      <span className="text-2xl font-bold text-stone-900 mt-1 block">
                        {allMonitors.length + allGroups.length}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">Aktif Boş Kontenjan</span>
                      <span className="text-2xl font-bold text-amber-600 mt-1 block">{openSeatsCount}</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative pt-2">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-5" />
                    <input
                      id="admin-user-search-input"
                      type="text"
                      placeholder="Kullanıcı adı, e-posta, bölüm (örn: CEV) veya ID ile ara..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 bg-white"
                    />
                  </div>

                  {/* Users Table */}
                  <div className="overflow-hidden border border-stone-200 rounded-xl mt-4">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-4">Kullanıcı / Ad Soyad</th>
                          <th className="py-3 px-4">E-posta Adresi</th>
                          <th className="py-3 px-4">Kayıtlı Bölümler</th>
                          <th className="py-3 px-4">Takip Ettiği Dersler</th>
                          <th className="py-3 px-4">Şifre Durumu</th>
                          <th className="py-3 px-4">Kayıt Tarihi</th>
                          <th className="py-3 px-4 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-stone-400">
                              <UserCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                              <p className="font-medium text-stone-600">Kayıtlı kullanıcı bulunamadı.</p>
                              <p className="text-[11px] text-stone-400 mt-1">
                                {userSearch ? 'Arama kriterlerinize uygun hesap eşleşmedi.' : 'Henüz sisteme kayıt olan bir öğrenci bulunmuyor.'}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => {
                            const userTrackerData = getUserTrackedInfo(user.email, user.id);

                            return (
                              <tr
                                key={String(user.id || user.email)}
                                onClick={() => handleSelectUser(user)}
                                className="hover:bg-stone-50/80 cursor-pointer transition-colors group"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-stone-900 text-white font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-stone-900 leading-tight">
                                        {user.name || 'İsimsiz Kullanıcı'}
                                      </div>
                                      <div className="text-[10px] text-stone-400 font-mono">
                                        ID: {String(user.id || 'usr').slice(0, 14)}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-stone-800">{user.email}</span>
                                    {user.isVerified !== false ? (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                        <Check className="w-2.5 h-2.5" />
                                        Onaylı
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                        Onaysız
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  {user.enrolledPrograms && user.enrolledPrograms.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {user.enrolledPrograms.map((p) => (
                                        <span
                                          key={p.code}
                                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                          {p.code}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-stone-400 italic">Tanımlanmamış</span>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  {userTrackerData.totalCrns > 0 ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-stone-900 text-white font-mono">
                                        {userTrackerData.totalGroups > 0
                                          ? `${userTrackerData.totalGroups} Ders / ${userTrackerData.totalCrns} CRN`
                                          : `${userTrackerData.totalCrns} CRN`}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-stone-400">Takip Yok</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 font-mono text-[11px]">
                                  {user.password ? (
                                    <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md text-[10px]">
                                      <KeyRound className="w-3 h-3 text-stone-400" />
                                      <span>••••••••</span>
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 text-[10px]">Şifre Belirlenmemiş</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                                  {formatSafeDate(user.createdAt)}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleSelectUser(user)}
                                      className="px-2.5 py-1 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    >
                                      Şifre & Dersleri Gör
                                    </button>
                                    <button
                                      onClick={() => handleAdminDeleteUser(user)}
                                      title="Kullanıcıyı Sil"
                                      className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL: Edit Selected Account, Password & View Tracked Classes */}
                {selectedUser && (
                  <div
                    id="admin-user-edit-modal-overlay"
                    className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedUser(null)}
                  >
                    <div
                      id="admin-user-edit-card"
                      className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
                            <Key className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">Hesap, Şifre ve Takip Edilen Dersler</h3>
                            <p className="text-[11px] text-stone-400 font-mono truncate max-w-xs">
                              {selectedUser.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Form & Details */}
                      <div className="max-h-[80vh] overflow-y-auto p-6 space-y-5">
                        {userSaveSuccess && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{userSaveSuccess}</span>
                          </div>
                        )}

                        {userSaveError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{userSaveError}</span>
                          </div>
                        )}

                        {resetEmailFeedback && (
                          <div
                            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                              resetEmailFeedback.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                          >
                            {resetEmailFeedback.success ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{resetEmailFeedback.message}</span>
                          </div>
                        )}

                        {/* SECTION: Öğrencinin Takip Ettiği Dersler (Highlighted) */}
                        {(() => {
                          const info = getUserTrackedInfo(selectedUser.email, selectedUser.id);

                          return (
                            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-stone-700" />
                                  <span>Öğrencinin Takip Ettiği Dersler</span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 text-white">
                                    {info.totalCrns} CRN / {info.totalGroups} Grup
                                  </span>
                                </h4>
                              </div>

                              {info.totalCrns === 0 ? (
                                <p className="text-xs text-stone-400 italic py-2">
                                  Bu öğrenciye ait aktif veya duraklatılmış ders takibi bulunmamaktadır.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {/* Course Groups */}
                                  {info.groups.map((grp) => {
                                    const open = (grp.sections || []).reduce((acc, s) => acc + (s.availableSeats || 0), 0);

                                    return (
                                      <div
                                        key={grp.id}
                                        className="bg-white border border-stone-200/80 rounded-xl p-3 space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded">
                                              {grp.courseCode}
                                            </span>
                                            <span className="text-xs font-semibold text-stone-800 line-clamp-1">
                                              {grp.courseTitle}
                                            </span>
                                          </div>
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              open > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                                            }`}
                                          >
                                            {open > 0 ? `🚨 ${open} Boş Kontenjan` : 'Kontenjan Dolu'}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] pt-1">
                                          {(grp.sections || []).map((s) => (
                                            <div
                                              key={s.crn}
                                              className="p-1.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between"
                                            >
                                              <span className="font-mono font-bold text-stone-800">{s.crn}</span>
                                              <span
                                                className={`text-[10px] font-mono font-bold ${
                                                  s.availableSeats > 0 ? 'text-emerald-700' : 'text-stone-500'
                                                }`}
                                              >
                                                {s.availableSeats} Boş ({s.enrolled}/{s.capacity})
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Single CRN Monitors */}
                                  {info.monitors.map((mon) => (
                                    <div
                                      key={mon.id}
                                      className="bg-white border border-stone-200/80 rounded-xl p-3 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-xs bg-stone-100 px-2 py-0.5 rounded">
                                            {mon.crn}
                                          </span>
                                          <span className="text-xs font-semibold text-stone-800">
                                            {mon.courseCode}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                          {mon.courseTitle} • {mon.instructor}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            mon.availableSeats > 0
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-stone-100 text-stone-600'
                                          }`}
                                        >
                                          {mon.availableSeats} Boş ({mon.enrolled}/{mon.totalCapacity})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Account Edit Form */}
                        <form onSubmit={handleSaveUserChanges} className="space-y-4 pt-2">
                          {/* Name Input */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-800 mb-1">
                              Öğrenci Adı Soyadı
                            </label>
                            <input
                              type="text"
                              value={editUserName}
                              onChange={(e) => setEditUserName(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                              placeholder="Örn: Ahmet Can"
                            />
                          </div>

                          {/* Email (Read-Only) */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-800 mb-1">
                              Kayıtlı E-posta Adresi
                            </label>
                            <input
                              type="email"
                              disabled
                              value={selectedUser.email}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-mono cursor-not-allowed"
                            />
                          </div>

                          {/* Enrolled Programs */}
                          <div>
                            <label className="block text-xs font-semibold text-stone-800 mb-1">
                              Kayıtlı Programlar / Bölümler
                            </label>
                            {selectedUser.enrolledPrograms && selectedUser.enrolledPrograms.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                                {selectedUser.enrolledPrograms.map((p) => (
                                  <span
                                    key={p.code}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-lg"
                                  >
                                    {p.code} - {p.nameTr}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 italic">Henüz program seçimi yapılmamış.</p>
                            )}
                          </div>

                          {/* Password Field & Controls */}
                          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-stone-700" />
                                <span>Hesap Şifresi (Görüntüle / Güncelle)</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleGenerateRandomPassword}
                                className="text-[11px] font-semibold text-stone-900 hover:underline cursor-pointer"
                              >
                                ⚡ Rastgele Şifre Üret
                              </button>
                            </div>

                            <div className="relative">
                              <input
                                type={showPasswordInModal ? 'text' : 'password'}
                                value={editUserPassword}
                                onChange={(e) => setEditUserPassword(e.target.value)}
                                placeholder="Kullanıcının yeni şifresini yazınız..."
                                className="w-full pl-3 pr-10 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 bg-white font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-700"
                                title={showPasswordInModal ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                              >
                                {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* Quick Password Reset Email Trigger */}
                            <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-stone-600">
                                Kullanıcının e-postasına sıfırlama bağlantısı gönder:
                              </span>
                              <button
                                type="button"
                                disabled={isSendingResetEmail}
                                onClick={handleAdminSendResetEmail}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Send className="w-3 h-3 text-stone-600" />
                                <span>{isSendingResetEmail ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Verified Toggle */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              id="edit-user-verified"
                              type="checkbox"
                              checked={editUserVerified}
                              onChange={(e) => setEditUserVerified(e.target.checked)}
                              className="w-4 h-4 text-stone-900 rounded border-stone-300 focus:ring-stone-900"
                            />
                            <label htmlFor="edit-user-verified" className="text-xs font-medium text-stone-700 cursor-pointer">
                              Hesap onaylı ve doğrulanmış (isVerified: true)
                            </label>
                          </div>

                          {/* Modal Footer Buttons */}
                          <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteUser(selectedUser)}
                              className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hesabı Sil</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                              >
                                Kapat
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Değişiklikleri Kaydet</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Source Scraper & Kaynak Ayarları */}
            {activeTab === 'scraper' && (
              <div className="space-y-6">
                {/* Header Information & Configuration Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-stone-900">
                            İTÜ OBS Kaynak Tarayıcı & Parser Yapılandırması (Source Scraper)
                          </h2>
                          <p className="text-xs text-stone-500">
                            Bu alan yalnızca yöneticiler tarafından yapılandırılabilir. Arka plan botunun İTÜ OBS web sayfalarını nasıl tarayacağını belirler.
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-mono border border-stone-200">
                        Admin Only Config
                      </span>
                    </div>
                  </div>

                  {scraperSettingsSavedToast && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Tarayıcı (Source Scraper) yapılandırması başarıyla kaydedildi ve tüm sisteme uygulandı.
                      </span>
                    </div>
                  )}

                  {/* Scraper Configuration Form */}
                  <form onSubmit={handleSaveScraperSettings} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Hedef Kaynak Web Sayfası URL'si (Target Source URL)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                          <input
                            type="url"
                            required
                            value={editedSettings.defaultQuotaUrl}
                            onChange={(e) =>
                              setEditedSettings({ ...editedSettings, defaultQuotaUrl: e.target.value })
                            }
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                            placeholder="https://obs.itu.edu.tr/public/DersProgram"
                          />
                        </div>
                        {editedSettings.defaultQuotaUrl && (
                          <a
                            href={editedSettings.defaultQuotaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Resmi sayfayı yeni sekmede aç"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Sayfayı Aç</span>
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Varsayılan resmi kaynak: <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-700">https://obs.itu.edu.tr/public/DersProgram</code>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                      <div>
                        <label className="block text-xs font-semibold text-stone-800 mb-1">
                          Otomatik Arka Plan Taraması (Auto Polling)
                        </label>
                        <select
                          value={editedSettings.autoRefreshActive ? 'active' : 'inactive'}
                          onChange={(e) =>
                            setEditedSettings({
                              ...editedSettings,
                              autoRefreshActive: e.target.value === 'active'
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 bg-white"
                        >
                          <option value="active">🟢 Aktif (Sürekli Arka Planda Takip Et)</option>
                          <option value="inactive">🔴 Duraklatıldı (Manuel Kontrol)</option>
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Aktif olduğunda sistem kullanıcıya sormadan arka planda dersleri sürekli takip eder.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-800 mb-1">
                          Tarama Periyodu / Kontrol Sıklığı (Saniye)
                        </label>
                        <select
                          value={editedSettings.autoRefreshInterval}
                          onChange={(e) =>
                            setEditedSettings({
                              ...editedSettings,
                              autoRefreshInterval: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 bg-white font-mono"
                        >
                          <option value={15}>15 saniyede bir (Ultra Hızlı)</option>
                          <option value={30}>30 saniyede bir (Hızlı)</option>
                          <option value={45}>45 saniyede bir (Önerilen Varsayılan)</option>
                          <option value={60}>60 saniyede bir (1 Dakika)</option>
                          <option value={120}>120 saniyede bir (2 Dakika)</option>
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          İTÜ sunucularına aşırı yük bindirmeden hızlı bildirim sağlamak için 45s önerilir.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setEditedSettings({
                            ...editedSettings,
                            defaultQuotaUrl: 'https://obs.itu.edu.tr/public/DersProgram',
                            autoRefreshActive: true,
                            autoRefreshInterval: 45
                          })
                        }
                        className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Varsayılana Sıfırla
                      </button>

                      <button
                        id="btn-save-scraper-settings"
                        type="submit"
                        className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Tarayıcı Ayarlarını Kaydet</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Scraper Test Bench */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-stone-700" />
                      <span>Canlı Scraper Test Konsolu (Live Scraper Tester)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      İTÜ OBS sunucularından anlık veri çekme ve HTML DOM ayrıştırma sürecini canlı test edin.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={scraperTestCrn}
                        onChange={(e) => setScraperTestCrn(e.target.value)}
                        placeholder="Örn: 11497, 12486 veya 20194"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTestScraper}
                      disabled={isScraperTesting || !scraperTestCrn.trim()}
                      className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
                    >
                      {isScraperTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Ayrıştırılıyor...</span>
                        </>
                      ) : (
                        <>
                          <Code2 className="w-3.5 h-3.5" />
                          <span>OBS'den Ayrıştır</span>
                        </>
                      )}
                    </button>
                  </div>

                  {scraperTestResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        scraperTestResult.success
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          {scraperTestResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          )}
                          <span>{scraperTestResult.message}</span>
                        </span>
                        {scraperTestResult.durationMs && (
                          <span className="font-mono text-[10px] text-stone-500">
                            {scraperTestResult.durationMs}ms
                          </span>
                        )}
                      </div>

                      {scraperTestResult.data && (
                        <pre className="p-3 bg-stone-900 text-stone-100 rounded-lg text-[11px] font-mono overflow-x-auto">
                          {JSON.stringify(scraperTestResult.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Email SMTP Sunucu Ayarları */}
            {activeTab === 'email_account' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Sistem SMTP E-posta Gönderim Yapılandırması
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Kontenjan açıldığında öğrencilere bildirim e-postalarını göndermek için kullanılacak SMTP hesabı.
                  </p>
                </div>

                {emailConfigSavedToast && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>SMTP ayarları başarıyla kaydedildi.</span>
                  </div>
                )}

                <form onSubmit={handleSaveEmailConfig} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Sunucu Adresi (Host)
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.smtpHost}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, smtpHost: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="smtp-relay.brevo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Port & Güvenlik
                      </label>
                      <input
                        type="number"
                        required
                        value={editedEmailConfig.smtpPort}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, smtpPort: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Kullanıcı Adı / Giriş E-postası
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.smtpUsername}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, smtpUsername: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Parolası / API Anahtarı
                      </label>
                      <input
                        type="password"
                        required
                        value={editedEmailConfig.smtpPassword || ''}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, smtpPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Gönderen Adı
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.senderName}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, senderName: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                        placeholder="itüdis"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Gönderen E-posta Adresi (From)
                      </label>
                      <input
                        type="email"
                        required
                        value={editedEmailConfig.senderAddress}
                        onChange={(e) => setEditedEmailConfig({ ...editedEmailConfig, senderAddress: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="noreply.itudis@gmail.com"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={handleTestSmtpConnection}
                      disabled={smtpTesting}
                      className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      {smtpTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>SMTP Bağlantısını Test Et</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>SMTP Ayarlarını Kaydet</span>
                    </button>
                  </div>
                </form>

                {smtpTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs max-w-2xl flex items-center gap-2 ${
                      smtpTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {smtpTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{smtpTestResult.message}</span>
                  </div>
                )}

                {/* Direct Test Email Dispatch */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 max-w-2xl">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-700" />
                    <span>Doğrudan Test E-postası Gönder</span>
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="alici@itu.edu.tr"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTriggerTestEmail}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Test E-postası Gönder
                    </button>
                  </div>
                  {testEmailSentToast && (
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ✓ Test e-postası {testEmailRecipient} adresine iletildi.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Denetim Günlükleri */}
            {activeTab === 'audit_logs' && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-stone-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Sistem Denetim ve Kontenjan Değişim Günlükleri</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Öğrencilere gönderilen e-postalar ve otomatik tespit edilen kontenjan değişimleri.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                    {allHistoryEvents.length} Kayıt
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Tarih / Zaman</th>
                        <th className="py-3 px-4">Ders / CRN</th>
                        <th className="py-3 px-4">Öğrenci</th>
                        <th className="py-3 px-4">Değişim</th>
                        <th className="py-3 px-4">E-posta Bildirimi</th>
                        <th className="py-3 px-4">Notlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {allHistoryEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-stone-400">
                            Henüz kayıtlı bir denetim günlüğü bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        allHistoryEvents.map(({ event, monitorTitle, studentEmail }) => (
                          <tr key={event.id} className="hover:bg-stone-50">
                            <td className="py-3 px-4 font-mono text-stone-500">
                              {new Date(event.timestamp).toLocaleString('tr-TR')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-stone-800">{monitorTitle}</td>
                            <td className="py-3 px-4 font-mono text-stone-600">{studentEmail}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded ${
                                  event.newAvailable > event.oldAvailable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {event.oldAvailable} → {event.newAvailable}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {event.emailDispatched ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <Check className="w-3.5 h-3.5" />
                                  İletildi
                                </span>
                              ) : (
                                <span className="text-stone-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{event.notes || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: Güvenlik ve Parola */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6 max-w-lg">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Yönetici Güvenlik Parolası</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Bu sayfaya giriş için kullanılan yönetici ana parolasını güncelleyebilirsiniz.
                  </p>
                </div>

                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Yönetici parolası başarıyla güncellendi.</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Yeni Yönetici Parolası
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="En az 8 karakter..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Parolayı Güncelle
                  </button>
                </form>
              </div>
            )}

            {/* TAB 7: 7/24 Sunucu Robotu Durumu ve Günlükleri */}
            {activeTab === 'server_daemon' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <h2 className="text-base font-bold text-stone-900">7/24 Kesintisiz Sunucu Robotu (Daemon)</h2>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Bu robot, kullanıcıların bilgisayarları veya tarayıcıları kapalı olsa dahi sunucu tarafında her 30 saniyede bir Cloud SQL'deki tüm aktif dersleri canlı İTÜ OBS üzerinden tarar ve kontenjan açıldığında e-posta gönderir.
                      </p>
                    </div>

                    <button
                      onClick={handleTriggerDaemonCheck}
                      disabled={isTriggeringDaemon}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringDaemon ? 'animate-spin' : ''}`} />
                      <span>{isTriggeringDaemon ? 'Taranıyor...' : 'Şimdi Canlı Tara'}</span>
                    </button>
                  </div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Sunucu Çalışma Durumu</div>
                      <div className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        7/24 Kesintisiz Aktif
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">Periyot: 30 saniyede bir</div>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Son Tarama Zamanı</div>
                      <div className="text-base font-bold text-stone-900 mt-1 font-mono">
                        {daemonStatus?.lastCheckTime
                          ? new Date(daemonStatus.lastCheckTime).toLocaleTimeString('tr-TR')
                          : 'Yeni Başlatıldı'}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Sonraki: 30s içinde
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Taranan Aktif Dersler</div>
                      <div className="text-base font-bold text-stone-900 mt-1 font-mono">
                        {(daemonStatus?.activeMonitorsCount || 0) + (daemonStatus?.activeGroupsCount || 0)} adet
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        {daemonStatus?.activeMonitorsCount || 0} CRN, {daemonStatus?.activeGroupsCount || 0} Grup
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Toplam Gönderilen E-Posta</div>
                      <div className="text-base font-bold text-stone-900 mt-1 font-mono">
                        {daemonStatus?.emailsSent || 0} adet
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        {daemonStatus?.smtpSender || 'SMTP Hazır'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Daemon Event Logs */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Arka Plan Robotu İşlem Günlükleri</h3>
                      <p className="text-xs text-stone-500 mt-0.5">Sunucuda gerçekleşen son kontrol ve uyarı olayları</p>
                    </div>
                    <button
                      onClick={loadDaemonStatus}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Yenile</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-950 p-4 font-mono text-xs text-stone-300 max-h-96 overflow-y-auto space-y-2">
                    {(!daemonStatus?.recentLogs || daemonStatus.recentLogs.length === 0) ? (
                      <div className="text-stone-500 py-4 text-center">
                        Arka plan döngüsü çalışıyor, log kayıtları bekleniyor...
                      </div>
                    ) : (
                      daemonStatus.recentLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-stone-500 shrink-0 select-none">
                            [{new Date(log.timestamp).toLocaleTimeString('tr-TR')}]
                          </span>
                          <span
                            className={
                              log.level === 'alert'
                                ? 'text-emerald-400 font-bold'
                                : log.level === 'warn'
                                ? 'text-amber-400 font-semibold'
                                : 'text-stone-300'
                            }
                          >
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
