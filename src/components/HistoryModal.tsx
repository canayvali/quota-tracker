import React from 'react';
import { ArrowDownRight, ArrowUpRight, Clock, Mail, X } from 'lucide-react';
import { ClassMonitor, QuotaHistoryEvent } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitor: ClassMonitor | null;
  onViewDispatchedEmail: (event: QuotaHistoryEvent) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  monitor,
  onViewDispatchedEmail
}) => {
  if (!isOpen || !monitor) return null;

  const history = monitor.history || [];

  return (
    <div
      id="history-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="history-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 text-amber-400">
                CRN {monitor.crn}
              </span>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {monitor.courseCode} Quota & Email Audit Log
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Historical record of seat changes and automated email alerts sent to {monitor.notificationEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-xs">
              No quota changes have occurred yet for this CRN.
              Use the "Test Quota" button on the card to simulate a change.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'increased' ? (
                      <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    ) : item.type === 'decreased' ? (
                      <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                        <ArrowDownRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        <Clock className="h-4 w-4" />
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {item.type === 'increased' && (
                          <span className="text-emerald-700 dark:text-emerald-400">Seat Opened: {item.oldAvailable} → {item.newAvailable} Available</span>
                        )}
                        {item.type === 'decreased' && (
                          <span className="text-red-700 dark:text-red-400">Seat Taken: {item.oldAvailable} → {item.newAvailable} Available</span>
                        )}
                        {item.type === 'initial' && 'Monitoring Initiated'}
                        {item.type === 'unchanged' && 'Quota Checked (Unchanged)'}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {item.emailDispatched ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Mail className="h-3 w-3" />
                      Email Dispatched
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">
                      No alert triggered
                    </span>
                  )}
                </div>

                {item.notes && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200/60 dark:border-stone-700/60">
                    {item.notes}
                  </p>
                )}

                {item.emailDispatched && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-500 dark:text-stone-400">
                      Subject: <strong className="text-stone-700 dark:text-stone-200 font-normal">{item.emailSubject}</strong>
                    </span>
                    <button
                      onClick={() => onViewDispatchedEmail(item)}
                      className="text-stone-900 dark:text-stone-100 font-semibold hover:underline cursor-pointer"
                    >
                      View Sent Email
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 dark:bg-stone-800 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
