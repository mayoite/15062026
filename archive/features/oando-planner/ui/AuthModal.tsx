import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LoginForm } from '@/features/shared/auth/components/LoginPage';
import { SignupForm } from '@/features/shared/auth/components/SignupPage';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'signup';
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, defaultView = 'login', onSuccess }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(defaultView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[color:var(--color-surface,#ffffff)] dark:bg-gray-900 border border-[color:var(--border-soft,#e5e7eb)] dark:border-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="mb-6 space-y-1.5 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {view === 'login' ? 'Welcome back' : 'Save your workspace'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === 'login'
              ? 'Sign in to access your saved plans.'
              : 'Create a free account to save your 3D layout.'}
          </p>
        </div>

        {view === 'login' ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <SignupForm onSuccess={onSuccess} />
        )}

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {view === 'login' ? (
            <>
              Need an account?{' '}
              <button
                onClick={() => setView('signup')}
                className="font-medium text-[color:var(--color-blueprint-strong,#3b82f6)] hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setView('login')}
                className="font-medium text-[color:var(--color-blueprint-strong,#3b82f6)] hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
