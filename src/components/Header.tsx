import React from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  BellOff,
  BookOpen,
  LogOut,
  Plus,
  RefreshCw,
  User
} from 'lucide-react';
import { AppLanguage, UserAccount } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  activeCount: number;
  totalCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isAutoRefreshing: boolean;
  onToggleAutoRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenItuObsModal: () => void;
  onManualRefreshAll: () => void;
  isRefreshingAll: boolean;
  isScrolled?: boolean;
  currentUser?: UserAccount | null;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCount,
  totalCount,
  soundEnabled,
  onToggleSound,
  isAutoRefreshing,
  onToggleAutoRefresh,
  onOpenAddModal,
  onOpenItuObsModal,
  onManualRefreshAll,
  isRefreshingAll,
  isScrolled = false,
  currentUser,
  onSignOut,
  onOpenProfile,
  language,
  onChangeLanguage
}) => {
  const t = TRANSLATIONS[language];

  return (
    <motion.header
      className="sticky top-0 z-30 w-full"
      initial={false}
      animate={{
        backgroundColor: isScrolled
          ? 'rgba(255, 255, 255, 0)'
          : 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: isScrolled
          ? 'rgba(231, 229, 228, 0)'
          : 'rgba(231, 229, 228, 0.85)',
        boxShadow: isScrolled
          ? '0 0 0 0 rgba(0, 0, 0, 0)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        paddingTop: isScrolled ? '12px' : '14px',
        paddingBottom: isScrolled ? '12px' : '14px',
        backdropFilter: isScrolled ? 'blur(0px)' : 'blur(10px)',
      }}
      transition={{
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1]
      }}
      style={{
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        pointerEvents: isScrolled ? 'none' : 'auto'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Profile Button, Log Out Button & Live Monitor Status */}
        <motion.div
          className="flex items-center gap-2 overflow-hidden"
          animate={{
            opacity: isScrolled ? 0 : 1,
            y: isScrolled ? -10 : 0,
            scale: isScrolled ? 0.95 : 1
          }}
          transition={{
            duration: 0.26,
            ease: [0.16, 1, 0.3, 1]
          }}
          style={{
            pointerEvents: isScrolled ? 'none' : 'auto'
          }}
        >
          {currentUser && onOpenProfile && (
            <motion.button
              id="top-left-profile-btn"
              onClick={onOpenProfile}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              title={`${t.profileTitle} (${currentUser.name || currentUser.email})`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 hover:border-stone-300 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <User className="h-3.5 w-3.5 text-stone-600" />
              <span className="max-w-[120px] truncate">{currentUser.name || t.btnProfile}</span>
              <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">{t.btnProfile}</span>
            </motion.button>
          )}

          {currentUser && onSignOut && (
            <motion.button
              id="top-left-logout-btn"
              onClick={onSignOut}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              title={`${t.btnLogout} (${currentUser.name || currentUser.email})`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-600" />
              <span>{t.btnLogout}</span>
            </motion.button>
          )}

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            {t.liveMonitor}
          </span>
          {totalCount > 0 ? (
            <span className="text-xs text-stone-500 font-medium hidden sm:inline whitespace-nowrap">
              {t.trackingCount
                .replace('{active}', activeCount.toString())
                .replace('{total}', totalCount.toString())}
            </span>
          ) : (
            <span className="text-xs text-stone-400 hidden sm:inline whitespace-nowrap">
              {t.trackingZero}
            </span>
          )}
        </motion.div>

        {/* Right Side: Language Selector in Heading, Global Controls & Floating Add CRN */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Controls that gracefully fade & slide out on scroll */}
          <motion.div
            className="flex items-center gap-2"
            animate={{
              opacity: isScrolled ? 0 : 1,
              y: isScrolled ? -10 : 0,
              scale: isScrolled ? 0.95 : 1
            }}
            transition={{
              duration: 0.26,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              pointerEvents: isScrolled ? 'none' : 'auto'
            }}
          >
            {/* Heading Language Selector - Accessible right from the heading */}
            <LanguageSelector
              language={language}
              onChangeLanguage={onChangeLanguage}
              variant="header"
            />

            {/* İTÜ OBS Course Schedule Browser Button */}
            <button
              id="itu-obs-browser-btn"
              onClick={onOpenItuObsModal}
              title={t.btnObsSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-700" />
              <span className="hidden sm:inline">{t.btnObsSchedule}</span>
              <span className="sm:hidden">OBS</span>
            </button>

            {/* Refresh all */}
            {totalCount > 0 && (
              <button
                id="refresh-all-btn"
                onClick={onManualRefreshAll}
                disabled={isRefreshingAll}
                title={t.btnCheckAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingAll ? 'animate-spin text-stone-900' : ''}`} />
                <span className="hidden md:inline">{isRefreshingAll ? '...' : t.btnCheckAll}</span>
              </button>
            )}

            {/* Auto Refresh Toggle */}
            <button
              id="auto-refresh-toggle"
              onClick={onToggleAutoRefresh}
              title={`${t.autoRefreshTooltip} ${isAutoRefreshing ? t.statusActive : t.statusOff}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isAutoRefreshing
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoRefreshing ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              <span>{isAutoRefreshing ? 'Auto 45s' : 'Auto Off'}</span>
            </button>

            {/* Sound Alert Toggle */}
            <button
              id="sound-alert-toggle"
              onClick={onToggleSound}
              title={`${t.soundTooltip} ${soundEnabled ? t.statusActive : t.statusOff}`}
              aria-label="Toggle sound alert"
              className="p-2 rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Bell className="h-4 w-4 text-stone-800" />
              ) : (
                <BellOff className="h-4 w-4 text-stone-400" />
              )}
            </button>
          </motion.div>

          {/* Add CRN Button: Seamlessly transforms between inline button and floating action pill */}
          <motion.button
            id="add-crn-btn"
            layout
            onClick={onOpenAddModal}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: isScrolled
                ? '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 8px 12px -6px rgba(0, 0, 0, 0.15)'
                : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              paddingLeft: isScrolled ? '18px' : '14px',
              paddingRight: isScrolled ? '18px' : '14px',
              paddingTop: isScrolled ? '9px' : '6px',
              paddingBottom: isScrolled ? '9px' : '6px',
            }}
            transition={{
              layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{ pointerEvents: 'auto' }}
            className="inline-flex items-center gap-1.5 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer select-none shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t.btnAddCrn}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
