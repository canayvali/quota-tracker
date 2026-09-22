import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Key,
  KeyRound,
  LogIn,
  Mail,
  Moon,
  RefreshCw,
  Send,
  Sun,
  User,
  UserPlus
} from 'lucide-react';
import { AppLanguage, AppTheme, UserAccount } from '../types';
import { loadEmailConfig, loadTheme, loadUsers, saveTheme, saveUsers, updateUserPassword } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { PasswordInput } from './PasswordInput';
import { LanguageSelector } from './LanguageSelector';
import { VerificationModal } from './VerificationModal';
import { EmailSentPreviewModal } from './EmailSentPreviewModal';

interface AuthPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  defaultLanguage?: AppLanguage;
  currentTheme?: AppTheme;
  onToggleTheme?: (theme: AppTheme) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  defaultLanguage = 'tr',
  currentTheme,
  onToggleTheme
}) => {
  // Always default to Turkish on login screen as specified
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage || 'tr');
  const t = TRANSLATIONS[language];

  // Theme state: light or dark
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (currentTheme) return currentTheme;
    return loadTheme();
  });

  // Sync if currentTheme prop changes
  useEffect(() => {
    if (currentTheme && currentTheme !== theme) {
      setTheme(currentTheme);
    }
  }, [currentTheme]);

  // Ensure DOM class matches current theme
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

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    if (onToggleTheme) {
      onToggleTheme(nextTheme);
    }
  };

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Sign In fields - clean, no pre-filled personal data
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Forgot Password fields
  const [forgotStep, setForgotStep] = useState<'send_code' | 'verify_and_reset'>('send_code');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotEmailPreviewData, setForgotEmailPreviewData] = useState<{
    recipient: string;
    subject: string;
    body: string;
    timestamp?: string;
  } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Dedicated verification modal pop-up state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!email || !password) {
      setError(
        language === 'tr'
          ? 'Lütfen e-posta adresinizi ve şifrenizi giriniz.'
          : 'Please enter both your email address and password.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // First try server-side login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        // Sync preferred language
        const userLang = data.user.preferredLanguage || language;
        const loggedUser: UserAccount = {
          ...data.user,
          preferredLanguage: userLang
        };

        const users = loadUsers();
        const existing = users.find((u) => u.email.toLowerCase() === email);
        if (!existing) {
          saveUsers([...users, { ...loggedUser, password }]);
        }
        onLoginSuccess(loggedUser);
        return;
      }
    } catch {
      // Offline fallback
    }

    // Fallback to local storage
    const users = loadUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email);

    if (!existing) {
      setError(
        language === 'tr'
          ? 'Bu e-posta adresiyle kayıtlı hesap bulunamadı. Lütfen bilgilerinizi kontrol ediniz veya yeni hesap oluşturunuz.'
          : 'No account found with this email. Please check your credentials or create a new account.'
      );
      setIsLoading(false);
      return;
    }

    if (existing.password && existing.password !== password) {
      setError(
        language === 'tr'
          ? 'Hatalı şifre. Lütfen tekrar deneyiniz.'
          : 'Incorrect password. Please try again.'
      );
      setIsLoading(false);
      return;
    }

    const userLang = existing.preferredLanguage || language;
    const updatedUser: UserAccount = {
      ...existing,
      preferredLanguage: userLang,
      lastLoginAt: new Date().toISOString()
    };
    saveUsers(users.map((u) => (u.id === existing.id ? updatedUser : u)));
    onLoginSuccess(updatedUser);
    setIsLoading(false);
  };

  // Validate form & send 6-digit verification code, then open dedicated pop-up modal
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword.trim();
    const confirm = signupConfirmPassword.trim();

    if (!name) {
      setError(language === 'tr' ? 'Lütfen adınızı ve soyadınızı giriniz.' : 'Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError(
        language === 'tr'
          ? 'Lütfen geçerli bir e-posta adresi giriniz.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (!password || password.length < 8) {
      setError(
        language === 'tr'
          ? 'Şifreniz en az 8 karakter uzunluğunda olmalıdır.'
          : 'Password must be at least 8 characters long.'
      );
      return;
    }

    if (password !== confirm) {
      setError(
        language === 'tr'
          ? 'Girdiğiniz şifreler birbiriyle eşleşmiyor.'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setError(
        language === 'tr'
          ? 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapınız.'
          : 'An account with this email already exists. Please sign in.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const currentSmtpConfig = loadEmailConfig();
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          language,
          smtpConfig: currentSmtpConfig
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            (language === 'tr' ? 'Doğrulama kodu gönderilemedi.' : 'Failed to send verification code.')
        );
      }

      // Open the dedicated pop-up modal page as requested
      setIsVerificationModalOpen(true);
    } catch (err: any) {
      setError(
        err.message ||
          (language === 'tr'
            ? 'Doğrulama e-postası gönderilemedi. Lütfen internet bağlantınızı kontrol ediniz.'
            : 'Could not send verification email. Please check your connection.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError(
        language === 'tr'
          ? 'Lütfen geçerli bir e-posta adresi giriniz.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const emailConfig = loadEmailConfig();
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, smtpConfig: emailConfig })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStep('verify_and_reset');
        setSuccessMsg(
          language === 'tr'
            ? `${email} adresinize 6 haneli şifre sıfırlama kodu gönderildi.`
            : `A 6-digit password reset code has been sent to ${email}.`
        );
        if (data.emailPreview) {
          setForgotEmailPreviewData({
            recipient: email,
            subject: 'İTÜ OBS Quota Alert - Şifre Sıfırlama Doğrulama Kodu',
            body: data.emailPreview,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        const users = loadUsers();
        const userExists = users.some((u) => u.email.toLowerCase() === email);

        if (!userExists && res.status === 404) {
          setError(
            language === 'tr'
              ? 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.'
              : 'No registered account found with this email address.'
          );
        } else {
          // Fallback code generation
          const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
          sessionStorage.setItem('itu_fallback_reset_' + email, fallbackCode);
          setForgotStep('verify_and_reset');
          setSuccessMsg(
            language === 'tr'
              ? `${email} adresine sıfırlama kodu oluşturuldu (Kod: ${fallbackCode})`
              : `Password reset code generated for ${email} (Code: ${fallbackCode})`
          );
          setForgotEmailPreviewData({
            recipient: email,
            subject: 'İTÜ OBS Quota Alert - Şifre Sıfırlama Doğrulama Kodu',
            body: `Sayın Öğrencimiz,\n\nHesabınız için şifre sıfırlama talebinde bulunulmuştur.\n\n6 Haneli Doğrulama Kodunuz: ${fallbackCode}\n\nBu kodu ilgili alana girerek yeni şifrenizi belirleyebilirsiniz.`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch {
      // Offline fallback
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('itu_fallback_reset_' + email, fallbackCode);
      setForgotStep('verify_and_reset');
      setSuccessMsg(
        language === 'tr'
          ? `${email} adresine sıfırlama kodu oluşturuldu (Kod: ${fallbackCode})`
          : `Password reset code generated for ${email} (Code: ${fallbackCode})`
      );
      setForgotEmailPreviewData({
        recipient: email,
        subject: 'İTÜ OBS Quota Alert - Şifre Sıfırlama Doğrulama Kodu',
        body: `Sayın Öğrencimiz,\n\nHesabınız için şifre sıfırlama talebinde bulunulmuştur.\n\n6 Haneli Doğrulama Kodunuz: ${fallbackCode}\n\nBu kodu ilgili alana girerek yeni şifrenizi belirleyebilirsiniz.`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = forgotEmail.trim().toLowerCase();
    const code = forgotCode.trim();
    const newPass = forgotNewPassword.trim();
    const confirmPass = forgotConfirmPassword.trim();

    if (!code || code.length !== 6) {
      setError(
        language === 'tr'
          ? 'Lütfen 6 haneli doğrulama kodunu eksiksiz giriniz.'
          : 'Please enter the 6-digit code.'
      );
      return;
    }

    if (!newPass || newPass.length < 6) {
      setError(
        language === 'tr'
          ? 'Yeni şifreniz en az 6 karakter olmalıdır.'
          : 'New password must be at least 6 characters.'
      );
      return;
    }

    if (newPass !== confirmPass) {
      setError(
        language === 'tr'
          ? 'Girdiğiniz şifreler birbiriyle eşleşmiyor.'
          : 'Passwords do not match.'
      );
      return;
    }

    setIsLoading(true);
    try {
      let success = false;
      try {
        const res = await fetch('/api/auth/forgot-password/verify-and-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword: newPass })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          success = true;
        }
      } catch {
        // offline fallback
      }

      if (!success) {
        const fallbackCode = sessionStorage.getItem('itu_fallback_reset_' + email);
        if (fallbackCode && fallbackCode === code) {
          success = true;
        }
      }

      if (success) {
        updateUserPassword(email, newPass);
        setLoginEmail(email);
        setLoginPassword(newPass);
        setMode('signin');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setSuccessMsg(
          language === 'tr'
            ? 'Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.'
            : 'Your password has been successfully reset! You can now sign in.'
        );
      } else {
        setError(
          language === 'tr'
            ? 'Girdiğiniz sıfırlama kodu hatalı veya süresi dolmuş.'
            : 'Invalid or expired reset code.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'İşlem gerçekleştirilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121214] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Top-Left Animated Circular Theme Toggle Button */}
      <div className="absolute top-5 left-5 z-20">
        <motion.button
          id="login-theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 6 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 shadow-sm hover:shadow-md text-stone-700 dark:text-stone-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
          title={
            theme === 'dark'
              ? (language === 'tr' ? 'Aydınlık moda geç' : 'Switch to Light Mode')
              : (language === 'tr' ? 'Koyu moda geç' : 'Switch to Dark Mode')
          }
          aria-label={
            theme === 'dark'
              ? (language === 'tr' ? 'Aydınlık moda geç' : 'Switch to Light Mode')
              : (language === 'tr' ? 'Koyu moda geç' : 'Switch to Dark Mode')
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-cyan-300 fill-cyan-300/20" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {t.authTitle}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          {t.authSubtitle}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1A1A1E] py-8 px-6 shadow-sm border border-stone-200/90 dark:border-stone-800 rounded-2xl sm:px-8 space-y-5 transition-colors">
          {/* Tab Switcher */}
          {mode === 'forgot_password' ? (
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'tr' ? 'Giriş Ekranına Dön' : 'Back to Sign In'}</span>
              </button>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {language === 'tr' ? 'Şifre Sıfırlama' : 'Password Reset'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
              <button
                id="tab-signin"
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {t.tabSignIn}
              </button>
              <button
                id="tab-signup"
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {t.tabSignUp}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-stone-500" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {t.passwordLabel}
                  </label>
                  <button
                    id="btn-forgot-password"
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setSuccessMsg(null);
                      setForgotEmail(loginEmail || '');
                      setForgotStep('send_code');
                    }}
                    className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:underline cursor-pointer"
                  >
                    {language === 'tr' ? 'Şifremi unuttum?' : 'Forgot password?'}
                  </button>
                </div>
                <PasswordInput
                  id="signin-password"
                  required
                  placeholder={t.passwordPlaceholder}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{isLoading ? t.btnSigningIn : t.btnSignIn}</span>
              </button>

              <div className="text-center pt-2 text-[11px] text-stone-500 dark:text-stone-400">
                {t.noAccountPrompt}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                >
                  {t.signUpNow}
                </button>
              </div>
            </form>
          ) : mode === 'forgot_password' ? (
            /* Forgot Password Form */
            <div className="space-y-4">
              {forgotStep === 'send_code' ? (
                <form onSubmit={handleSendForgotCode} className="space-y-4">
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/70 rounded-xl border border-stone-200 dark:border-stone-750 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-stone-200">
                      {language === 'tr' ? 'Şifrenizi mi unuttunuz?' : 'Forgot your password?'}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {language === 'tr'
                        ? 'Hesabınıza kayıtlı e-posta adresinizi yazınız. Size 6 haneli bir şifre sıfırlama doğrulama kodu göndereceğiz.'
                        : 'Enter your registered email address. We will send you a 6-digit password reset code.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-stone-500" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder={t.emailPlaceholder}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-send-reset-code"
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{language === 'tr' ? 'Kod Gönderiliyor...' : 'Sending Code...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-amber-400" />
                        <span>{language === 'tr' ? 'Sıfırlama Kodu Gönder' : 'Send Reset Code'}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                    >
                      {language === 'tr' ? '← Giriş Ekranına Dön' : '← Back to Sign In'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Verify Code and Set New Password */
                <form onSubmit={handleVerifyAndResetPassword} className="space-y-3.5">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>{language === 'tr' ? '6 Haneli Sıfırlama Kodu' : '6-Digit Reset Code'}</span>
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-mono">
                      {forgotEmail}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      {language === 'tr' ? 'Doğrulama Kodu' : 'Verification Code'}
                    </label>
                    <input
                      id="forgot-code"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:border-stone-900 dark:focus:border-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      {language === 'tr' ? 'Yeni Şifre' : 'New Password'}
                    </label>
                    <PasswordInput
                      id="forgot-new-password"
                      required
                      placeholder={language === 'tr' ? 'En az 6 karakter...' : 'At least 6 characters...'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      {language === 'tr' ? 'Yeni Şifre (Tekrar)' : 'Confirm New Password'}
                    </label>
                    <PasswordInput
                      id="forgot-confirm-password"
                      required
                      placeholder={language === 'tr' ? 'Yeni şifreyi tekrar yazınız...' : 'Re-type new password...'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    id="btn-confirm-reset-password"
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{language === 'tr' ? 'Şifre Güncelleniyor...' : 'Resetting Password...'}</span>
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 text-emerald-400" />
                        <span>{language === 'tr' ? 'Şifreyi Sıfırla ve Giriş Yap' : 'Reset Password & Sign In'}</span>
                      </>
                    )}
                  </button>

                  {/* Button to preview the sent password reset email */}
                  {forgotEmailPreviewData && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {language === 'tr' ? '📨 Gönderilen Sıfırlama E-postasını Önizle' : '📨 Preview Sent Reset Email'}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('send_code');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-stone-600 dark:text-stone-400 hover:underline cursor-pointer"
                    >
                      {language === 'tr' ? '← Farklı e-posta kullan' : '← Use different email'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendForgotCode}
                      className="text-stone-900 dark:text-stone-100 font-bold hover:underline cursor-pointer"
                    >
                      {language === 'tr' ? 'Kodu Tekrar Gönder' : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Sign Up: Account Information */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t.nameLabel}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-stone-500" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t.signupEmailLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-stone-500" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-100/10 focus:border-stone-900 dark:focus:border-stone-400 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
                  {t.signupEmailHint}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t.passwordLabel} <span className="text-stone-400 dark:text-stone-500 font-normal">({language === 'tr' ? 'En az 8 hane' : 'At least 8 chars'})</span>
                </label>
                <PasswordInput
                  id="signup-password"
                  required
                  placeholder={language === 'tr' ? 'En az 8 karakter' : 'At least 8 characters'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  {t.confirmPasswordLabel}
                </label>
                <PasswordInput
                  id="signup-confirm"
                  required
                  placeholder={t.confirmPasswordPlaceholder}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-create-account"
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.btnCreatingAccount}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-cyan-400" />
                    <span>{t.btnCreateAccount}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-[11px] text-stone-500 dark:text-stone-400">
                {language === 'tr' ? 'Zaten bir hesabınız var mı?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="font-bold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer"
                >
                  {t.tabSignIn}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mid Bottom Language Selector as requested by user */}
        <div id="login-mid-bottom-language-selector" className="mt-5 flex justify-center">
          <LanguageSelector
            language={language}
            onChangeLanguage={setLanguage}
            variant="login"
          />
        </div>
      </div>

      {/* Dedicated Verification Code Pop-up Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        email={signupEmail}
        name={signupName}
        password={signupPassword}
        language={language}
        onVerificationSuccess={(user) => {
          setIsVerificationModalOpen(false);
          onLoginSuccess(user);
        }}
      />

      {/* Dedicated Reset Email Preview Modal */}
      {forgotEmailPreviewData && (
        <EmailSentPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          emailData={forgotEmailPreviewData}
          senderConfig={loadEmailConfig()}
        />
      )}
    </div>
  );
};
