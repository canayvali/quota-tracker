import React, { useState } from 'react';
import { Check, Copy, Info, Key, Mail, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { EmailSenderConfig } from '../types';
import { PasswordInput } from './PasswordInput';

interface EmailSenderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmailSenderConfig;
  onSaveConfig: (newConfig: EmailSenderConfig) => void;
  onSendTestEmail: (recipientEmail: string) => void;
  testRecipientEmail: string;
}

export const EmailSenderConfigModal: React.FC<EmailSenderConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSendTestEmail,
  testRecipientEmail
}) => {
  const [senderAddress, setSenderAddress] = useState(config.senderAddress);
  const [senderName, setSenderName] = useState(config.senderName);
  const [provider, setProvider] = useState(config.provider);
  const [smtpHost, setSmtpHost] = useState(config.smtpHost);
  const [smtpPort, setSmtpPort] = useState(config.smtpPort.toString());
  const [smtpUsername, setSmtpUsername] = useState(config.smtpUsername);
  const [smtpPassword, setSmtpPassword] = useState(config.smtpPassword || '');
  const [testEmailTarget, setTestEmailTarget] = useState(testRecipientEmail);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/email/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: {
            smtpHost,
            smtpPort: parseInt(smtpPort, 10) || 587,
            smtpUsername,
            smtpPassword
          }
        })
      });
      const data = await res.json();
      setConnectionStatus(data);
    } catch {
      setConnectionStatus({ success: false, message: 'Server communication failed.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmailSenderConfig = {
      senderAddress: senderAddress.trim(),
      senderName: senderName.trim(),
      provider,
      smtpHost: smtpHost.trim(),
      smtpPort: parseInt(smtpPort, 10) || 587,
      smtpUsername: smtpUsername.trim(),
      smtpPassword: smtpPassword.trim(),
      isReady: true,
      notes: 'Sender email configuration saved.'
    };
    onSaveConfig(updated);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2500);
  };

  const handleTestSend = () => {
    if (testEmailTarget.trim()) {
      onSendTestEmail(testEmailTarget.trim());
    }
  };

  return (
    <div
      id="email-sender-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="email-sender-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Mail className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                System Outgoing Email Account Setup
              </h2>
              <p className="text-xs text-stone-500">
                Configure the sender mailbox that will automatically email students when CRN quotas change
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice for Future Email Account */}
        <div className="p-4 mx-6 mt-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Future Email Account Integration: </span>
            You noted you will be opening a dedicated email account soon. In this panel, you can preconfigure its address, SMTP server (or Gmail / Resend / Mailgun credentials), and review the automated alert template. In-app test dispatches and delivery simulations are active right now!
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Email Dispatch Service Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'custom_smtp', label: 'Custom SMTP', desc: 'Any Mail Server' },
                { id: 'gmail', label: 'Gmail / Workspace', desc: 'App Passwords' },
                { id: 'resend', label: 'Resend API', desc: 'Modern & Fast' },
                { id: 'sendgrid', label: 'SendGrid', desc: 'Enterprise Mail' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as EmailSenderConfig['provider'])}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    provider === p.id
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className={`text-[10px] ${provider === p.id ? 'text-stone-300' : 'text-stone-400'}`}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sender Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-sender-address" className="block text-xs font-semibold text-stone-700 mb-1">
                Sender Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="input-sender-address"
                type="email"
                placeholder="crn-alerts@university-bot.org"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Students will see emails sent from this address</span>
            </div>

            <div>
              <label htmlFor="input-sender-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Sender Display Name
              </label>
              <input
                id="input-sender-name"
                type="text"
                placeholder="Class Quota Alert System"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Display name in student inboxes</span>
            </div>
          </div>

          {/* Connection Parameters */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-stone-500" />
                Connection Credentials
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                TLS Secure Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-stone-600 mb-1">SMTP Host / Server</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com or mail.domain.com"
                  className="w-full px-2.5 py-1.5 rounded-md border border-stone-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full px-2.5 py-1.5 rounded-md border border-stone-300 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">Username / Account</label>
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="bot-account@domain.com"
                  className="w-full px-2.5 py-1.5 rounded-md border border-stone-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">Password / App Key</label>
                <PasswordInput
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  hasLeftLockIcon={false}
                  inputClassName="px-2.5 py-1.5 rounded-md"
                />
              </div>
            </div>

            {/* Test SMTP server connection */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-stone-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${testingConnection ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
                <span>{testingConnection ? 'Testing Brevo Relay...' : 'Test Brevo Connection'}</span>
              </button>

              {connectionStatus && (
                <div className={`text-xs font-medium flex items-center gap-1.5 ${connectionStatus.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {connectionStatus.success ? (
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <Info className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                  )}
                  <span className="truncate max-w-xs">{connectionStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Test Dispatcher Section */}
          <div className="p-4 bg-stone-100/70 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-stone-600" />
                Test Email Alert Dispatch
              </span>
              <span className="text-[11px] text-stone-500">Simulates student alert delivery</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter recipient email (e.g. your email)"
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-800"
              />
              <button
                type="button"
                onClick={handleTestSend}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>Send Test Alert</span>
              </button>
            </div>
          </div>

          {/* Email Template Preview Drawer */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="bg-stone-50 px-3 py-2 border-b border-stone-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Preview: Email Template (TR + EN)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Kontenjan açıldı - Biri dersi bıraktı: CRN 10492 (BLG 212E)`);
                  setCopiedTemplate(true);
                  setTimeout(() => setCopiedTemplate(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                {copiedTemplate ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedTemplate ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-white font-mono text-[11px] text-stone-700 leading-relaxed max-h-44 overflow-y-auto">
              <div className="text-stone-400 mb-1">From: {senderName} &lt;{senderAddress}&gt;</div>
              <div className="text-stone-800 font-semibold mb-2">Subject: Kontenjan açıldı - Biri dersi bıraktı: CRN 10492 (BLG 212E)</div>
              <div className="p-2 bg-emerald-50/70 rounded-md border border-emerald-200/80 text-emerald-950 mb-2 whitespace-pre-line">
                🔔 KONTENJAN AÇILDI - BİRİ DERSİ BIRAKTI{'\n'}
                Merhaba, takip ettiğiniz derste bir öğrencinin dersi bırakması sonucu boş kontenjan açılmıştır:{'\n'}
                • CRN: 10492 • BLG 212E - Microprocessor Systems{'\n'}
                • Boş Kontenjan: 0 → 1 (+1 boş yer açıldı){'\n'}
                ⚡ ÖNEMLİ: Kontenjan dolmadan hemen İTÜ OBS'ye giriş yapınız!{'\n\n'}
                --- ENGLISH VERSION ---{'\n'}
                🔔 SEAT OPENED - SOMEONE DROPPED THE CLASS{'\n'}
                A student has dropped your tracked class and an open seat is now available. Log into OBS immediately!
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {showSavedFeedback ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="h-4 w-4" /> Sender settings saved!
              </span>
            ) : (
              <span className="text-[11px] text-stone-400">Settings persist in your browser</span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Save Sender Config
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
