import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  History,
  Layers,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
  Wifi
} from 'lucide-react';
import { AppLanguage, CourseGroupSection, TeachingModeFilter, TrackedCourseGroup } from '../types';
import { getDeliveryFilterLabel } from '../utils/courseUtils';
import { TRANSLATIONS } from '../utils/translations';

interface CourseGroupCardProps {
  group: TrackedCourseGroup;
  onCheckNow: (groupId: string) => void;
  onSimulateDrop: (groupId: string, targetCrn?: string) => void;
  onSimulateCapacityIncrease: (groupId: string, targetCrn?: string) => void;
  onSimulateNewCrn: (courseCode: string, isOnline: boolean) => void;
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
  onSimulateDrop,
  onSimulateCapacityIncrease,
  onSimulateNewCrn,
  onTogglePause,
  onDelete,
  onViewHistory,
  onUpdateFilter,
  isChecking,
  language = 'tr'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.tr;
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
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
      className={`relative rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-xs flex flex-col justify-between ${
        hasAvailableSeats
          ? 'border-emerald-400/80 ring-2 ring-emerald-500/10 dark:ring-emerald-500/20'
          : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      } ${group.status === 'paused' ? 'opacity-70 bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
    >
      {/* Top Banner When Seats are Open */}
      {hasAvailableSeats && (
        <div className="bg-emerald-500 text-white px-4 py-1 text-[11px] font-bold tracking-wide rounded-t-2xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            {t.statusSeatOpen}
          </span>
          <span className="font-mono text-emerald-100 uppercase">
            {totalAvailable} {language === 'tr' ? 'Toplam Boş Yer' : (totalAvailable === 1 ? 'Total Seat Open' : 'Total Seats Open')}
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-md bg-blue-950 dark:bg-blue-900 text-amber-300 border border-blue-800 dark:border-blue-700 shadow-2xs">
                  {group.courseCode}
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  <Layers className="h-3 w-3 text-blue-500" />
                  <span>{t.courseGroupLabel}</span>
                </span>

                {/* Delivery Mode Badge with Change Option */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => onUpdateFilter && setShowFilterDropdown(!showFilterDropdown)}
                    title={language === 'tr' ? 'Ders veriliş filtresini değiştir' : 'Change delivery filter'}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer ${filterInfo.badgeClass}`}
                  >
                    {group.deliveryFilter === 'online' ? (
                      <Wifi className="h-3 w-3 text-purple-500" />
                    ) : group.deliveryFilter === 'face_to_face' ? (
                      <MapPin className="h-3 w-3 text-blue-500" />
                    ) : (
                      <Globe className="h-3 w-3 text-stone-500" />
                    )}
                    <span>{filterInfo.shortLabel}</span>
                    {onUpdateFilter && <ChevronDown className="h-2.5 w-2.5 opacity-60" />}
                  </button>

