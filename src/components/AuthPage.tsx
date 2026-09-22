import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogIn,
  Mail,
  Shield,
  Sparkles,
  User,
  UserPlus
} from 'lucide-react';
import { UserAccount } from '../types';
import { loadUsers, saveUsers } from '../utils/storage';
import { PasswordInput } from './PasswordInput';

interface AuthPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  onNavigateToAdmin?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onNavigateToAdmin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('ahmetcanayvali@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    const users = loadUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email);

    if (!existing) {
      setError('No account found with this email. Please check your credentials or create a new account.');
      return;
    }

    if (existing.password && existing.password !== password) {
      setError('Incorrect password. Please try again.');
      return;
    }

    // Update last login
    const updatedUser: UserAccount = {
      ...existing,
      lastLoginAt: new Date().toISOString()
    };
    const updatedList = users.map((u) => (u.id === existing.id ? updatedUser : u));
    saveUsers(updatedList);

    onLoginSuccess(updatedUser);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword.trim();
    const confirm = signupConfirmPassword.trim();

    if (!name) {
      setError('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid student notification email.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setError('An account with this email already exists. Please switch to Sign In.');
      return;
    }

    const newUser: UserAccount = {
      id: 'user-' + Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    setSuccessMsg('Account created successfully! Logging you in...');

    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    const users = loadUsers();
    const demo = users[0] || {
      id: 'user-itu-1',
      name: 'Ahmet Can Ayvalı',
      email: 'ahmetcanayvali@gmail.com',
      password: 'password123',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    onLoginSuccess(demo);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Quota Tracker</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Student Portal Login
        </h1>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Sign in or create an account to start tracking CRN quotas. Alert emails will be sent directly to your registered account.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200/90 rounded-2xl sm:px-8 space-y-5">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl">
            <button
              id="tab-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    placeholder="student@itu.edu.tr"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Password
                </label>
                <PasswordInput
                  id="signin-password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Tracker</span>
              </button>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Quick testing?</span>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="font-semibold text-amber-700 hover:text-amber-800 underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>One-click Demo Login</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="e.g. Ahmet Can Ayvalı"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Notification Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="e.g. ahmetcanayvali@gmail.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  All seat opening alerts will be delivered directly to this email address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Password
                </label>
                <PasswordInput
                  id="signup-password"
                  required
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Confirm Password
                </label>
                <PasswordInput
                  id="signup-confirm"
                  required
                  placeholder="Re-enter password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Student Account</span>
              </button>
            </form>
          )}

          <div className="text-[11px] text-stone-400 text-center pt-2">
            Accounts are safely stored in your browser workspace and will connect to a persistent database in production.
          </div>
        </div>

        {/* Footer Admin link */}
        {onNavigateToAdmin && (
          <div className="mt-4 text-center">
            <button
              onClick={onNavigateToAdmin}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Shield className="h-3 w-3 text-stone-400" />
              <span>Are you an administrator? Go to /admin</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
