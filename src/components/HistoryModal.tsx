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
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-900 text-amber-400">
                CRN {monitor.crn}
              </span>
              <h2 className="text-sm font-bold text-stone-900">
                {monitor.courseCode} Quota & Email Audit Log
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Historical record of seat changes and automated email alerts sent to {monitor.notificationEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-xs">
              No quota changes have occurred yet for this CRN.
              Use the "Test Quota" button on the card to simulate a change.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'increased' ? (
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    ) : item.type === 'decreased' ? (
                      <span className="p-1.5 rounded-lg bg-red-100 text-red-800">
                        <ArrowDownRight className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-stone-200 text-stone-700">
                        <Clock className="h-4 w-4" />
                      </span>
                    )}

                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {item.type === 'increased' && (
                          <span className="text-emerald-700">Seat Opened: {item.oldAvailable} → {item.newAvailable} Available</span>
                        )}
                        {item.type === 'decreased' && (
                          <span className="text-red-700">Seat Taken: {item.oldAvailable} → {item.newAvailable} Available</span>
                        )}
                        {item.type === 'initial' && 'Monitoring Initiated'}
                        {item.type === 'unchanged' && 'Quota Checked (Unchanged)'}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {item.emailDispatched ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Mail className="h-3 w-3" />
                      Email Dispatched
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      No alert triggered
                    </span>
                  )}
                </div>

                {item.notes && (
                  <p className="text-xs text-stone-600 bg-white p-2 rounded-lg border border-stone-200/60">
                    {item.notes}
                  </p>
                )}

                {item.emailDispatched && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-500">
                      Subject: <strong className="text-stone-700 font-normal">{item.emailSubject}</strong>
                    </span>
                    <button
                      onClick={() => onViewDispatchedEmail(item)}
                      className="text-stone-900 font-semibold hover:underline cursor-pointer"
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
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
