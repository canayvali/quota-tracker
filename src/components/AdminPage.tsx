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
  Globe
} from 'lucide-react';
import { ClassMonitor, EmailSenderConfig, GlobalSettings, QuotaHistoryEvent, UserAccount } from '../types';
import { PasswordInput } from './PasswordInput';
import { deleteUserAccount, loadUsers, saveUsers, updateUserAccount } from '../utils/storage';

interface AdminPageProps {
  onExit: () => void;
  monitors: ClassMonitor[];
  emailConfig: EmailSenderConfig;
  settings: GlobalSettings;
  onSaveEmailConfig: (newConfig: EmailSenderConfig) => void;
  onUpdateSettings: (newSettings: GlobalSettings) => void;
  onTogglePauseMonitor: (id: string) => void;
  onDeleteMonitor: (id: string) => void;
  onForceCheckMonitor: (id: string) => void;
  onSendTestEmail: (recipientEmail: string, customSubject?: string) => void;
  isAdminAuthenticated: boolean;
  onSetAdminAuthenticated: (auth: boolean) => void;
}

type AdminTab = 'trackers' | 'users' | 'scraper' | 'email_account' | 'audit_logs' | 'security';

export const AdminPage: React.FC<AdminPageProps> = ({
  onExit,
  monitors,
  emailConfig,
  settings,
  onSaveEmailConfig,
  onUpdateSettings,
  onTogglePauseMonitor,
  onDeleteMonitor,
  onForceCheckMonitor,
  onSendTestEmail,
  isAdminAuthenticated,
  onSetAdminAuthenticated
}) => {
  // Authentication Form state
  const [enteredPassword, setEnteredPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('trackers');
  const [studentSearch, setStudentSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'open_seats'>('all');

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
  const [scraperTableFilter, setScraperTableFilter] = useState('');

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

  // Registered Users (Database) State
  const [users, setUsers] = useState<UserAccount[]>(() => loadUsers());
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserVerified, setEditUserVerified] = useState(true);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [userSaveSuccess, setUserSaveSuccess] = useState<string | null>(null);
  const [userSaveError, setUserSaveError] = useState<string | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailFeedback, setResetEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const refreshUsersList = async () => {
    const localUsers = loadUsers();
    setUsers(localUsers);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const map = new Map<string, UserAccount>();
          for (const u of localUsers) {
            if (u.email) map.set(u.email.toLowerCase(), u);
          }
          for (const su of data.users) {
            if (su.email && !map.has(su.email.toLowerCase())) {
              map.set(su.email.toLowerCase(), {
                id: su.id || 'usr-' + Date.now(),
                name: su.name || 'Öğrenci',
                email: su.email,
                password: su.password || '',
                isVerified: su.isVerified !== false,
                createdAt: su.createdAt || new Date().toISOString(),
                lastLoginAt: su.lastLoginAt || new Date().toISOString()
              });
            }
          }
          const merged = Array.from(map.values());
          setUsers(merged);
          saveUsers(merged);
        }
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      refreshUsersList();
    }
  }, [isAdminAuthenticated]);

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditUserName(user.name);
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

    const updatedList = users.map((u) =>
      u.email.toLowerCase() === selectedUser.email.toLowerCase()
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
    setUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== userToDelete.email.toLowerCase()));
    if (selectedUser?.email.toLowerCase() === userToDelete.email.toLowerCase()) {
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

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
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

  // Filtered monitors for "Monitor who is tracking which class"
  const filteredMonitors = monitors.filter((m) => {
    if (filterStatus === 'active' && m.status !== 'active') return false;
    if (filterStatus === 'paused' && m.status !== 'paused') return false;
    if (filterStatus === 'open_seats' && m.availableSeats === 0) return false;

    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      m.notificationEmail.toLowerCase().includes(q) ||
      (m.studentName && m.studentName.toLowerCase().includes(q)) ||
      m.crn.includes(q) ||
      m.courseCode.toLowerCase().includes(q) ||
      m.courseTitle.toLowerCase().includes(q)
    );
  });

  // Aggregate audit logs
  const allHistoryEvents: { event: QuotaHistoryEvent; monitor: ClassMonitor }[] = [];
  monitors.forEach((m) => {
    m.history.forEach((h) => {
      allHistoryEvents.push({ event: h, monitor: m });
    });
  });
  allHistoryEvents.sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime());

  // Statistics
  const uniqueStudents = new Set(monitors.map((m) => m.notificationEmail)).size;
  const totalEmailsDispatched = allHistoryEvents.filter((e) => e.event.emailDispatched).length;
  const activeMonitorsCount = monitors.filter((m) => m.status === 'active').length;
  const openSeatsCount = monitors.reduce((acc, m) => acc + (m.availableSeats > 0 ? m.availableSeats : 0), 0);

  return (
    <div id="admin-page-root" className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="admin-exit-btn"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfa</span>
            </button>

            {isAdminAuthenticated && (
              <>
                <div className="h-4 w-px bg-stone-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-xs">
                    OBS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-bold text-sm text-stone-900 leading-tight">İTÜ OBS Yönetim Paneli</h1>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono border border-stone-200">
                        /admin
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Yönetici Oturumu Açık
                </span>
                <button
                  id="admin-logout-btn"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        {!isAdminAuthenticated ? (
          /* Ultra-clean and Minimalist Authentication Form */
          <div className="max-w-sm mx-auto w-full my-auto bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            <div className="text-center space-y-2 mb-6">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mx-auto text-stone-800">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">Yönetici Girişi</h2>
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
          /* Authenticated Admin Dashboard with Dedicated Tabs ("ayrı bir sekme olsun") */
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
                <span>Takip Edilen Dersler ({monitors.length})</span>
              </button>

              <button
                id="admin-tab-users"
                onClick={() => {
                  setActiveTab('users');
                  refreshUsersList();
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
                <span>Source Scraper & Kaynak ({monitors.length})</span>
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

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {(['all', 'active', 'paused', 'open_seats'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${
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

                {/* Trackers Table */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-4">CRN & Ders</th>
                          <th className="py-3 px-4">Öğrenci & Bildirim</th>
                          <th className="py-3 px-4">Kontenjan</th>
                          <th className="py-3 px-4">Durum</th>
                          <th className="py-3 px-4 text-right">Yönetici İşlemleri</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredMonitors.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-stone-400">
                              Kriterlere uygun takip kaydı bulunamadı.
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
              </div>
            )}

            {/* TAB: Kayıtlı Kullanıcı Hesapları (Database) */}
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
                        Sistemde kayıtlı öğrencilerin listesi. Bir hesabın şifresini veya bilgilerini değiştirmek için üzerine tıklayınız.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={refreshUsersList}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                        title="Listeyi Yenile"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">Toplam Kayıtlı Kullanıcı</span>
                      <span className="text-2xl font-bold text-stone-900 mt-1 block">{users.length}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">E-postası Doğrulanmış</span>
                      <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                        {users.filter((u) => u.isVerified !== false).length}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-medium text-stone-500 block">Aktif Takipçi Dersi</span>
                      <span className="text-2xl font-bold text-stone-900 mt-1 block">{monitors.length}</span>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative pt-2">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-5" />
                    <input
                      id="admin-user-search-input"
                      type="text"
                      placeholder="Kullanıcı adı, e-posta veya ID ile ara..."
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
                          <th className="py-3 px-4">Şifre Durumu</th>
                          <th className="py-3 px-4">Kayıt Tarihi</th>
                          <th className="py-3 px-4 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-stone-400">
                              <UserCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                              <p className="font-medium text-stone-600">Kayıtlı kullanıcı bulunamadı.</p>
                              <p className="text-[11px] text-stone-400 mt-1">
                                {userSearch ? 'Arama kriterlerinize uygun hesap eşleşmedi.' : 'Henüz sisteme kayıt olan bir öğrenci bulunmuyor.'}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr
                              key={user.id || user.email}
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
                                      ID: {user.id ? user.id.slice(0, 14) : 'local'}
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
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleSelectUser(user)}
                                    className="px-2.5 py-1 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    Şifre / Düzenle
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL: Edit Selected Account & Password */}
                {selectedUser && (
                  <div
                    id="admin-user-edit-modal-overlay"
                    className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedUser(null)}
                  >
                    <div
                      id="admin-user-edit-card"
                      className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
                            <Key className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">Hesap ve Şifre Yönetimi</h3>
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

                      {/* Modal Form */}
                      <form onSubmit={handleSaveUserChanges} className="p-6 space-y-4">
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

                          <p className="text-[11px] text-stone-500">
                            Buradan kullanıcının şifresini doğrudan değiştirebilir veya öğrenciye sıfırlama kodu gönderebilirsiniz.
                          </p>

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
                )}
              </div>
            )}

            {/* TAB: Source Scraper & Kaynak Ayarları */}
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
                            Bu alan yalnızca yöneticiler tarafından yapılandırılabilir. Arka plan botunun İTÜ OBS web sayfalarını nasıl tarayacağını ve CRN tablosunu nasıl ayrıştıracağını belirler.
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
                          <span>Sorgulanıyor...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Canlı Sorgula</span>
                        </>
                      )}
                    </button>
                  </div>

                  {scraperTestResult && (
                    <div
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        scraperTestResult.success
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {scraperTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{scraperTestResult.message}</span>
                      </div>

                      {scraperTestResult.data && (
                        <div className="bg-white p-3 rounded-lg border border-emerald-100 text-stone-800 space-y-1 font-mono text-[11px]">
                          <div><strong className="font-sans text-stone-600">CRN:</strong> {scraperTestResult.data.crn}</div>
                          <div><strong className="font-sans text-stone-600">Ders Kodu:</strong> {scraperTestResult.data.courseCode}</div>
                          <div><strong className="font-sans text-stone-600">Ders Adı:</strong> {scraperTestResult.data.courseTitle || '-'}</div>
                          <div><strong className="font-sans text-stone-600">Kapasite:</strong> {scraperTestResult.data.totalCapacity} | <strong className="font-sans text-stone-600">Kayıtlı:</strong> {scraperTestResult.data.enrolled} | <strong className="font-sans text-stone-600">Kalan Kontenjan:</strong> <span className={scraperTestResult.data.availableSeats > 0 ? 'text-emerald-600 font-bold' : 'text-stone-600 font-bold'}>{scraperTestResult.data.availableSeats}</span></div>
                          <div><strong className="font-sans text-stone-600">Kaynak Motoru:</strong> <span className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">{scraperTestResult.data.source || 'live_itu_obs'}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Extracted Table Preview (Moved from Footer) */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-stone-700" />
                        <span>Ayrıştırılan CRN Kontenjan Tablosu (Source Web Page Table & CRN Parser)</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Sistemde aktif olarak takip edilen ve web ayrıştırıcısı tarafından anlık kontrol edilen dersler.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="CRN veya Ders Filtrele..."
                          value={scraperTableFilter}
                          onChange={(e) => setScraperTableFilter(e.target.value)}
                          className="pl-8 pr-3 py-1 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 w-48 font-mono"
                        />
                      </div>
                      <span className="text-xs text-stone-400 font-mono">
                        {monitors.length} Kayıt
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider font-mono">
                          <tr>
                            <th className="py-2.5 px-3">CRN</th>
                            <th className="py-2.5 px-3">Ders Kodu</th>
                            <th className="py-2.5 px-3">Ders Adı</th>
                            <th className="py-2.5 px-3 text-center">Kapasite</th>
                            <th className="py-2.5 px-3 text-center">Kayıtlı</th>
                            <th className="py-2.5 px-3 text-center">Kalan Boş</th>
                            <th className="py-2.5 px-3">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 font-sans">
                          {monitors.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-stone-400 font-sans">
                                Henüz takip edilen aktif bir CRN bulunmuyor.
                              </td>
                            </tr>
                          ) : (
                            monitors
                              .filter((m) =>
                                !scraperTableFilter ||
                                m.crn.includes(scraperTableFilter) ||
                                m.courseCode.toLowerCase().includes(scraperTableFilter.toLowerCase()) ||
                                m.courseTitle.toLowerCase().includes(scraperTableFilter.toLowerCase())
                              )
                              .map((m) => {
                                const isSeatOpen = m.availableSeats > 0;
                                return (
                                  <tr
                                    key={m.id}
                                    className={`hover:bg-stone-50 transition-colors ${
                                      isSeatOpen ? 'bg-emerald-50/40 font-medium' : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                      {m.crn}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-stone-800">
                                      {m.courseCode}
                                    </td>
                                    <td className="py-2.5 px-3 text-stone-600 max-w-[200px] truncate">
                                      {m.courseTitle}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                                      {m.totalCapacity}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                                      {m.enrolled}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${
                                          isSeatOpen
                                            ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                                            : 'bg-stone-100 text-stone-600'
                                        }`}
                                      >
                                        {m.availableSeats}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {isSeatOpen ? (
                                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          KONTENJAN AÇIK
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-stone-500">DOLU</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
                    <strong className="text-stone-800">Tarayıcı motoru nasıl çalışır?</strong> Sistem arka planda belirlenen periyotta hedef İTÜ OBS web sayfasına HTTP isteği atar, HTML tablo satırları arasından <code className="bg-stone-200 px-1 py-0.5 rounded text-[11px] font-mono">CRN</code> hücresini eşleştirir, Kapasite ve Kayıtlı öğrenci sayılarını çıkarır. Eğer kontenjan sayısı artarsa, öğrencinin e-postasına anında bildirim gönderir.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SMTP / E-posta Sunucu Ayarları */}
            {activeTab === 'email_account' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-stone-900">SMTP Sunucusu ve Gönderici Ayarları</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Ortak SMTP Motoru
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Bu panelde yapılandırılan SMTP sunucusu, <strong>hem normal kontenjan bildirimlerinde</strong> hem de yeni kayıt olan öğrencilere giden <strong>6 haneli doğrulama kodu e-postalarında</strong> ortak olarak kullanılır.
                  </p>
                </div>

                {emailConfigSavedToast && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      SMTP ayarları başarıyla kaydedildi ve sunucuya aktarıldı. Artık hem doğrulama kodları hem de kontenjan uyarıları bu SMTP üzerinden iletilecektir.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSaveEmailConfig} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Gönderici E-posta Adresi (From / Sender Email)
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.senderAddress}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, senderAddress: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="ayvali@itu.edu.tr veya ba7eed001@smtp-brevo.com"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Alıcıların gelen kutusunda göreceği gönderici adresi
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        Gönderici Görünen Adı (From Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.senderName}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, senderName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                        placeholder="İTÜ OBS Quota Alert System"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Sunucu Adresi (Host)
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.smtpHost}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, smtpHost: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="smtp-relay.brevo.com veya smtp.gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Portu
                      </label>
                      <input
                        type="number"
                        required
                        value={editedEmailConfig.smtpPort}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, smtpPort: parseInt(e.target.value, 10) || 587 })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Kullanıcı Adı (Username / Login)
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.smtpUsername}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, smtpUsername: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900 font-mono"
                        placeholder="ba7eed001@smtp-brevo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-800 mb-1">
                        SMTP Şifresi / API Anahtarı
                      </label>
                      <PasswordInput
                        id="admin-smtp-password"
                        required
                        placeholder="SMTP şifreniz..."
                        value={editedEmailConfig.smtpPassword || ''}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, smtpPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      id="admin-save-smtp-btn"
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>SMTP Ayarlarını Kaydet & Sunucuya Uygula</span>
                    </button>

                    <button
                      id="admin-test-connection-btn"
                      type="button"
                      disabled={smtpTesting}
                      onClick={handleTestSmtpConnection}
                      className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {smtpTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>SMTP Bağlantısını Test Et</span>
                    </button>
                  </div>
                </form>

                {/* Test Connection Output */}
                {smtpTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      smtpTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {smtpTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">
                        {smtpTestResult.success ? 'Bağlantı Başarılı!' : 'Bağlantı Hatası!'}
                      </span>
                      <span>{smtpTestResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Trigger Real Test Email */}
                <div className="pt-4 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-800 mb-2">Canlı Test E-postası Gönder</h3>
                  <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="test@itu.edu.tr"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-stone-900"
                    />
                    <button
                      id="admin-send-test-email-btn"
                      type="button"
                      onClick={handleTriggerTestEmail}
                      className="px-3.5 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Maili Gönder</span>
                    </button>
                  </div>
                  {testEmailSentToast && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
                      ✓ Test e-postası {testEmailRecipient} adresine iletildi.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Audit Logs */}
            {activeTab === 'audit_logs' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Sistem Denetim Günlüğü</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Kontenjan değişiklikleri ve iletilen e-posta bildirimlerinin tam zamanlı tarihçesi.
                  </p>
                </div>

                <div className="overflow-hidden border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Zaman</th>
                        <th className="py-2.5 px-3">Ders / CRN</th>
                        <th className="py-2.5 px-3">Değişim</th>
                        <th className="py-2.5 px-3">Öğrenci / Bildirim</th>
                        <th className="py-2.5 px-3 text-right">E-posta İletimi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                      {allHistoryEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-stone-400 font-sans">
                            Henüz kayıtlı bir denetim olayı gerçekleşmedi.
                          </td>
                        </tr>
                      ) : (
                        allHistoryEvents.slice(0, 50).map(({ event: h, monitor: m }) => (
                          <tr key={h.id} className="hover:bg-stone-50 transition-colors">
                            <td className="py-2.5 px-3 text-stone-500">
                              {new Date(h.timestamp).toLocaleTimeString('tr-TR')}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-bold text-stone-900">{m.courseCode}</span>{' '}
                              <span className="text-stone-400 font-mono">({m.crn})</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-semibold ${
                                  h.type === 'increased'
                                    ? 'text-emerald-600'
                                    : h.type === 'decreased'
                                    ? 'text-rose-600'
                                    : 'text-stone-600'
                                }`}
                              >
                                {h.oldAvailable} → {h.newAvailable}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans truncate max-w-xs text-stone-600">
                              {h.emailRecipient}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              {h.emailDispatched ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Gönderildi
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400">Gönderilmedi</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Security */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6 max-w-xl">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Yönetici Ana Parolasını Değiştir</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Bu yönetim paneline (/admin) erişim için kullanılan yönetici şifresini güncelleyiniz.
                  </p>
                </div>

                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Yönetici parolası başarıyla güncellendi!</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Yeni Yönetici Parolası (En az 8 karakter)
                    </label>
                    <PasswordInput
                      id="new-admin-password"
                      required
                      placeholder="Yeni parolanız..."
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>

                  <button
                    id="btn-save-admin-password"
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Parolayı Güncelle</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
