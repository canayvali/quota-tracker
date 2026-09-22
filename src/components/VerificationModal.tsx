import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  X
} from 'lucide-react';
import { AppLanguage, UserAccount } from '../types';
import { loadEmailConfig, loadUsers, saveUsers } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  name: string;
  password: string;
  language: AppLanguage;
  onVerificationSuccess: (user: UserAccount) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  name,
  password,
  language,
  onVerificationSuccess
}) => {
  const t = TRANSLATIONS[language];

  // 6 separate digits for the responsive segmented OTP input
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Auto focus first input on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setSuccessMsg(null);
      setResendCooldown(60);
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle countdown timer
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');

    // If multiple digits pasted into a single box
    if (cleanVal.length > 1) {
      handlePasteString(cleanVal);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1);
    setDigits(newDigits);
    setError(null);

    // Auto advance focus to next box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    handlePasteString(pasteData);
  };

  const handlePasteString = (pasteData: string) => {
    const cleanDigits = pasteData.replace(/\D/g, '').slice(0, 6).split('');
    if (cleanDigits.length === 0) return;

    const newDigits = ['', '', '', '', '', ''];
    cleanDigits.forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    setDigits(newDigits);
    setError(null);

    const nextIndex = Math.min(cleanDigits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Submit code to complete sign up
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const code = digits.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError(
        language === 'tr'
          ? 'Lütfen e-postanıza gönderilen 6 haneli doğrulama kodunu eksiksiz giriniz.'
          : 'Please enter the complete 6-digit verification code sent to your email.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Send verification to backend
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          code
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        throw new Error(
          data.message ||
            (language === 'tr'
              ? 'Doğrulama kodu geçersiz veya süresi dolmuş.'
              : 'Invalid or expired verification code.')
        );
      }

      // 2. Save user locally with preferred language
      const verifiedUser: UserAccount = {
        ...data.user,
        preferredLanguage: language || 'tr'
      };

      const users = loadUsers();
      const filtered = users.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
      saveUsers([...filtered, { ...verifiedUser, password: password.trim() }]);

      onVerificationSuccess(verifiedUser);
    } catch (err: any) {
      setError(
        err.message ||
          (language === 'tr'
            ? 'Doğrulama başarısız oldu. Lütfen tekrar deneyiniz.'
            : 'Verification failed. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const currentSmtpConfig = loadEmailConfig();
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          language,
          smtpConfig: currentSmtpConfig
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (language === 'tr'
              ? `${email} adresine doğrulama kodu gönderilemedi.`
              : `Could not send verification code to ${email}.`)
        );
      }

      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSuccessMsg(
        language === 'tr'
          ? `${email} adresine yeni 6 haneli doğrulama kodu iletildi!`
          : `A new 6-digit verification code has been dispatched to ${email}!`
      );
    } catch (err: any) {
      setError(
        err.message ||
          (language === 'tr'
            ? `${email} adresine kod tekrar gönderilemedi. Lütfen bağlantınızı kontrol ediniz.`
            : `Could not resend code to ${email}. Please check your connection.`)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isCodeComplete = digits.join('').length === 6;

  return (
    <div
      id="verification-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="verification-modal-card"
        className="relative w-full max-w-sm sm:max-w-md bg-[#FAF9F5] dark:bg-[#1A1A1E] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden text-stone-900 dark:text-stone-100 flex flex-col my-auto transition-colors"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#1E1E24]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {t.verifyCodeTitle}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t.verificationModalSubtitle}
              </p>
            </div>
          </div>
          <button
            id="close-verification-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={language === 'tr' ? 'Kapat ve Bilgileri Düzenle' : 'Close and Edit Info'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Recipient Notification Box - Email placed strictly at the beginning */}
          <div className="p-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700 shadow-2xs flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
              <strong className="font-bold text-stone-900 dark:text-stone-100 break-all">{email}</strong>{' '}
              <span>{t.verifyCodeSentTo}</span>
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 6 Responsive Segmented OTP Inputs - Fluidly fitting all screen widths */}
          <div className="py-1">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2.5 text-center">
              {t.verifyCodeLabel}
            </label>
            <div
              className="flex justify-between items-center gap-1.5 sm:gap-2.5 w-full"
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="flex-1 min-w-0 max-w-[46px] h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-stone-900 dark:focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 transition-all shadow-2xs"
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="submit-verification-code-btn"
            type="submit"
            disabled={!isCodeComplete || isLoading}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isCodeComplete && !isLoading
                ? 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 active:scale-[0.98]'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
                <span>{t.btnVerifying}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t.btnVerifyAndRegister}</span>
              </>
            )}
          </button>

          {/* Resend and Edit Actions */}
          <div className="flex items-center justify-between pt-2 text-xs border-t border-stone-200/80 dark:border-stone-800">
            <button
              id="verification-change-details-btn"
              type="button"
              onClick={onClose}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5 py-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.btnChangeDetails}</span>
            </button>

            <button
              id="verification-resend-btn"
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className={`flex items-center gap-1.5 py-1 font-bold transition-colors cursor-pointer ${
                resendCooldown > 0 || isLoading
                  ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                  : 'text-stone-900 dark:text-stone-100 hover:underline'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? (
                <span>
                  {t.btnResendCode} ({resendCooldown}s)
                </span>
              ) : (
                <span>{t.btnResendCode}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
