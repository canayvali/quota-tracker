import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  KeyRound,
  LogOut,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { AppLanguage, UserAccount } from '../types';
import { PasswordInput } from './PasswordInput';
import { updateUserPassword, deleteUserAccount } from '../utils/storage';
import { TRANSLATIONS } from '../utils/translations';
import { LanguageSelector } from './LanguageSelector';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdateUser: (user: UserAccount) => void;
  onSignOut: () => void;
  monitorsCount: number;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSignOut,
  monitorsCount,
  language,
  onChangeLanguage
}) => {
  const t = TRANSLATIONS[language];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const curr = currentPassword.trim();
    const next = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!curr) {
      setError(language === 'tr' ? 'Lütfen mevcut şifrenizi giriniz.' : 'Please enter your current password.');
      return;
    }

    if (!next || next.length < 4) {
      setError(language === 'tr' ? 'Yeni şifre en az 4 karakter uzunluğunda olmalıdır.' : 'New password must be at least 4 characters long.');
      return;
    }

    if (next !== conf) {
      setError(language === 'tr' ? 'Yeni şifreler birbiriyle eşleşmiyor.' : 'New passwords do not match.');
      return;
    }

    if (curr === next) {
      setError(language === 'tr' ? 'Yeni şifre mevcut şifrenizle aynı olamaz.' : 'New password cannot be identical to current password.');
      return;
    }

    // Check if user has a stored password in client session
    if (currentUser.password && currentUser.password !== curr) {
      setError(language === 'tr' ? 'Mevcut şifreniz hatalı. Lütfen tekrar deneyiniz.' : 'Current password is incorrect. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword: curr,
          newPassword: next
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message) {
          setError(data.message);
          setIsLoading(false);
          return;
        }
      }

      // Update locally regardless of whether user was only in local storage
      updateUserPassword(currentUser.email, next);
      const updatedUser: UserAccount = {
        ...currentUser,
        password: next
      };
      onUpdateUser(updatedUser);

      setSuccessMsg(t.passwordUpdatedToastDesc);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // Offline fallback
      updateUserPassword(currentUser.email, next);
      const updatedUser: UserAccount = {
        ...currentUser,
        password: next
      };
      onUpdateUser(updatedUser);
      setSuccessMsg(t.passwordUpdatedToastDesc);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await fetch('/api/auth/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
    } catch {
      // ignore
    }
    deleteUserAccount(currentUser.email);
    onClose();
    onSignOut();
  };

  const getInitials = (name: string) => {
    if (!name) return 'TR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formattedJoinDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : (language === 'tr' ? 'Aktif' : 'Active');

  return (
    <div
      id="profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="profile-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="bg-stone-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-bold text-emerald-400">
              {getInitials(currentUser.name)}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{t.profileTitle}</h2>
              <p className="text-xs text-stone-400">
                {t.profileSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat / Close"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* User Information Card */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <User className="h-4 w-4 text-stone-400" />
                <span>{t.profileName}</span>
              </div>
              <span className="text-xs font-bold text-stone-900">{currentUser.name}</span>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2.5">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{t.profileEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-stone-900">{currentUser.email}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {t.profileVerifiedBadge}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2.5 text-xs">
              <span className="text-stone-500">{t.profileCoursesCount}</span>
              <span className="font-semibold text-stone-800">{monitorsCount} {t.profileCoursesSuffix}</span>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2.5 text-xs">
              <span className="text-stone-500">{t.profileRegisteredAt}</span>
              <span className="text-stone-700">{formattedJoinDate}</span>
            </div>

            {/* Language Preference Section in Profile */}
            <div className="border-t border-stone-200/60 pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <Globe className="h-3.5 w-3.5 text-stone-500" />
                <span>{t.profileLanguagePref}</span>
              </div>
              <LanguageSelector
                language={language}
                onChangeLanguage={onChangeLanguage}
                variant="profile"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 pt-2 border-t border-stone-200">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <KeyRound className="h-4 w-4 text-stone-600" />
              <h3>{t.changePasswordTitle}</h3>
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

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.currentPasswordLabel}
                </label>
                <PasswordInput
                  id="profile-current-password"
                  required
                  placeholder={t.currentPasswordPlaceholder}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.newPasswordLabel}
                </label>
                <PasswordInput
                  id="profile-new-password"
                  required
                  placeholder={t.newPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {t.confirmNewPasswordLabel}
                </label>
                <PasswordInput
                  id="profile-confirm-password"
                  required
                  placeholder={t.confirmNewPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-update-password"
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <span>{t.btnUpdatingPassword}</span>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{t.btnUpdatePassword}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Account Actions: Logout & Delete Account */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <button
              id="profile-logout-btn"
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-stone-500" />
              <span>{t.btnLogout}</span>
            </button>

            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">{t.confirmDeletePrompt}</span>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-colors"
                >
                  {t.btnConfirmDelete}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  {t.btnCancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              >
                {t.deleteAccountLink}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
