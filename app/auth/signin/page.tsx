'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function SignInPage() {
  const t = useTranslations();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'warning' | 'error' | 'locked'>('error');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRemainingAttempts(null);
    setErrorType('error');

    try {
      // Step 1: Check credentials via custom API (handles locking & counting)
      const checkResponse = await fetch('/api/auth/check-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        // Handle different error types from our custom API
        switch (checkResult.error) {
          case 'ACCOUNT_LOCKED':
            setErrorType('locked');
            setError(t('auth.accountLocked') || 'บัญชีของคุณถูกล็อค กรุณาติดต่อผู้ดูแลระบบเพื่อปลดล็อค');
            break;
          case 'ACCOUNT_LOCKED_NOW':
            setErrorType('locked');
            setRemainingAttempts(0);
            setError(t('auth.accountLockedNow') || 'บัญชีของคุณถูกล็อคเนื่องจากใส่รหัสผ่านผิดหลายครั้งเกินไป กรุณาติดต่อผู้ดูแลระบบ');
            break;
          case 'INVALID_PASSWORD':
            const remaining = checkResult.remainingAttempts || 0;
            setRemainingAttempts(remaining);
            setErrorType(remaining <= 2 ? 'warning' : 'error');
            setError(t('auth.invalidPassword') || 'รหัสผ่านไม่ถูกต้อง');
            break;
          case 'INVALID_CREDENTIALS':
            setErrorType('error');
            setError(t('auth.invalidCredentials') || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            break;
          default:
            setErrorType('error');
            setError(checkResult.message || t('auth.somethingWentWrong') || 'เกิดข้อผิดพลาด');
        }
        setLoading(false);
        return;
      }

      // Step 2: If credentials valid, proceed with NextAuth signIn
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // This shouldn't happen if check-credentials passed
        setError(t('auth.somethingWentWrong') || 'เกิดข้อผิดพลาด');
        setErrorType('error');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('auth.somethingWentWrong') || 'Something went wrong');
      setErrorType('error');
      setLoading(false);
    }
  };

  const getErrorClasses = () => {
    switch (errorType) {
      case 'locked':
        return 'bg-red-500/30 border-red-500/50 text-red-100';
      case 'warning':
        return 'bg-yellow-500/30 border-yellow-500/50 text-yellow-100';
      default:
        return 'bg-red-500/20 border-red-500/30 text-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Glassmorphism card */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🐷 {t('common.appName')}
          </h1>
          <p className="text-gray-300">{t('auth.signIn')}</p>
        </div>

        {error && (
          <div className={`mb-4 p-3 backdrop-blur-sm border rounded-lg ${getErrorClasses()}`}>
            <div className="flex items-start gap-2">
              {errorType === 'locked' && (
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {errorType === 'warning' && (
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <p>{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-sm mt-1 opacity-80">
                    {t('auth.remainingAttempts') || 'จำนวนครั้งที่เหลือ'}: {remainingAttempts}
                  </p>
                )}
                {errorType === 'locked' && (
                  <p className="text-sm mt-2 opacity-80">
                    📧 {t('auth.contactAdmin') || 'กรุณาติดต่อผู้ดูแลระบบเพื่อปลดล็อคบัญชี'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {t('auth.username') || 'Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none transition-all"
              placeholder="username"
              required
              disabled={errorType === 'locked'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none transition-all"
              placeholder="••••••••"
              required
              disabled={errorType === 'locked'}
            />
          </div>

          <button
            type="submit"
            disabled={loading || errorType === 'locked'}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
          >
            {loading ? t('common.loading') : t('auth.signIn')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-600 text-gray-100">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('auth.signInWith')} {t('auth.google')}
          </button>

          <button
            onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
            className="w-full py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t('auth.signInWith')} {t('auth.facebook')}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