                  {showFilterDropdown && onUpdateFilter && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowFilterDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xl py-1 z-30 text-xs">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase text-stone-400 dark:text-stone-500">
                          {t.deliveryFilterLabel}
                        </div>
                        {(['all', 'face_to_face', 'online'] as TeachingModeFilter[]).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              onUpdateFilter(group.id, f);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-700 ${
                              group.deliveryFilter === f ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span>{getDeliveryFilterLabel(f, language).label}</span>
                            {group.deliveryFilter === f && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    group.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {group.status === 'active' ? (language === 'tr' ? 'Aktif' : 'Active') : (language === 'tr' ? 'Durduruldu' : 'Paused')}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">
                {group.courseTitle}
              </h3>
            </div>

            {/* Quick Actions (Pause / Delete entire group) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onTogglePause(group.id)}
                title={group.status === 'active' ? t.btnPause : t.btnResume}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                {group.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              </button>
              <button
                onClick={() => onDelete(group.id)}
                title={t.btnDelete}
                className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Aggregate Quota Overview Banner */}
          <div
            className={`p-3 rounded-xl border mb-3.5 ${
              hasAvailableSeats
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-stone-50/70 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  {language === 'tr' ? 'Genel Kontenjan Durumu' : 'Overall Course Quota'}
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  ({group.sections.length} {t.sectionsCount})
                </span>
              </div>

              {hasAvailableSeats ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {totalAvailable} {language === 'tr' ? 'Boş Yer' : (totalAvailable > 1 ? 'Open Seats' : 'Open Seat')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 bg-stone-200/80 dark:bg-stone-800 px-2.5 py-0.5 rounded-full">
                  {t.allSectionsFull}
                </span>
              )}
            </div>

            {/* Total progress bar */}
            <div className="w-full h-2 bg-stone-200 dark:bg-stone-700/80 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  hasAvailableSeats ? 'bg-emerald-500' : 'bg-stone-500 dark:bg-stone-400'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
              <div>
                <span className="text-stone-400 dark:text-stone-500">{t.seatsEnrolled}: </span>
                <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                  {totalEnrolled} / {totalCapacity}
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-stone-500">{t.seatsRemaining}: </span>
                <span
                  className={`font-mono font-bold ${
                    hasAvailableSeats ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {totalAvailable}
                </span>
              </div>
            </div>
          </div>

          {/* Sections List Inside This Single Unified Box */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">
              <span>{language === 'tr' ? 'Şubeler / Açılan CRN\'ler' : 'Sections & CRNs'}</span>
              <span>{group.sections.length} {language === 'tr' ? 'şube' : 'sections'}</span>
            </div>

            {group.sections.length === 0 ? (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400 text-center">
                {language === 'tr'
                  ? `Şu anda seçtiğiniz "${filterInfo.label}" filtresine uyan açık şube bulunmuyor. Yeni bir şube açıldığında anında bildirim gönderilecektir.`
                  : `No active sections currently match your "${filterInfo.label}" filter. You will be alerted the moment a matching section opens.`}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto overscroll-contain space-y-1.5 pr-1">
                {group.sections.map((section: CourseGroupSection) => {
                  const isSecAvailable = (section.availableSeats || 0) > 0;
                  return (
                    <div
                      key={section.crn}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 text-xs ${
                        isSecAvailable
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/10'
                          : 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-700/60'
                      }`}
                    >
                      {/* Left: CRN badge + Instructor + Schedule */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-stone-900 dark:bg-stone-800 text-amber-400 shrink-0">
                            CRN {section.crn}
                          </span>

                          {section.isOnline ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shrink-0">
                              <Wifi className="h-2.5 w-2.5" />
                              <span>Çevrimiçi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700/60 text-stone-700 dark:text-stone-300 shrink-0">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>Yüz Yüze</span>
                            </span>
                          )}

                          <span className="text-[11px] text-stone-700 dark:text-stone-300 font-medium truncate">
                            {section.instructor}
                          </span>
                        </div>

                        {section.dayTime && (
                          <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                            {section.dayTime} {section.building ? `• ${section.building}` : ''}
                          </div>
                        )}
                      </div>

                      {/* Right: Quota Numbers & Availability Badge */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300">
                          {section.enrolled}/{section.capacity}
                        </div>

                        {isSecAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                            {section.availableSeats} {language === 'tr' ? 'Boş' : 'Open'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 px-1.5 py-0.5">
                            {t.statusFull}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Last Checked & Actions */}
        <div>
          <div className="flex items-center justify-between pt-2.5 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 text-[11px]">
              <Clock className="h-3 w-3" />
              <span>{t.lastChecked}: {getRelativeTime(group.lastChecked)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
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
                onClick={() => onViewHistory(group)}
                title={t.btnHistory}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 rounded-lg transition-all cursor-pointer"
              >
                <History className="h-3 w-3" />
                <span className="hidden sm:inline">{t.btnHistory}</span>
              </button>
            </div>
          </div>

          {/* Test & Simulation Menu */}
          <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
              {language === 'tr' ? 'Toplu Takip Testi:' : 'Group Alert Test:'}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                title={language === 'tr' ? 'Bildirim ve filtre testleri simüle et' : 'Simulate alert and filter tests'}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span>{language === 'tr' ? 'Test Et' : 'Simulate'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showSimulateMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowSimulateMenu(false)} />
                  <div className="absolute right-0 bottom-full mb-1.5 w-64 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xl py-1.5 z-30 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                      {language === 'tr' ? 'Olay & Filtre Simülasyonu' : 'Event & Filter Simulation'}
                    </div>

                    {/* Someone dropped seat in one of the sections */}
                    <button
                      onClick={() => {
                        const target = group.sections[0]?.crn;
                        onSimulateDrop(group.id, target);
                        setShowSimulateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-emerald-800 dark:text-emerald-400">
                          {language === 'tr' ? 'Biri Dersi Bıraktı' : 'Seat Dropped'}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {language === 'tr' ? 'Şubede yer açıldı e-postası' : 'Dispatches seat drop alert'}
                        </div>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-2">+1</span>
                    </button>

                    {/* Capacity increase */}
                    <button
                      onClick={() => {
                        const target = group.sections[0]?.crn;
                        onSimulateCapacityIncrease(group.id, target);
                        setShowSimulateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 flex items-center justify-between border-t border-stone-100 dark:border-stone-700"
                    >
                      <div>
                        <div className="font-semibold text-amber-800 dark:text-amber-400">
                          {language === 'tr' ? 'Kontenjan Arttırıldı' : 'Capacity Increased'}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {language === 'tr' ? 'Şube kontenjanı +5 artar' : 'Dispatches capacity alert'}
                        </div>
                      </div>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-bold ml-2">+5</span>
                    </button>

                    {/* Simulate New CRN: Face to face */}
                    <button
                      onClick={() => {
                        onSimulateNewCrn(group.courseCode, false);
                        setShowSimulateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-900 dark:hover:text-blue-200 flex items-center justify-between border-t border-stone-100 dark:border-stone-700"
                    >
                      <div>
                        <div className="font-semibold text-blue-800 dark:text-blue-400">
                          {t.simulateNewCrnFaceToFace}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {group.deliveryFilter === 'online'
                            ? (language === 'tr' ? '⚠️ Yalnızca online seçili; filtrelenir' : '⚠️ Online only active; ignored')
                            : (language === 'tr' ? 'Yeni şube eklenir & e-posta gönderilir' : 'Adds section & sends alert')}
                        </div>
                      </div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold ml-2 text-xs">Yüz Yüze</span>
                    </button>

                    {/* Simulate New CRN: Online */}
                    <button
                      onClick={() => {
                        onSimulateNewCrn(group.courseCode, true);
                        setShowSimulateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-900 dark:hover:text-purple-200 flex items-center justify-between border-t border-stone-100 dark:border-stone-700"
                    >
                      <div>
                        <div className="font-semibold text-purple-800 dark:text-purple-400">
                          {t.simulateNewCrnOnline}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {group.deliveryFilter === 'face_to_face'
                            ? (language === 'tr' ? '⚠️ Yalnızca yüz yüze seçili; filtrelenir' : '⚠️ Face-to-face only active; ignored')
                            : (language === 'tr' ? 'Yeni çevrimiçi şube açılır & bildirim gider' : 'Adds online section & sends alert')}
                        </div>
                      </div>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold ml-2 text-xs">Online</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
