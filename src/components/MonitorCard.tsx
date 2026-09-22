import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, History, Mail, Pause, Play, RefreshCw, Trash2, User } from 'lucide-react';
import { ClassMonitor } from '../types';

interface MonitorCardProps {
  monitor: ClassMonitor;
  onCheckNow: (id: string) => void;
  onSimulateDrop: (id: string) => void;
  onSimulateClaim: (id: string) => void;
  onSimulateCapacityIncrease: (id: string) => void;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (monitor: ClassMonitor) => void;
  isChecking: boolean;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  onCheckNow,
  onSimulateDrop,
  onSimulateClaim,
  onSimulateCapacityIncrease,
  onTogglePause,
  onDelete,
  onViewHistory,
  isChecking
}) => {
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
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      id={`monitor-card-${monitor.crn}`}
      className={`relative rounded-2xl bg-white border transition-all shadow-xs ${
        isAvailable
          ? 'border-emerald-400/80 ring-2 ring-emerald-500/10'
          : 'border-stone-200/90 hover:border-stone-300'
      } ${monitor.status === 'paused' ? 'opacity-70 bg-stone-50/50' : ''}`}
    >
      {/* Top Banner on Open Seat */}
      {isAvailable && (
        <div className="bg-emerald-500 text-white px-4 py-1 text-[11px] font-bold tracking-wide rounded-t-2xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            SEAT AVAILABLE RIGHT NOW!
          </span>
          <span className="font-mono text-emerald-100 uppercase">
            {monitor.availableSeats} {monitor.availableSeats === 1 ? 'Seat Open' : 'Seats Open'}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Card Header: CRN, Title, Instructor */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-stone-900 text-amber-400 shadow-2xs">
                CRN {monitor.crn}
              </span>
              <span className="font-bold text-stone-900 text-base">
                {monitor.courseCode}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  monitor.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {monitor.status === 'active' ? 'Active' : 'Paused'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-stone-800 line-clamp-1">
              {monitor.courseTitle}
            </h3>
            {monitor.instructor && (
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <User className="h-3 w-3 text-stone-400" />
                <span>{monitor.instructor}</span>
              </p>
            )}
          </div>

          {/* Quick Actions (Pause / Delete) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePause(monitor.id)}
              title={monitor.status === 'active' ? 'Pause monitoring' : 'Resume monitoring'}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              {monitor.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-600" />}
            </button>
            <button
              onClick={() => onDelete(monitor.id)}
              title="Remove this class monitor"
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Central Quota Meter Box */}
        <div
          className={`p-3.5 rounded-xl border mb-4 ${
            isAvailable
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-stone-50/70 border-stone-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600">Current Quota Status</span>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {monitor.availableSeats} Open Seat{monitor.availableSeats > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-full">
                Full ({monitor.enrolled}/{monitor.totalCapacity})
              </span>
            )}
          </div>

          {/* Quota Numbers Grid */}
          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
              <div className="text-[10px] text-stone-500 font-medium">Available</div>
              <div
                className={`text-lg font-bold font-mono ${
                  isAvailable ? 'text-emerald-600 animate-bounce' : 'text-stone-800'
                }`}
              >
                {monitor.availableSeats}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
              <div className="text-[10px] text-stone-500 font-medium">Enrolled</div>
              <div className="text-lg font-bold font-mono text-stone-800">
                {monitor.enrolled}
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-stone-200/60 shadow-2xs">
              <div className="text-[10px] text-stone-500 font-medium">Capacity</div>
              <div className="text-lg font-bold font-mono text-stone-800">
                {monitor.totalCapacity}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-stone-500 mb-1">
              <span>Enrollment Fill</span>
              <span>{percentFilled}% Filled</span>
            </div>
            <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isAvailable ? 'bg-emerald-500' : 'bg-stone-700'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
        </div>

        {/* Target Email & Check Timestamp */}
        <div className="space-y-1.5 text-xs text-stone-600 mb-4 pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Mail className="h-3.5 w-3.5 text-stone-400" />
              <span>Email:</span>
            </span>
            <span className="font-mono text-[11px] text-stone-800 font-medium max-w-[180px] truncate">
              {monitor.notificationEmail}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <span>Checked:</span>
            </span>
            <span className="text-stone-700 font-medium">
              {getRelativeTime(monitor.lastChecked)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-500">Bildirim:</span>
            <span className="text-[11px] text-stone-700 font-medium">
              Kontenjan Açılınca / Artınca
            </span>
          </div>
        </div>

        {/* Action Controls & Simulator */}
        <div className="flex items-center justify-between gap-2">
          {/* Check Now */}
          <button
            onClick={() => onCheckNow(monitor.id)}
            disabled={isChecking}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Kontrol Ediliyor...' : 'Şimdi Kontrol Et'}</span>
          </button>

          {/* View Audit & Email Log */}
          <button
            onClick={() => onViewHistory(monitor)}
            title="E-posta bildirim geçmişini ve olay kaydını görüntüle"
            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <History className="h-4 w-4" />
          </button>

          {/* Simulate Changes Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              title="E-posta bildirimini test etmek için olay simüle et"
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-stone-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            >
              <span>Test Et</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showSimulateMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSimulateMenu(false)}
                />
                <div className="absolute right-0 bottom-full mb-1.5 w-56 rounded-xl bg-white border border-stone-200 shadow-xl py-1.5 z-30 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Olay Simülasyonu
                  </div>
                  <button
                    onClick={() => {
                      onSimulateDrop(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-emerald-800">Biri Dersi Bıraktı</div>
                      <div className="text-[10px] text-stone-500">"Kontenjan açıldı..." e-postası</div>
                    </div>
                    <span className="font-mono text-emerald-600 font-bold ml-2">+1</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateCapacityIncrease(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between border-t border-stone-100"
                  >
                    <div>
                      <div className="font-semibold text-amber-800">Kontenjan Arttırıldı</div>
                      <div className="text-[10px] text-stone-500">"Kontenjan arttırıldı!" e-postası</div>
                    </div>
                    <span className="font-mono text-amber-700 font-bold ml-2">+5</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateClaim(monitor.id);
                      setShowSimulateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-stone-700 hover:bg-stone-50 hover:text-stone-900 flex items-center justify-between border-t border-stone-100 opacity-80"
                  >
                    <div>
                      <div className="font-semibold text-stone-700">Ders Alındı (Kontenjan Düştü)</div>
                      <div className="text-[10px] text-stone-400">E-posta gönderilmez</div>
                    </div>
                    <span className="font-mono text-stone-500 font-bold ml-2">-1</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
