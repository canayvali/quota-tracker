import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { ClassMonitor, ItuCourse, UserAccount } from '../types';
import { fetchCourseByCrn } from '../utils/ituScraperService';

interface AddCrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMonitor: (monitor: ClassMonitor) => void;
  currentUser: UserAccount;
  defaultQuotaUrl: string;
  onOpenItuBrowser?: () => void;
}

const SAMPLE_ITU_CRNS = [
  { crn: '12486', label: 'BLG 212E (Microprocessors)' },
  { crn: '12462', label: 'BLG 113E (Intro to Comp Eng)' },
  { crn: '20194', label: 'CEV 201 (Çevre Müh)' },
  { crn: '21389', label: 'MAT 201E (Diff Equations)' },
  { crn: '31024', label: 'ITB 003 (Felsefeye Giriş)' },
];

export const AddCrnModal: React.FC<AddCrnModalProps> = ({
  isOpen,
  onClose,
  onAddMonitor,
  currentUser,
  defaultQuotaUrl,
  onOpenItuBrowser
}) => {
  const [crn, setCrn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredCourse, setDiscoveredCourse] = useState<ItuCourse | null>(null);

  if (!isOpen) return null;

  const handleLookupAndTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanCrn = crn.trim();
    if (!cleanCrn) {
      setError('Please enter a 5-digit CRN code.');
      return;
    }

    if (!/^\d{4,6}$/.test(cleanCrn)) {
      setError('CRN must be a 5-digit number (e.g. 12486).');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await fetchCourseByCrn(cleanCrn);
      const course = result.course;
      setDiscoveredCourse(course);

      const studentEmail = currentUser.email;

      const newMonitor: ClassMonitor = {
        id: 'mon-' + Date.now(),
        userId: currentUser.id,
        crn: course.crn,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        instructor: course.instructor,
        department: course.subjectCode,
        targetUrl: defaultQuotaUrl || 'https://obs.itu.edu.tr/public/DersProgram',
        notificationEmail: studentEmail,
        studentName: currentUser.name,
        status: 'active',
        totalCapacity: course.capacity,
        enrolled: course.enrolled,
        availableSeats: course.remaining,
        lastChecked: new Date().toISOString(),
        lastChanged: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        alertPreference: 'any_change',
        checkIntervalSeconds: 45,
        history: [
          {
            id: 'hist-' + Date.now(),
            timestamp: new Date().toISOString(),
            type: 'initial',
            oldAvailable: course.remaining,
            newAvailable: course.remaining,
            oldEnrolled: course.enrolled,
            newEnrolled: course.enrolled,
            emailDispatched: false,
            emailRecipient: studentEmail,
            emailSubject: `Live tracking activated for CRN ${course.crn} (${course.courseCode})`,
            notes: `Information automatically gathered from İTÜ OBS (obs.itu.edu.tr). Quota: ${course.enrolled}/${course.capacity}`
          }
        ]
      };

      // Brief delay to allow user to visually see the gathered course
      setTimeout(() => {
        onAddMonitor(newMonitor);
        setCrn('');
        setDiscoveredCourse(null);
        setIsLoading(false);
      }, 700);
    } catch (err: unknown) {
      setIsLoading(false);
      setError('Could not query İTÜ OBS. Please verify the CRN and try again.');
    }
  };

  const handleSelectSample = (sampleCrn: string) => {
    setCrn(sampleCrn);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-sm font-bold text-stone-900">
                Track Class by CRN
              </h2>
              <p className="text-xs text-stone-500">
                Enter CRN • All details auto-gathered from <span className="font-mono text-stone-700">obs.itu.edu.tr</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body: ONLY CRN requested! */}
        <form onSubmit={handleLookupAndTrack} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* CRN Input Field (The only input required!) */}
          <div>
            <label htmlFor="crn-input" className="block text-xs font-semibold text-stone-800 mb-1 flex items-center justify-between">
              <span>Course Reference Number (CRN) <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-stone-400 font-normal">5-digit code</span>
            </label>
            <div className="relative">
              <input
                id="crn-input"
                type="text"
                autoFocus
                placeholder="e.g. 12486"
                maxLength={6}
                value={crn}
                onChange={(e) => {
                  setCrn(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold tracking-wider rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
              />
              <div className="absolute right-3 top-3 text-[11px] text-stone-400 font-mono">
                {crn.length}/5
              </div>
            </div>
          </div>

          {/* Sample Popular CRNs for quick testing */}
          <div>
            <div className="text-[11px] text-stone-500 mb-1.5 flex items-center gap-1 font-medium">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Quick test samples from İTÜ OBS:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_ITU_CRNS.map((s) => (
                <button
                  type="button"
                  key={s.crn}
                  onClick={() => handleSelectSample(s.crn)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                    crn === s.crn
                      ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="font-mono font-bold mr-1">{s.crn}</span>
                  <span className="text-[10px] text-stone-400">{s.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Linked Account Email Info (Not asking for email—auto bound to account!) */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Mail className="h-4 w-4 text-stone-400" />
              <span>Notification destination:</span>
            </div>
            <span className="font-semibold text-stone-900 font-mono text-[11px]">
              {currentUser.email}
            </span>
          </div>

          {/* Discovered Course Preview Banner */}
          {discoveredCourse && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Gathered from İTÜ OBS:</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                <span className="font-mono font-bold">{discoveredCourse.courseCode}</span> — {discoveredCourse.courseTitle}
              </div>
              <div className="text-[11px] text-emerald-700 flex flex-wrap gap-2">
                <span>Instructor: {discoveredCourse.instructor}</span>
                <span>•</span>
                <span>Quota: {discoveredCourse.enrolled}/{discoveredCourse.capacity}</span>
                <span>•</span>
                <span>Remaining: {discoveredCourse.remaining}</span>
              </div>
            </div>
          )}

          {/* Information Notice */}
          <div className="p-3 bg-[#FAF9F5] border border-stone-200/80 rounded-xl text-xs text-stone-600 flex items-start gap-2">
            <Globe className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Course title, department, instructor, classroom schedule, and real-time quota are gathered directly from <strong>obs.itu.edu.tr</strong> using this CRN.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {onOpenItuBrowser ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenItuBrowser();
                }}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                Browse OBS catalog →
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <span>Gathering from İTÜ OBS...</span>
                  </>
                ) : (
                  <>
                    <span>Track CRN</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
