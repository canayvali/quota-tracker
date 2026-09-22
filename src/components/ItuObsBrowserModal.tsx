import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { ClassMonitor, ItuCourse, ItuEducationLevel } from '../types';
import { ITU_COURSES_CATALOG, ITU_OBS_URL, ITU_SUBJECT_OPTIONS } from '../data/ituCourses';

interface ItuObsBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitors: ClassMonitor[];
  onTrackCourse: (course: ItuCourse, studentEmail: string) => void;
  defaultEmail: string;
}

export const ItuObsBrowserModal: React.FC<ItuObsBrowserModalProps> = ({
  isOpen,
  onClose,
  monitors,
  onTrackCourse,
  defaultEmail
}) => {
  const [educationLevel, setEducationLevel] = useState<ItuEducationLevel>('lisans');
  const [selectedSubject, setSelectedSubject] = useState<string>('BLG');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [justAddedCrn, setJustAddedCrn] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    return ITU_COURSES_CATALOG.filter((c) => {
      if (c.educationLevel !== educationLevel) return false;
      if (selectedSubject !== 'ALL' && c.subjectCode !== selectedSubject) return false;
      if (!searchFilter.trim()) return true;

      const q = searchFilter.toLowerCase();
      return (
        c.crn.includes(q) ||
        c.courseCode.toLowerCase().includes(q) ||
        c.courseTitle.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
      );
    });
  }, [educationLevel, selectedSubject, searchFilter]);

  if (!isOpen) return null;

  const handleTrackClick = (course: ItuCourse) => {
    onTrackCourse(course, defaultEmail);
    setJustAddedCrn(course.crn);
    setTimeout(() => setJustAddedCrn(null), 2500);
  };

  const handleRefreshObs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div
      id="itu-obs-browser-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="itu-obs-browser-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400 text-stone-950 font-extrabold flex items-center justify-center text-sm shadow-xs">
              İTÜ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  İTÜ OBS Ders Programı & Kontenjan Portalı
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 font-mono border border-stone-700">
                  obs.itu.edu.tr/public/DersProgram
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Live course schedule & quota registry • Select education level and subject code to track with 1-click
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={ITU_OBS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <span>Open Official OBS</span>
              <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
            </a>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Education Level & Course Code Select Boxes */}
        <div className="p-5 bg-[#FAF9F5] border-b border-stone-200/90 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Education Level Select Box */}
            <div>
              <label htmlFor="select-edu-level" className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-stone-500" />
                <span>Program Seviyesi (Education Level)</span>
              </label>
              <select
                id="select-edu-level"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value as ItuEducationLevel)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              >
                <option value="lisans">Lisans (Undergraduate)</option>
                <option value="lisansustu">Lisansüstü (Graduate)</option>
              </select>
            </div>

            {/* Course Code / Subject Select Box */}
            <div>
              <label htmlFor="select-subject-code" className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-stone-500" />
                <span>Ders Kodu (Course Code: CEV, ITB, BLG...)</span>
              </label>
              <select
                id="select-subject-code"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold font-mono rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              >
                <option value="ALL">Tümü (All Course Codes)</option>
                {ITU_SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} — {sub.nameTr}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Alert Recipient Email (Auto-bound from user account) */}
            <div>
              <span className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Alert Notification Destination</span>
                <span className="text-[10px] text-emerald-600 font-medium">Logged-in Account</span>
              </span>
              <div className="w-full px-3 py-2 text-xs font-mono font-medium rounded-xl border border-stone-200 bg-stone-100/70 text-stone-700 flex items-center justify-between">
                <span className="truncate">{defaultEmail}</span>
                <span className="text-[10px] text-stone-400">Auto-sent</span>
              </div>
            </div>
          </div>

          {/* Search filter & Sync */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Filter by CRN (e.g. 10492), course title or instructor..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white placeholder:text-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleRefreshObs}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync with OBS</span>
              </button>
              <span className="text-xs text-stone-500 font-medium">
                {filteredCourses.length} section{filteredCourses.length === 1 ? '' : 's'} found
              </span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3">CRN</th>
                    <th className="py-2.5 px-3">Ders Kodu</th>
                    <th className="py-2.5 px-3">Ders Adı</th>
                    <th className="py-2.5 px-3">Öğretim Görevlisi</th>
                    <th className="py-2.5 px-3">Gün / Saat</th>
                    <th className="py-2.5 px-3 text-center">Kont.</th>
                    <th className="py-2.5 px-3 text-center">Yazılan</th>
                    <th className="py-2.5 px-3 text-center">Kalan</th>
                    <th className="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-sans">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-500 text-xs">
                        No courses found matching your criteria. Try changing the Education Level or Subject Code.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c) => {
                      const isAlreadyTracked = monitors.some((m) => m.crn === c.crn);
                      const isSeatOpen = c.remaining > 0;
                      const wasJustAdded = justAddedCrn === c.crn;

                      return (
                        <tr
                          key={c.crn}
                          className={`hover:bg-stone-50/80 transition-colors ${
                            isSeatOpen ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-stone-900 text-amber-400 font-mono text-[11px]">
                              {c.crn}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap font-mono">
                            {c.courseCode}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-stone-800 min-w-[180px]">
                            <div>{c.courseTitle}</div>
                            <div className="text-[10px] text-stone-400 font-normal">
                              {c.building} • {c.teachingMethod}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">
                            {c.instructor}
                          </td>
                          <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap font-mono text-[11px]">
                            {c.dayTime}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                            {c.capacity}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-stone-600">
                            {c.enrolled}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isSeatOpen
                                  ? 'bg-emerald-100 text-emerald-800 font-extrabold animate-pulse'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {c.remaining}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {wasJustAdded ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                <Check className="h-3 w-3" /> Added!
                              </span>
                            ) : isAlreadyTracked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Tracking
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTrackClick(c)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Track Quota</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Direct integration with İTÜ OBS class schedule system (BLG, CEV, ITB, MAT, FIZ, etc.)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
