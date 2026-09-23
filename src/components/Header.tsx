import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronDown,
  Check,
  Globe,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  User
} from 'lucide-react';
import { AppLanguage, AppTheme, UserAccount } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  currentUser?: UserAccount | null;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenAddModal: () => void;
  onOpenItuObsModal: () => void;
  isScrolled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSignOut,
  onOpenProfile,
  language,
  onChangeLanguage,
  theme,
  onChangeTheme,
  onOpenAddModal,
  onOpenItuObsModal,
  isScrolled = false
}) => {
  const t = TRANSLATIONS[language];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const isDark = theme === 'dark';

  return (
    <motion.header
      className="sticky top-0 z-40 w-full transition-colors duration-200"
      initial={false}
      animate={{
        backgroundColor: isScrolled
          ? 'rgba(0, 0, 0, 0)'
          : isDark
            ? 'rgba(18, 18, 20, 0.92)'
            : 'rgba(250, 249, 245, 0.94)',
        borderBottomColor: isScrolled
          ? 'rgba(0, 0, 0, 0)'
          : isDark
            ? 'rgba(39, 39, 42, 0.9)'
            : 'rgba(231, 229, 228, 0.9)',
        boxShadow: isScrolled
          ? '0 0 0 0 rgba(0, 0, 0, 0)'
          : isDark
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.35)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        paddingTop: isScrolled ? '12px' : '14px',
        paddingBottom: isScrolled ? '12px' : '14px',
        backdropFilter: isScrolled ? 'blur(0px)' : 'blur(12px)'
      }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1]
      }}
      style={{
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        pointerEvents: isScrolled ? 'none' : 'auto'
      }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* LEFT SIDE: Profile Button & Dropdown Menu */}
        <div className="relative" ref={dropdownRef} style={{ pointerEvents: 'auto' }}>
          <motion.button
            id="top-profile-dropdown-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer select-none border ${
              isDropdownOpen
                ? isDark
                  ? 'bg-stone-800 text-white border-stone-600 ring-2 ring-stone-600/30'
                  : 'bg-white text-stone-900 border-stone-300 ring-2 ring-stone-900/10'
                : isDark
                  ? 'bg-stone-900 text-stone-200 border-stone-800 hover:bg-stone-800 hover:border-stone-700'
                  : 'bg-white text-stone-800 border-stone-200/90 hover:bg-stone-100 hover:border-stone-300'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 font-bold text-[11px] shrink-0 border border-stone-200/60 dark:border-stone-700/60">
              {currentUser?.name ? (
                currentUser.name.charAt(0).toUpperCase()
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="max-w-[130px] sm:max-w-[170px] truncate leading-tight">
                {currentUser?.name || t.btnProfile}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-stone-700 dark:text-stone-200' : ''
              }`}
            />
          </motion.button>

          {/* DROPDOWN MENU */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                id="profile-dropdown-menu"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute left-0 mt-2 w-72 rounded-2xl shadow-xl border p-2 z-50 overflow-hidden ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-100 shadow-black/40'
                    : 'bg-white border-stone-200/90 text-stone-900 shadow-stone-900/10'
                }`}
              >
                {/* User Info Header */}
                <div className={`p-3 rounded-xl mb-1 ${isDark ? 'bg-stone-800/60' : 'bg-stone-50'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-800 dark:text-stone-100 font-bold text-sm shrink-0">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-snug">
                        {currentUser?.name || t.btnProfile}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>

                  {onOpenProfile && (
                    <button
                      id="dropdown-open-profile-btn"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                        isDark
                          ? 'bg-stone-700/60 hover:bg-stone-700 text-stone-200 border-stone-600/60'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200 shadow-2xs'
                      }`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{t.accountSettings}</span>
                    </button>
                  )}
                </div>

                {/* Section: Görünüm Tercihi (Appearance: Light vs Dark) */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 px-1">
                    <span>{t.appearancePreference}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                    <button
                      id="theme-toggle-light"
                      type="button"
                      onClick={() => onChangeTheme('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !isDark
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      <span>{t.lightMode}</span>
                      {!isDark && <Check className="h-3 w-3 ml-0.5" />}
                    </button>
                    <button
                      id="theme-toggle-dark"
                      type="button"
                      onClick={() => onChangeTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-stone-700 text-stone-100 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{t.darkMode}</span>
                      {isDark && <Check className="h-3 w-3 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Section: Dil Seçimi (Language) */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 px-1">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>Dil / Language</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                    <button
                      id="dropdown-lang-tr"
                      type="button"
                      onClick={() => onChangeLanguage('tr')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        language === 'tr'
                          ? isDark
                            ? 'bg-stone-700 text-stone-100 shadow-xs'
                            : 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>TR Türkçe</span>
                      {language === 'tr' && <Check className="h-3 w-3 ml-0.5" />}
                    </button>
                    <button
                      id="dropdown-lang-en"
                      type="button"
                      onClick={() => onChangeLanguage('en')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        language === 'en'
                          ? isDark
                            ? 'bg-stone-700 text-stone-100 shadow-xs'
                            : 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <span>EN English</span>
                      {language === 'en' && <Check className="h-3 w-3 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1 border-t border-stone-200/80 dark:border-stone-800" />

                {/* Sign Out Button */}
                {currentUser && onSignOut && (
                  <button
                    id="dropdown-logout-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t.btnLogout}</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CENTER: itüdis logo mark */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none flex items-center justify-center"
          initial={false}
          animate={{
            opacity: isScrolled ? 0 : 1,
            y: isScrolled ? -10 : 0,
            scale: isScrolled ? 0.92 : 1,
            pointerEvents: isScrolled ? 'none' : 'auto'
          }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-105 cursor-default">
            <span className={`text-xs sm:text-sm font-extrabold tracking-tight lowercase font-sans ${
              isDark ? 'text-stone-100' : 'text-stone-900'
            }`}>
              itü<span className="text-emerald-600 dark:text-emerald-400 font-black">dis</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-500/20 animate-pulse" />
          </div>
        </motion.div>

        {/* RIGHT SIDE: İTÜ OBS Tarayıcı & CRN Ekle only */}
        <div className="flex items-center gap-2 ml-auto" style={{ pointerEvents: 'auto' }}>
          {/* İTÜ OBS Course Schedule Browser Button - Hidden on mobile (< sm), shown on tablet/desktop */}
          <button
            id="itu-obs-browser-btn"
            onClick={onOpenItuObsModal}
            title={t.btnObsSchedule}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer border ${
              isDark
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/70 hover:bg-amber-900/50'
                : 'bg-amber-50 text-amber-900 border-amber-300/80 hover:bg-amber-100'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.btnObsSchedule}</span>
          </button>

          {/* Add CRN Button: Prominently shown on both mobile and desktop */}
          <motion.button
            id="add-crn-btn"
            layout
            onClick={onOpenAddModal}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: isScrolled
                ? isDark
                  ? '0 12px 28px -4px rgba(0, 0, 0, 0.6), 0 8px 12px -6px rgba(0, 0, 0, 0.4)'
                  : '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 8px 12px -6px rgba(0, 0, 0, 0.15)'
                : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              paddingLeft: isScrolled ? '18px' : '14px',
              paddingRight: isScrolled ? '18px' : '14px',
              paddingTop: isScrolled ? '9px' : '6px',
              paddingBottom: isScrolled ? '9px' : '6px'
            }}
            transition={{
              layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1]
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer select-none shrink-0 ${
              isDark
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t.btnAddCrn}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
