import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, History, Pause, Play, RefreshCw, Trash2, User } from 'lucide-react';
import { AppLanguage, ClassMonitor } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface MonitorCardProps {
  monitor: ClassMonitor;
  onCheckNow: (id: string) => void;
  onSimulateDrop: (id: string) => void;
  onSimulateClaim: (id: string) => void;
  onSimulateCapacityIncrease: (id: string) => void;
  onSimulateNewCrn?: (courseCode: string) => void;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (monitor: ClassMonitor) => void;
  isChecking: boolean;
  language?: AppLanguage;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  onCheckNow,
  onSimulateDrop,
  onSimulateClaim,
  onSimulateCapacityIncrease,
  onSimulateNewCrn,
  onTogglePause,
  onDelete,
  onViewHistory,
  isChecking,
  language = 'tr'
}) => {
  const t = TRANSLATIONS[language];
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

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
            {t.statusSeatOpen}
          </span>
          <span className="font-mono text-emerald-100 uppercase">
            {monitor.availableSeats} {language === 'tr' ? 'Boş Kontenjan' : (monitor.availableSeats === 1 ? 'Seat Open' : 'Seats Open')}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Card Header: CRN, Title, Instructor */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-stone-900 dark:bg-stone-800 text-amber-400 shadow-2xs border border-stone-800 dark:border-stone-700">
                CRN {monitor.crn}
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100 text-base">
                {monitor.courseCode}
              </span>
              {monitor.trackedCourseCode && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {language === 'tr' ? `Ders: ${monitor.trackedCourseCode}` : `Code: ${monitor.trackedCourseCode}`}
                </span>
              )}
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  monitor.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {monitor.status === 'active' ? (language === 'tr' ? 'Aktif' : 'Active') : (language === 'tr' ? 'Durduruldu' : 'Paused')}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 line-clamp-1">
              {monitor.courseTitle}
            </h3>
            {monitor.instructor && (
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <User className="h-3 w-3 text-stone-400 dark:text-stone-500" />
                <span>{monitor.instructor}</span>
              </p>
            )}
          </div>

          {/* Quick Actions (Pause / Delete) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePause(monitor.id)}
              title={monitor.status === 'active' ? t.btnPause : t.btnResume}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              {monitor.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
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

        {/* Central Quota Meter Box */}
        <div
          className={`p-3.5 rounded-xl border mb-4 ${
            isAvailable
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
              : 'bg-stone-50/70 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              {language === 'tr' ? 'Güncel Kontenjan Durumu' : 'Current Quota Status'}
            </span>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-stone-800 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {monitor.availableSeats} {language === 'tr' ? 'Boş Yer' : (monitor.availableSeats > 1 ? 'Open Seats' : 'Open Seat')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 bg-stone-200/80 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                {t.filterFull}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-700/80 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isAvailable ? 'bg-emerald-500' : 'bg-stone-500 dark:bg-stone-400'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <div>
              <span className="text-stone-400 dark:text-stone-500">{t.seatsEnrolled}: </span>
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {monitor.enrolled} / {monitor.totalCapacity}
              </span>
            </div>
            <div>
              <span className="text-stone-400 dark:text-stone-500">{t.seatsRemaining}: </span>
              <span
                className={`font-mono font-bold ${
                  isAvailable ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {monitor.availableSeats}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Last Check Time & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 text-[11px]">
            <Clock className="h-3 w-3" />
            <span>{t.lastChecked}: {getRelativeTime(monitor.lastChecked)}</span>
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

        {/* Live Simulation Trigger (Biri dersi bıraktı / Kontenjan arttırıldı) */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'tr' ? 'Bildirim Testi:' : 'Alert Testing:'}
          </span>

          {/* Simulate Changes Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              title={language === 'tr' ? 'E-posta bildirimini test etmek için olay simüle et' : 'Simulate an event to test email dispatch'}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
            >
              <span>{language === 'tr' ? 'Test Et' : 'Simulate'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showSimulateMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSimulateMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xl py-1.5 z-30 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                    {language === 'tr' ? 'Olay Simülasyonu' : 'Event Simulation'}
                  </div>
                  <button
                    onClick={() => {
                      onSimulateDrop(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-400">
                        {language === 'tr' ? 'Biri Dersi Bıraktı' : 'Seat Dropped'}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {language === 'tr' ? '"Kontenjan açıldı..." e-postası' : 'Dispatches seat drop alert'}
                      </div>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-2">+1</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateCapacityIncrease(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 flex items-center justify-between border-t border-stone-100 dark:border-stone-700"
                  >
                    <div>
                      <div className="font-semibold text-amber-800 dark:text-amber-400">
                        {language === 'tr' ? 'Kontenjan Arttırıldı' : 'Capacity Increased'}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {language === 'tr' ? '"Kontenjan arttırıldı!" e-postası' : 'Dispatches capacity alert'}
                      </div>
                    </div>
                    <span className="font-mono text-amber-700 dark:text-amber-400 font-bold ml-2">+5</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateClaim(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-between border-t border-stone-100 dark:border-stone-700 opacity-80"
                  >
                    <div>
                      <div className="font-semibold text-stone-700 dark:text-stone-300">
                        {language === 'tr' ? 'Ders Alındı (Kontenjan Düştü)' : 'Seat Taken (Decrease)'}
                      </div>
                      <div className="text-[10px] text-stone-400 dark:text-stone-500">
                        {language === 'tr' ? 'E-posta gönderilmez' : 'No email sent'}
                      </div>
                    </div>
                    <span className="font-mono text-stone-500 dark:text-stone-400 font-bold ml-2">-1</span>
                  </button>

                  {onSimulateNewCrn && (
                    <button
                      onClick={() => {
                        onSimulateNewCrn(monitor.trackedCourseCode || monitor.courseCode);
                        setShowSimulateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-stone-700 dark:text-stone-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-900 dark:hover:text-blue-200 flex items-center justify-between border-t border-stone-100 dark:border-stone-700"
                    >
                      <div>
                        <div className="font-semibold text-blue-800 dark:text-blue-400">
                          {language === 'tr' ? 'Yeni CRN Açıldı' : 'New CRN Opened'}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {language === 'tr' ? '"Yeni CRN Açıldı" e-posta testi' : 'Dispatches "New CRN" email'}
                        </div>
                      </div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold ml-2 text-xs">CRN+</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
