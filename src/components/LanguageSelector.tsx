import React from 'react';
import { Globe } from 'lucide-react';
import { AppLanguage } from '../types';

interface LanguageSelectorProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  variant?: 'header' | 'login' | 'profile';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onChangeLanguage,
  variant = 'header',
  className = ''
}) => {
  if (variant === 'login') {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 ${className}`}>
        <div className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <span>Dil Seçimi / Select Language</span>
        </div>
        <div className="inline-flex items-center p-1 bg-stone-100/90 rounded-full border border-stone-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => onChangeLanguage('tr')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              language === 'tr'
                ? 'bg-white text-stone-900 shadow-xs scale-102'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>🇹🇷</span>
            <span>Türkçe</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-white text-stone-900 shadow-xs scale-102'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={`grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200 ${className}`}>
        <button
          type="button"
          onClick={() => onChangeLanguage('tr')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'tr'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>🇹🇷</span>
          <span>Türkçe</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeLanguage('en')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>🇬🇧</span>
          <span>English</span>
        </button>
      </div>
    );
  }

  // variant === 'header'
  return (
    <div
      id="header-language-selector"
      className={`inline-flex items-center p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-bold shadow-2xs ${className}`}
      title="Dili Değiştir / Change Language"
    >
      <button
        type="button"
        onClick={() => onChangeLanguage('tr')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-xs ${
          language === 'tr'
            ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <span className="text-[11px]">🇹🇷</span>
        <span>TR</span>
      </button>
      <span className="text-stone-300 text-[10px] select-none">|</span>
      <button
        type="button"
        onClick={() => onChangeLanguage('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-xs ${
          language === 'en'
            ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
      >
        <span className="text-[11px]">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
