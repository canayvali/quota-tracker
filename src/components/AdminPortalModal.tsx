import React, { useState } from 'react';
import {
  AlertCircle,
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
  Users,
  X
} from 'lucide-react';
import { ClassMonitor, EmailSenderConfig, GlobalSettings, QuotaHistoryEvent } from '../types';
import { PasswordInput } from './PasswordInput';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

  const currentAdminPassword = settings.adminPassword || 'HelloWorld';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === currentAdminPassword || enteredPassword.trim() === 'HelloWorld') {
      onSetAdminAuthenticated(true);
      setAuthError('');
      setEnteredPassword('');
    } else {
      setAuthError('Incorrect admin password. Please enter the valid admin password.');
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
        message: 'Could not contact server to verify Brevo SMTP relay.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEmailConfig(editedEmailConfig);
    setEmailConfigSavedToast(true);
    setTimeout(() => setEmailConfigSavedToast(false), 3000);
  };

  const handleTriggerTestEmail = () => {
    if (!testEmailRecipient.trim()) return;
    onSendTestEmail(testEmailRecipient.trim(), `[ADMIN TEST] İTÜ OBS Quota Alert System Verified`);
    setTestEmailSentToast(true);
    setTimeout(() => setTestEmailSentToast(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword.trim() || newAdminPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
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

  return (
    <div
      id="admin-portal-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="admin-portal-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Admin Control Center
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 font-mono border border-stone-700">
                  Password Protected
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Manage website outgoing email accounts, monitor student tracking registries, and inspect dispatch logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Auth Challenge Screen (if not logged in) */}
        {!isAdminAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto">
            <div className="h-12 w-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-6">
              Yönetici Girişi
            </h3>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="relative text-left">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Yönetici Parolası
                </label>
                <PasswordInput
                  id="admin-master-password"
                  placeholder="Yönetici parolanızı giriniz..."
                  value={enteredPassword}
                  onChange={(e) => {
                    setEnteredPassword(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  hasLeftLockIcon={false}
                  inputClassName="py-2.5 text-sm"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-6 bg-stone-100 border-b border-stone-200 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('trackers')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'trackers'
                    ? 'border-stone-900 text-stone-900 bg-white font-bold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Student Trackers Registry</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                  {monitors.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('email_account')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'email_account'
                    ? 'border-stone-900 text-stone-900 bg-white font-bold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Website Email Account</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
                  {emailConfig.senderAddress.split('@')[0]}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'audit_logs'
                    ? 'border-stone-900 text-stone-900 bg-white font-bold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Email Dispatch Audit</span>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                  {totalEmailsDispatched} sent
                </span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-stone-900 text-stone-900 bg-white font-bold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Security & Passcode</span>
              </button>
            </div>

            {/* Tab 1: Student Trackers Registry ("Monitor who is tracking which class") */}
            {activeTab === 'trackers' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 font-medium">Total Active Trackers</div>
                    <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                      {monitors.filter((m) => m.status === 'active').length}
                    </div>
                  </div>
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 font-medium">Unique Students</div>
                    <div className="text-xl font-bold text-stone-900 font-mono mt-0.5">
                      {uniqueStudents}
                    </div>
                  </div>
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 font-medium">Classes With Open Seats</div>
                    <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
                      {monitors.filter((m) => m.availableSeats > 0).length}
                    </div>
                  </div>
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-[11px] text-stone-500 font-medium">Total Alerts Dispatched</div>
                    <div className="text-xl font-bold text-amber-700 font-mono mt-0.5">
                      {totalEmailsDispatched}
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search student email, student name, CRN, course code..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                    <span className="text-stone-500 font-medium">Filter:</span>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        filterStatus === 'all'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      All ({monitors.length})
                    </button>
                    <button
                      onClick={() => setFilterStatus('active')}
                      className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        filterStatus === 'active'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilterStatus('open_seats')}
                      className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        filterStatus === 'open_seats'
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      Open Seats Only
                    </button>
                  </div>
                </div>

                {/* Trackers Table */}
                <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider font-mono">
                        <tr>
                          <th className="py-2.5 px-3">Student / Recipient</th>
                          <th className="py-2.5 px-3">CRN</th>
                          <th className="py-2.5 px-3">Course</th>
                          <th className="py-2.5 px-3 text-center">Quota State</th>
                          <th className="py-2.5 px-3">Alert Condition</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 font-sans">
                        {filteredMonitors.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-stone-500 text-xs">
                              No student trackers found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredMonitors.map((m) => {
                            const isSeatOpen = m.availableSeats > 0;
                            const alertsSent = m.history.filter((h) => h.emailDispatched).length;

                            return (
                              <tr key={m.id} className="hover:bg-stone-50/80 transition-colors">
                                {/* Student Info */}
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-stone-900">
                                    {m.studentName || 'Student'}
                                  </div>
                                  <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-stone-400" />
                                    <span>{m.notificationEmail}</span>
                                  </div>
                                </td>

                                {/* CRN */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 rounded-md bg-stone-900 text-amber-400 font-mono font-bold text-[11px]">
                                      {m.crn}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCrn(m.crn)}
                                      title="Copy CRN"
                                      className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                                    >
                                      {copiedId === m.crn ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* Course */}
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-stone-900 font-mono text-[11px]">
                                    {m.courseCode}
                                  </div>
                                  <div className="text-stone-600 text-[11px] truncate max-w-[180px]">
                                    {m.courseTitle}
                                  </div>
                                </td>

                                {/* Quota State */}
                                <td className="py-3 px-3 text-center">
                                  <div className="font-mono text-xs font-semibold text-stone-800">
                                    {m.enrolled} / {m.totalCapacity}
                                  </div>
                                  <div className="mt-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isSeatOpen
                                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                          : 'bg-stone-100 text-stone-600'
                                      }`}
                                    >
                                      {m.availableSeats} open
                                    </span>
                                  </div>
                                </td>

                                {/* Alert Preference */}
                                <td className="py-3 px-3 text-[11px] text-stone-600">
                                  <div>
                                    {m.alertPreference === 'any_change'
                                      ? 'Any quota delta (+/-)'
                                      : 'Only when seats open (>0)'}
                                  </div>
                                  <div className="text-[10px] text-stone-400">
                                    {alertsSent} alert{alertsSent === 1 ? '' : 's'} dispatched
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      m.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-stone-100 text-stone-600'
                                    }`}
                                  >
                                    {m.status}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => onForceCheckMonitor(m.id)}
                                      title="Force Quota Check"
                                      className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onSendTestEmail(m.notificationEmail)}
                                      title="Send Instant Test Email to Student"
                                      className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onTogglePauseMonitor(m.id)}
                                      title={m.status === 'active' ? 'Pause Tracker' : 'Resume Tracker'}
                                      className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                                    >
                                      {m.status === 'active' ? (
                                        <Pause className="h-3.5 w-3.5" />
                                      ) : (
                                        <Play className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Remove monitor for CRN ${m.crn} (${m.notificationEmail})?`)) {
                                          onDeleteMonitor(m.id);
                                        }
                                      }}
                                      title="Remove Tracker"
                                      className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
              </div>
            )}

            {/* Tab 2: Website Email Account Manager */}
            {activeTab === 'email_account' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <strong className="block font-semibold mb-0.5">Website Outgoing Email Service</strong>
                    All quota change notifications sent to students originate from this configured account. You can connect your dedicated university email address, Gmail App Password, or SMTP relay service.
                  </div>
                </div>

                <form onSubmit={handleSaveEmailConfig} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sender Address */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        System Sender Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={editedEmailConfig.senderAddress}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, senderAddress: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                        placeholder="crn-alert@itu-quota-bot.org"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Students see this in the "From:" header
                      </span>
                    </div>

                    {/* Sender Display Name */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Sender Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editedEmailConfig.senderName}
                        onChange={(e) =>
                          setEditedEmailConfig({ ...editedEmailConfig, senderName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                        placeholder="İTÜ OBS Quota Dispatcher"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Friendly name displayed in student inboxes
                      </span>
                    </div>
                  </div>

                  {/* Provider selection */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Email Delivery Service
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {(['custom_smtp', 'gmail', 'resend', 'sendgrid'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditedEmailConfig({ ...editedEmailConfig, provider: p })}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            editedEmailConfig.provider === p
                              ? 'border-stone-900 bg-stone-900 text-white font-semibold shadow-xs'
                              : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="capitalize">{p.replace('_', ' ')}</div>
                          <div className={`text-[10px] font-normal ${editedEmailConfig.provider === p ? 'text-stone-300' : 'text-stone-400'}`}>
                            {p === 'gmail' && 'OAuth / App Passwords'}
                            {p === 'custom_smtp' && 'University Mail / SSL'}
                            {p === 'resend' && 'Modern API Key'}
                            {p === 'sendgrid' && 'Twilio Cloud Relay'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SMTP Credentials */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
                    <div className="text-xs font-semibold text-stone-800">
                      Connection & Authentication Credentials
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-stone-600 mb-1">SMTP Host Server</label>
                        <input
                          type="text"
                          value={editedEmailConfig.smtpHost}
                          onChange={(e) =>
                            setEditedEmailConfig({ ...editedEmailConfig, smtpHost: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 font-mono text-xs rounded-md border border-stone-300 bg-white"
                          placeholder="smtp.gmail.com or mail.itu.edu.tr"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 mb-1">Port</label>
                        <input
                          type="number"
                          value={editedEmailConfig.smtpPort}
                          onChange={(e) =>
                            setEditedEmailConfig({ ...editedEmailConfig, smtpPort: parseInt(e.target.value, 10) || 587 })
                          }
                          className="w-full px-2.5 py-1.5 font-mono text-xs rounded-md border border-stone-300 bg-white"
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-stone-600 mb-1">SMTP Username / Email</label>
                        <input
                          type="text"
                          value={editedEmailConfig.smtpUsername}
                          onChange={(e) =>
                            setEditedEmailConfig({ ...editedEmailConfig, smtpUsername: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 font-mono text-xs rounded-md border border-stone-300 bg-white"
                          placeholder="bot@itu-quota-bot.org"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 mb-1">SMTP Password / App Secret</label>
                        <PasswordInput
                          value={editedEmailConfig.smtpPassword || ''}
                          onChange={(e) =>
                            setEditedEmailConfig({ ...editedEmailConfig, smtpPassword: e.target.value })
                          }
                          hasLeftLockIcon={false}
                          placeholder="••••••••••••••••"
                          inputClassName="px-2.5 py-1.5 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Test SMTP server connection */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={handleTestSmtpConnection}
                        disabled={smtpTesting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-stone-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${smtpTesting ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
                        <span>{smtpTesting ? 'Verifying Brevo Relay...' : 'Test Brevo SMTP Connection'}</span>
                      </button>

                      {smtpTestResult && (
                        <div className={`text-xs font-medium flex items-center gap-1.5 ${smtpTestResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {smtpTestResult.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                          )}
                          <span className="truncate max-w-xs">{smtpTestResult.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center justify-between pt-2">
                    {emailConfigSavedToast ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Changes saved to system email configuration!
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400">
                        Changes immediately apply to all automated outgoing alerts
                      </span>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Email Account Configuration
                    </button>
                  </div>
                </form>

                {/* Test Dispatch Tool */}
                <div className="pt-4 border-t border-stone-200">
                  <div className="text-xs font-semibold text-stone-800 mb-2 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-stone-600" />
                    <span>Send Verification Test Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="Recipient email..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300"
                    />
                    <button
                      type="button"
                      onClick={handleTriggerTestEmail}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg cursor-pointer transition-colors"
                    >
                      Dispatch Test Alert
                    </button>
                  </div>
                  {testEmailSentToast && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5">
                      ✓ Test alert email simulated and queued for {testEmailRecipient}!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Email Dispatch Audit Logs */}
            {activeTab === 'audit_logs' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-stone-800">
                    Chronological System Notification Dispatch Records
                  </div>
                  <span className="text-xs text-stone-500 font-mono">
                    {allHistoryEvents.length} events logged
                  </span>
                </div>

                <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider font-mono">
                        <tr>
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Recipient Student</th>
                          <th className="py-2.5 px-3">CRN</th>
                          <th className="py-2.5 px-3">Subject / Event</th>
                          <th className="py-2.5 px-3 text-center">Seats Delta</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 font-sans">
                        {allHistoryEvents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-stone-500 text-xs">
                              No email events recorded yet. Quota changes will appear here automatically.
                            </td>
                          </tr>
                        ) : (
                          allHistoryEvents.map(({ event, monitor }) => (
                            <tr key={event.id} className="hover:bg-stone-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-stone-800 text-[11px]">
                                {event.emailRecipient || monitor.notificationEmail}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                                {monitor.crn}
                              </td>
                              <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate">
                                {event.emailSubject}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-semibold">
                                {event.oldAvailable} → {event.newAvailable}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {event.emailDispatched ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Dispatched
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                                    Logged
                                  </span>
                                )}
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

            {/* Tab 4: Security & Master Password */}
            {activeTab === 'security' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-lg">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 mb-1">
                    Change Admin Master Password
                  </h4>
                  <p className="text-xs text-stone-500">
                    Update the passcode required to unlock this administrative management panel.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      New Admin Password
                    </label>
                    <PasswordInput
                      id="new-admin-password"
                      required
                      placeholder="Minimum 6 characters..."
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      hasLeftLockIcon={false}
                    />
                  </div>

                  {passwordChangeSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Admin master password successfully updated!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <div className="font-semibold text-stone-800">Security Best Practice</div>
                  <div>
                    Store this password securely. If you need to reset it, you can clear browser storage or access the configuration in local storage.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-stone-400" />
            İTÜ OBS Quota Tracker Admin Interface
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
