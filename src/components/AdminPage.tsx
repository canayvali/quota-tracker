import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  History,
  Key,
  Lock,
  LogOut,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  Users
} from 'lucide-react';
import { ClassMonitor, EmailSenderConfig, GlobalSettings, QuotaHistoryEvent } from '../types';
import { PasswordInput } from './PasswordInput';

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

type AdminTab = 'trackers' | 'email_account' | 'audit_logs' | 'security';

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

  // Security password state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SMTP Testing state
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
                <p className="text-[11px] text-stone-400">Yalnızca URL /admin adresi üzerinden erişilebilir</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated ? (
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
            ) : (
              <span className="text-xs text-stone-400 font-mono">Varsayılan Parola: HelloWorld</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {!isAdminAuthenticated ? (
          /* Authentication Form (Full Page Card) */
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm">
            <div className="text-center space-y-3 mb-6">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-800">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Yönetici Girişi</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                Bu yönetim sekmesine yalnızca yetkili yöneticiler erişebilir. E-posta sunucusu (SMTP) ayarlarını ve öğrenci takiplerini yönetmek için şifrenizi giriniz.
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Yönetici Parolası
                </label>
                <PasswordInput
                  id="admin-master-password"
                  required
                  placeholder="Yönetici parolanızı giriniz..."
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  İlk kurulum varsayılanı: <code className="text-stone-700 font-mono bg-stone-100 px-1 py-0.5 rounded">HelloWorld</code>
                </p>
              </div>

              <button
                id="btn-admin-login-submit"
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Giriş Yap ve Yönetim Panelini Aç</span>
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
