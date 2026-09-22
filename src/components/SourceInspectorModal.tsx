import React, { useState } from 'react';
import { Code2, Globe, X } from 'lucide-react';
import { ClassMonitor } from '../types';

interface SourceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: ClassMonitor[];
  defaultUrl: string;
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({
  isOpen,
  onClose,
  monitors,
  defaultUrl
}) => {
  const [testUrl, setTestUrl] = useState(defaultUrl);
  const [filterCrn, setFilterCrn] = useState('');

  if (!isOpen) return null;

  return (
    <div
      id="source-inspector-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="source-inspector-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <Globe className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Source Web Page Table & CRN Parser
              </h2>
              <p className="text-xs text-stone-500">
                How the background monitor reads and extracts course quota rows from university websites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="p-4 bg-stone-100/60 border-b border-stone-200 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-white"
              placeholder="https://sis.university.edu/courses/quota"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="text"
              placeholder="Search CRN..."
              value={filterCrn}
              onChange={(e) => setFilterCrn(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-white w-28 font-mono"
            />
          </div>
        </div>

        {/* Live Extracted Table Preview */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-stone-500" />
              Extracted Table Stream (University SIS Format)
            </span>
            <span className="text-stone-500">
              Matched {monitors.length} active CRN monitor{monitors.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3">CRN</th>
                    <th className="py-2.5 px-3">Course Code</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 text-center">Cap</th>
                    <th className="py-2.5 px-3 text-center">Enrolled</th>
                    <th className="py-2.5 px-3 text-center">Rem. Seats</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-sans">
                  {monitors
                    .filter((m) => !filterCrn || m.crn.includes(filterCrn) || m.courseCode.toLowerCase().includes(filterCrn.toLowerCase()))
                    .map((m) => {
                      const isSeatOpen = m.availableSeats > 0;
                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-stone-50 transition-colors ${
                            isSeatOpen ? 'bg-emerald-50/40 font-medium' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                            {m.crn}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-800">
                            {m.courseCode}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 max-w-[200px] truncate">
                            {m.courseTitle}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                            {m.totalCapacity}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                            {m.enrolled}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isSeatOpen
                                  ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {m.availableSeats}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isSeatOpen ? (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                OPEN
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone-500">FULL</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
            <strong className="text-stone-800">How the web scraper works:</strong> In standard university portals (like ITU SIS, Banner, or custom course schedules), the server periodically fetches the target page, parses table rows by matching the <code className="bg-stone-200 px-1 py-0.5 rounded text-[11px] font-mono">CRN</code> cell, and extracts the Capacity and Enrolled numbers. If the delta changes, it immediately invokes the email dispatcher.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
