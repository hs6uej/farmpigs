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
              {t('auth.username') || 'Username or Email'}
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
