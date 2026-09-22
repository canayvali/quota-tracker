import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  hasLeftLockIcon?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  className = '',
  inputClassName = '',
  autoFocus = false,
  disabled = false,
  hasLeftLockIcon = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Global safety: if the user clicks down, drags away, and releases anywhere on window, hide immediately
  useEffect(() => {
    if (!isVisible) return;

    const handleGlobalRelease = () => {
      setIsVisible(false);
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
    };
  }, [isVisible]);

  const handlePressStart = (e?: React.SyntheticEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    setIsVisible(true);
  };

  const handlePressEnd = () => {
    setIsVisible(false);
  };

  return (
    <div className={`relative ${className}`}>
      {hasLeftLockIcon && (
        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 pointer-events-none" />
      )}
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full ${
          hasLeftLockIcon ? 'pl-9' : 'pl-3.5'
        } pr-10 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-mono tracking-wide ${inputClassName}`}
      />
      <button
        type="button"
        id={id ? `${id}-show-btn` : 'show-password-btn'}
        aria-label="Press and hold to show password"
        title="Press and hold to show password (hides on release)"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            handlePressStart(e);
          }
        }}
        onKeyUp={handlePressEnd}
        onBlur={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute right-2.5 top-2 p-1 rounded-md transition-all cursor-pointer select-none ${
          isVisible
            ? 'text-amber-800 bg-amber-100 ring-2 ring-amber-400/50 scale-105'
            : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-95'
        }`}
      >
        {isVisible ? (
          <Eye className="h-4 w-4 text-amber-700" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
