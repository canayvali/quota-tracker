import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
  Layers,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Wifi
} from 'lucide-react';
import { AppLanguage, CourseGroupSection, TeachingModeFilter, TrackedCourseGroup } from '../types';
import { getDeliveryFilterLabel } from '../utils/courseUtils';
import { TRANSLATIONS } from '../utils/translations';

interface CourseGroupCardProps {
  group: TrackedCourseGroup;
  onCheckNow: (groupId: string) => void;
  onTogglePause: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  onViewHistory: (group: TrackedCourseGroup) => void;
  onUpdateFilter?: (groupId: string, newFilter: TeachingModeFilter) => void;
  isChecking: boolean;
  language?: AppLanguage;
}

export const CourseGroupCard: React.FC<CourseGroupCardProps> = ({
  group,
  onCheckNow,
  onTogglePause,
  onDelete,
  onViewHistory,
  onUpdateFilter,
  isChecking,
  language = 'tr'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.tr;
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Compute total aggregates across all tracked sections of this course code
  const totalEnrolled = group.sections.reduce((acc, s) => acc + (s.enrolled || 0), 0);
  const totalCapacity = group.sections.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalAvailable = group.sections.reduce((acc, s) => acc + (s.availableSeats || 0), 0);
  const hasAvailableSeats = totalAvailable > 0;
  const percentFilled = totalCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / totalCapacity) * 100)) : 100;

  const filterInfo = getDeliveryFilterLabel(group.deliveryFilter || 'all', language);

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return language === 'tr' ? 'Az önce' : 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 10) return t.justNow;
      if (diffSec < 60) return `${diffSec}s ${language === 'tr' ? 'önce' : 'ago'}`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ${language === 'tr' ? 'önce' : 'ago'}`;
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ${language === 'tr' ? 'önce' : 'ago'}`;
    } catch {
      return language === 'tr' ? 'Az önce' : 'Recently';
    }
  };

  return (
    <div
      id={`course-group-card-${group.courseCode}`}
      className={`relative rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-xs ${
        hasAvailableSeats
          ? 'border-emerald-400/80 ring-2 ring-emerald-500/10 dark:ring-emerald-500/20'
          : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      } ${group.status === 'paused' ? 'opacity-70 bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
    >
      {/* Top Banner on Open Seat in Any Section */}
      {hasAvailableSeats && (
        <div className="bg-emerald-500 text-white px-4 py-1.5 text-[11px] font-bold tracking-wide rounded-t-2xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            {language === 'tr' ? `Şubelerde Kontenjan Açıldı!` : 'Seats Available in Sections!'}
          </span>
          <span className="font-mono text-xs">
            {totalAvailable} {language === 'tr' ? 'boş yer' : 'open'} ({group.sections.filter((s) => s.availableSeats > 0).length} {language === 'tr' ? 'şube' : 'sec'})
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header: Course Code, Multi-Section Badge & Filter Selector */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-stone-900 dark:bg-stone-800 text-amber-400 shadow-xs flex items-center gap-1">
                <Layers className="h-3 w-3 text-amber-400" />
                {group.courseCode}
              </span>

              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded-md">
                {group.sections.length} {language === 'tr' ? 'Şube Takipte' : 'Sections'}
              </span>

              {/* Delivery Filter Selector */}
              {onUpdateFilter ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`text-[11px] font-medium border px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${filterInfo.badgeClass}`}
                  >
                    <span>{filterInfo.shortLabel}</span>
                    <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                  </button>

                  {showFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 w-48 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-lg py-1 z-30 text-xs font-sans">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                          {language === 'tr' ? 'Öğretim Türü' : 'Delivery Mode'}
                        </div>
                        {(['all', 'face_to_face', 'online'] as TeachingModeFilter[]).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              onUpdateFilter(group.id, f);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-700/50 cursor-pointer ${
                              group.deliveryFilter === f
                                ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                                : 'text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span>{getDeliveryFilterLabel(f, language).label}</span>
                            {group.deliveryFilter === f && <span className="text-emerald-600 font-bold">✓</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <span className={`text-[11px] font-medium border px-2 py-0.5 rounded-md ${filterInfo.badgeClass}`}>
                  {filterInfo.shortLabel}
                </span>
              )}

              {group.status === 'paused' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                  {language === 'tr' ? 'DURAKLATILDI' : 'PAUSED'}
                </span>
              )}
            </div>

            <h3 className="mt-1.5 text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {group.courseTitle}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
              <span>{language === 'tr' ? 'Şubeler' : 'Sections'}:</span>
              <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                {group.sections.map((s) => s.crn).join(', ')}
              </span>
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePause(group.id)}
              title={group.status === 'active' ? t.btnPause : t.btnResume}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              {group.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 text-emerald-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onDelete(group.id)}
              title={t.btnDelete}
              className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Aggregate Progress Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              {language === 'tr' ? 'Toplam Grup Kontenjanı' : 'Total Group Quota'}:
            </span>
            <div className="font-mono text-stone-800 dark:text-stone-200">
              <span className="font-bold text-stone-900 dark:text-stone-100">{totalEnrolled}</span>
              <span className="text-stone-400"> / </span>
              <span>{totalCapacity}</span>
              <span className="text-stone-400 text-[11px] ml-1">({percentFilled}%)</span>
            </div>
          </div>

          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                hasAvailableSeats ? 'bg-emerald-500' : percentFilled >= 100 ? 'bg-stone-400 dark:bg-stone-600' : 'bg-amber-500'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-center ${
              hasAvailableSeats
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-[#FAF9F5] dark:bg-stone-800/60 border-stone-200/80 dark:border-stone-700/60 text-stone-800 dark:text-stone-200'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              {language === 'tr' ? 'Açık Kontenjan' : 'Open Seats'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl font-extrabold font-mono ${
                  hasAvailableSeats ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                {totalAvailable}
              </span>
              <span className="text-[10px] text-stone-400">/ {totalCapacity}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex flex-col justify-center text-xs">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              {language === 'tr' ? 'Grup Durumu' : 'Group Status'}
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {hasAvailableSeats ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {language === 'tr' ? 'Yer Açılan Şube Var' : 'Seats Open'}
                </span>
              ) : (
                <span className="text-stone-600 dark:text-stone-400">
                  {group.status === 'paused' ? (language === 'tr' ? 'DURAKLATILDI' : 'PAUSED') : t.statusFull}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section List Accordion Preview */}
        <div className="mt-3">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{language === 'tr' ? 'Şubeler' : 'Sections'} ({group.sections.length})</span>
            <span className="text-[10px] font-normal text-stone-400">
              {group.sections.filter((s) => s.isOnline).length} {language === 'tr' ? 'çevrimiçi' : 'online'},{' '}
              {group.sections.filter((s) => !s.isOnline).length} {language === 'tr' ? 'yüz yüze' : 'in-person'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {group.sections.map((sec: CourseGroupSection) => {
              const isSecOpen = sec.availableSeats > 0;
              return (
                <div
                  key={sec.crn}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                    isSecOpen
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-stone-50 dark:bg-stone-850 border-stone-200/70 dark:border-stone-800 text-stone-800 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-stone-900 dark:bg-stone-800 text-amber-400 text-[11px]">
                      {sec.crn}
                    </span>

                    <div className="truncate">
                      <div className="font-medium truncate text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span className="truncate">{sec.instructor || 'İTÜ Öğretim Görevlisi'}</span>
                        {sec.isOnline ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                            <Wifi className="h-2.5 w-2.5" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-750 px-1.5 py-0.2 rounded">
                            <MapPin className="h-2.5 w-2.5" />
                            {sec.building || 'Maslak'}
                          </span>
                        )}
                      </div>
                      {sec.dayTime && (
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                          {sec.dayTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold flex items-center gap-1 justify-end">
                      <span className={isSecOpen ? 'text-emerald-700 dark:text-emerald-300 text-sm font-extrabold' : 'text-stone-700 dark:text-stone-300'}>
                        {sec.availableSeats} {language === 'tr' ? 'boş' : 'left'}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {sec.enrolled}/{sec.capacity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar: Check metadata & Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{t.lastChecked}: {getRelativeTime(group.lastChecked)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCheckNow(group.id)}
              disabled={isChecking || group.status === 'paused'}
              title={t.btnCheckNow}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${isChecking ? 'animate-spin text-stone-900 dark:text-stone-100' : ''}`}
              />
              <span className="hidden sm:inline">
                {isChecking ? (language === 'tr' ? 'Kontrol ediliyor...' : 'Checking...') : t.btnCheckNow}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onViewHistory(group)}
              title={t.btnHistory}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 rounded-lg transition-all cursor-pointer"
            >
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">{t.btnHistory}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
