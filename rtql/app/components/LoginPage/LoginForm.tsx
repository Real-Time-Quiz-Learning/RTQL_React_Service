import React, { useState, useEffect } from 'react';
import AuthHeader from './AuthHeader';
import InputField from './InputField';
import { useNavigate } from 'react-router-dom';

const AUTH_API_BASE = import.meta.env.VITE_BACKEND_API_BASE;

interface LoginFormProps { onSwitch?: () => void }

const LoginForm: React.FC<LoginFormProps> = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, pass: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `login failed (${res.status})`);
      }
      let token = await res.json();
      localStorage.setItem('token', JSON.stringify(token));
      // On success, navigate to apps main page
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  // Only render form content after initial mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <AuthHeader
        title="Sign in to your account"
        subtitle="New to RTQL?"
        linkText="Sign up"
        linkTo="/signup"
        onSwitch={onSwitch}
      />

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <InputField
            id="login-email"
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            isTop
          />
          <InputField
            id="login-password"
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            isBottom
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </a>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </>
  );
};

export default LoginForm;