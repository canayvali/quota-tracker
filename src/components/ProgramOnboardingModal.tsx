import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  X,
  Check,
  Search,
  Info
} from 'lucide-react';
import { AppLanguage, ItuProgram, UserAccount } from '../types';
import { searchItuPrograms, findOrCreateProgram } from '../data/ituPrograms';

interface ProgramOnboardingModalProps {
  isOpen: boolean;
  currentUser?: UserAccount | null;
  initialPrograms?: ItuProgram[];
  onSavePrograms: (programs: ItuProgram[]) => void;
  onClose?: () => void;
  language?: AppLanguage;
}

export const ProgramOnboardingModal: React.FC<ProgramOnboardingModalProps> = ({
  isOpen,
  currentUser,
  initialPrograms,
  onSavePrograms,
  onClose,
  language = 'tr'
}) => {
  const [selectedPrograms, setSelectedPrograms] = useState<ItuProgram[]>(
    initialPrograms || currentUser?.enrolledPrograms || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const filteredPrograms = searchItuPrograms(searchQuery).filter(
    (p) => !selectedPrograms.some((sp) => sp.code === p.code)
  );

  const handleAddProgram = (prog: ItuProgram) => {
    if (!selectedPrograms.some((p) => p.code === prog.code)) {
      setSelectedPrograms([...selectedPrograms, prog]);
    }
    setSearchQuery('');
  };

  const handleRemoveProgram = (code: string) => {
    setSelectedPrograms(selectedPrograms.filter((p) => p.code !== code));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const prog = findOrCreateProgram(customInput.trim());
    handleAddProgram(prog);
    setCustomInput('');
  };

  const handleSave = () => {
    onSavePrograms(selectedPrograms);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
            <GraduationCap className="w-8 h-8 text-blue-100" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                {language === 'tr'
                  ? 'İTÜ Bölüm & Program Seçimi'
                  : 'Select Your ITU Programs'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-white/20 text-white rounded-full">
                {language === 'tr' ? 'Akıllı Kontenjan Filtresi' : 'Smart Major Filter'}
              </span>
            </div>
            <p className="text-sm text-blue-100 mt-1 leading-relaxed">
              {language === 'tr'
                ? 'Okuduğunuz bölüm veya yan dalı seçerek yalnızca sizin alabildiğiniz derslerin takibe eklenmesini sağlayın. Birden fazla bölüm (ÇAP / Yandal) ekleyebilirsiniz.'
                : 'Select your enrolled major or minor programs to automatically filter CRNs open to your department.'}
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800 dark:text-stone-200">
          {/* Selected Programs Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {language === 'tr'
                  ? `Seçilen Programlarınız (${selectedPrograms.length})`
                  : `Selected Programs (${selectedPrograms.length})`}
              </label>
              {selectedPrograms.length > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'tr' ? 'Kontenjanlar bu bölümlere göre taranacak' : 'Quota restricted to these'}
                </span>
              )}
            </div>

            {selectedPrograms.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/30 text-center text-sm text-stone-500 dark:text-stone-400">
                {language === 'tr'
                  ? 'Henüz bir bölüm seçmediniz. Aşağıdaki arama kutusundan bölümünüzü ekleyin.'
                  : 'No program selected yet. Search and add your department below.'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedPrograms.map((prog) => (
                  <div
                    key={prog.code}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-sm font-medium shadow-sm transition-all"
                  >
                    <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                      {prog.code}
                    </span>
                    <span>{prog.nameTr}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProgram(prog.code)}
                      className="p-0.5 text-blue-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
                      title={language === 'tr' ? 'Kaldır' : 'Remove'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search and Select */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {language === 'tr'
                ? 'İTÜ Program Kodları Listesinden Seçin'
                : 'Search & Pick from ITU Program Catalog'}
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'tr'
                    ? 'Örn: Çevre Mühendisliği, BLG, Sürdürülebilirlik, Makina...'
                    : 'e.g. Environmental Engineering, BLG, Sustainability...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-stone-100 placeholder-stone-400"
              />
            </div>

            {/* Quick Filter Candidates */}
            <div className="max-h-48 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-xl divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-800/80 shadow-inner">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.slice(0, 8).map((prog) => (
                  <button
                    key={prog.code}
                    type="button"
                    onClick={() => handleAddProgram(prog)}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 group-hover:bg-blue-200 group-hover:text-blue-800 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-100">
                        {prog.code}
                      </span>
                      <div className="truncate">
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {prog.nameTr}
                        </span>
                        {prog.faculty && (
                          <span className="text-xs text-stone-400 dark:text-stone-500 ml-2">
                            • {prog.faculty}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3.5 h-3.5" />
                      {language === 'tr' ? 'Ekle' : 'Add'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  {language === 'tr'
                    ? 'Eşleşen standart program bulunamadı. Aşağıdan özel olarak ekleyebilirsiniz.'
                    : 'No matching program found in list.'}
                </div>
              )}
            </div>
          </div>

          {/* Custom Program Input fallback */}
          <form onSubmit={handleAddCustom} className="pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={
                  language === 'tr'
                    ? 'Farklı bir program/yandal yazıp ekleyin...'
                    : 'Type a custom program / minor...'
                }
                className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 disabled:opacity-50 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'tr' ? 'Ekle' : 'Add'}
              </button>
            </div>
          </form>

          {/* Helpful Information box */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">
                {language === 'tr' ? 'Neden bu bilgiyi alıyoruz?' : 'Why is this required?'}
              </span>{' '}
              {language === 'tr'
                ? 'İTÜ ders kayıt sisteminde her şubenin (CRN) bölüm kısıtlamaları bulunur. Kayıtlı olduğunuz bölümler sayesinde sistem sadece alabildiğiniz şubeleri takip eder ve alamadığınız dersler için sizi uyarır.'
                : 'ITU OBS courses have major quotas and restrictions. Your registered programs ensure you monitor relevant sections and alerts.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {language === 'tr'
              ? 'Daha sonra Profil Ayarları sayfasından değiştirebilirsiniz.'
              : 'You can update this anytime in Profile Settings.'}
          </p>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {language === 'tr' ? 'Daha Sonra' : 'Later'}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              {language === 'tr' ? 'Kaydet ve Devam Et' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
