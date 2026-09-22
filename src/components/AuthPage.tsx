import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  Mail,
  RefreshCw,
  User,
  UserPlus
} from 'lucide-react';
import { AppLanguage, UserAccount } from '../types';
import { loadEmailConfig, loadUsers, saveUsers } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { PasswordInput } from './PasswordInput';
import { LanguageSelector } from './LanguageSelector';
import { VerificationModal } from './VerificationModal';

interface AuthPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  defaultLanguage?: AppLanguage;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  defaultLanguage = 'tr'
}) => {
  // Always default to Turkish on login screen as specified
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage || 'tr');
  const t = TRANSLATIONS[language];

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields - clean, no pre-filled personal data
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

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

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t.authBadge}</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          {t.authTitle}
        </h1>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          {t.authSubtitle}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200/90 rounded-2xl sm:px-8 space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
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
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
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
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.tabSignUp}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.passwordLabel}
                </label>
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
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>{isLoading ? t.btnSigningIn : t.btnSignIn}</span>
              </button>

              <div className="text-center pt-2 text-[11px] text-stone-500">
                {t.noAccountPrompt}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="font-bold text-stone-900 hover:underline cursor-pointer"
                >
                  {t.signUpNow}
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up: Account Information */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.nameLabel}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.signupEmailLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder={t.emailPlaceholder}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  {t.signupEmailHint}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.passwordLabel} <span className="text-stone-400 font-normal">({language === 'tr' ? 'En az 8 hane' : 'At least 8 chars'})</span>
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
                <label className="block text-xs font-semibold text-stone-800 mb-1">
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
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-2"
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
    </div>
  );
};
