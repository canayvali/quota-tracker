import React from 'react';
import { CheckCircle2, Clock, History, Pause, Play, RefreshCw, Trash2, User } from 'lucide-react';
import { AppLanguage, ClassMonitor } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface MonitorCardProps {
  monitor: ClassMonitor;
  onCheckNow: (id: string) => void;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (monitor: ClassMonitor) => void;
  isChecking: boolean;
  language?: AppLanguage;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  onCheckNow,
  onTogglePause,
  onDelete,
  onViewHistory,
  isChecking,
  language = 'tr'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.tr;

  const isAvailable = monitor.availableSeats > 0;
  const percentFilled = Math.min(
    100,
    Math.round((monitor.enrolled / Math.max(1, monitor.totalCapacity)) * 100)
  );

  const getRelativeTime = (isoString: string) => {
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
      id={`monitor-card-${monitor.crn}`}
      className={`relative rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-xs ${
        isAvailable
          ? 'border-emerald-400/80 ring-2 ring-emerald-500/10 dark:ring-emerald-500/20'
          : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      } ${monitor.status === 'paused' ? 'opacity-70 bg-stone-50/50 dark:bg-stone-900/50' : ''}`}
    >
      {/* Top Banner on Open Seat */}
      {isAvailable && (
        <div className="bg-emerald-500 text-white px-4 py-1 text-[11px] font-bold tracking-wide rounded-t-2xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            {language === 'tr' ? 'Kontenjan Açıldı!' : 'Seats Available!'}
          </span>
          <span className="font-mono text-xs">{monitor.availableSeats} {language === 'tr' ? 'boş yer' : 'open'}</span>
        </div>
      )}

      <div className="p-5">
        {/* Course Code, CRN & Controls */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-stone-900 dark:bg-stone-800 text-amber-400 shadow-xs">
                CRN {monitor.crn}
              </span>
              <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded">
                {monitor.courseCode}
              </span>
              {monitor.status === 'paused' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                  {language === 'tr' ? 'DURAKLATILDI' : 'PAUSED'}
                </span>
              )}
            </div>

            <h3 className="mt-1.5 text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {monitor.courseTitle}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" />
              <span>{monitor.instructor || 'İTÜ Öğretim Üyesi'}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePause(monitor.id)}
              title={monitor.status === 'active' ? t.btnPause : t.btnResume}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              {monitor.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 text-emerald-600" />
              )}
            </button>

            <button
              onClick={() => onDelete(monitor.id)}
              title={t.btnDelete}
              className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              {t.quotaLabel}:
            </span>
            <div className="font-mono text-stone-800 dark:text-stone-200">
              <span className="font-bold text-stone-900 dark:text-stone-100">{monitor.enrolled}</span>
              <span className="text-stone-400"> / </span>
              <span>{monitor.totalCapacity}</span>
              <span className="text-stone-400 text-[11px] ml-1">({percentFilled}%)</span>
            </div>
          </div>

          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isAvailable ? 'bg-emerald-500' : percentFilled >= 100 ? 'bg-stone-400 dark:bg-stone-600' : 'bg-amber-500'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Big Seats Stat Box */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-center ${
              isAvailable
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-[#FAF9F5] dark:bg-stone-800/60 border-stone-200/80 dark:border-stone-700/60 text-stone-800 dark:text-stone-200'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">{t.seatsRemaining}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl font-extrabold font-mono ${
                  isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                {monitor.availableSeats}
              </span>
              <span className="text-[10px] text-stone-400">/ {monitor.totalCapacity}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAF9F5] dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex flex-col justify-center text-xs">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              {language === 'tr' ? 'Durum' : 'Status'}
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t.statusSeatOpen}
                </span>
              ) : (
                <span className="text-stone-600 dark:text-stone-400">
                  {monitor.status === 'paused' ? (language === 'tr' ? 'DURAKLATILDI' : 'PAUSED') : t.statusFull}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Restrictions line if available */}
        {monitor.restrictions && (
          <div className="mt-2.5 text-[11px] bg-stone-50 dark:bg-stone-850 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-stone-750 text-stone-600 dark:text-stone-400 truncate">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Şart:</span> {monitor.restrictions}
          </div>
        )}

        {/* Bottom Bar: Check metadata & Action Buttons */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{t.lastChecked}: {getRelativeTime(monitor.lastChecked)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onCheckNow(monitor.id)}
              disabled={isChecking || monitor.status === 'paused'}
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
              onClick={() => onViewHistory(monitor)}
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
