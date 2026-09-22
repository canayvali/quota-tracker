import React from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  User
} from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  activeCount: number;
  totalCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isAutoRefreshing: boolean;
  onToggleAutoRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenItuObsModal: () => void;
  onOpenAdminPortalModal: () => void;
  isAdminAuthenticated: boolean;
  onManualRefreshAll: () => void;
  isRefreshingAll: boolean;
  isScrolled?: boolean;
  currentUser?: UserAccount | null;
  onSignOut?: () => void;
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
  onOpenAdminPortalModal,
  isAdminAuthenticated,
  onManualRefreshAll,
  isRefreshingAll,
  isScrolled = false,
  currentUser,
  onSignOut
}) => {
  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-200 border-b ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-stone-200/90 py-2 shadow-sm'
          : 'bg-white border-stone-200/80 py-3 shadow-2xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* If Scrolled Down: Heading/Status is gone! Only Add CRN button remains! */}
        {!isScrolled ? (
          <>
            {/* Left Side: Live Monitor Status */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Live Monitor
              </span>
              {totalCount > 0 ? (
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                  Tracking <span className="font-semibold text-stone-800">{activeCount}</span> of{' '}
                  <span className="font-semibold text-stone-800">{totalCount}</span> CRNs
                </span>
              ) : (
                <span className="text-xs text-stone-400 hidden sm:inline">
                  Enter any CRN to begin tracking
                </span>
              )}
            </div>

            {/* Right Side: Global Controls, User Account & Actions */}
            <div className="flex items-center gap-2">
              {/* Logged In User Pill */}
              {currentUser && (
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-stone-100 text-stone-700 border border-stone-200">
                  <User className="h-3 w-3 text-stone-500" />
                  <span className="font-medium max-w-[120px] truncate">{currentUser.name}</span>
                  {onSignOut && (
                    <button
                      onClick={onSignOut}
                      title="Sign out of student account"
                      className="ml-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* İTÜ OBS Course Schedule Browser Button */}
              <button
                id="itu-obs-browser-btn"
                onClick={onOpenItuObsModal}
                title="Browse courses from obs.itu.edu.tr/public/DersProgram by education level & subject"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-700" />
                <span className="hidden sm:inline">İTÜ OBS Browser</span>
                <span className="sm:hidden">OBS</span>
              </button>

              {/* Refresh all */}
              {totalCount > 0 && (
                <button
                  id="refresh-all-btn"
                  onClick={onManualRefreshAll}
                  disabled={isRefreshingAll}
                  title="Check all monitored CRNs immediately"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingAll ? 'animate-spin text-stone-900' : ''}`} />
                  <span className="hidden md:inline">{isRefreshingAll ? 'Checking...' : 'Check All'}</span>
                </button>
              )}

              {/* Auto Refresh Toggle */}
              <button
                id="auto-refresh-toggle"
                onClick={onToggleAutoRefresh}
                title={isAutoRefreshing ? 'Auto-check every 45s is active' : 'Auto-check paused'}
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
                title={soundEnabled ? 'Audio chime enabled on seat opening' : 'Audio muted'}
                aria-label="Toggle sound alert"
                className="p-2 rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Bell className="h-4 w-4 text-stone-800" />
                ) : (
                  <BellOff className="h-4 w-4 text-stone-400" />
                )}
              </button>

              {/* Admin Page for Password Owners (retained as requested: "Since i cannot see the url for now, lets remain the admin page button there") */}
              <button
                id="admin-portal-btn"
                onClick={onOpenAdminPortalModal}
                title="Admin Page: Accessible via /admin (Password: HelloWorld)"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-2xs cursor-pointer ${
                  isAdminAuthenticated
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {isAdminAuthenticated ? (
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-stone-500" />
                )}
                <span className="hidden sm:inline">Admin Page (/admin)</span>
                <span className="sm:hidden">Admin</span>
                {isAdminAuthenticated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Add CRN Button */}
              <button
                id="add-crn-btn"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add CRN</span>
              </button>
            </div>
          </>
        ) : (
          /* When Scrolled Down: Heading/Status is gone, ONLY Add CRN button remains! */
          <div className="w-full flex items-center justify-end">
            <button
              id="scrolled-add-crn-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all shadow-md cursor-pointer animate-in fade-in zoom-in-95 duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add CRN</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
