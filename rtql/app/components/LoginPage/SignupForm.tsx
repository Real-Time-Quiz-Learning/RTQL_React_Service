import React, { useState, useEffect } from 'react';
import AuthHeader from './AuthHeader';
import InputField from './InputField';
import { useNavigate } from 'react-router-dom';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE;

interface SignupFormProps { onSwitch?: () => void }

const SignupForm: React.FC<SignupFormProps> = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fname:firstName, lname:lastName, email:email, pass:password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Signup failed (${res.status})`);
      }
      // On success, navigate to the post-auth page (home by default)
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Signup Failed');
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
        title="Create a new account"
        subtitle="Already registered?"
        linkText="Sign in"
        linkTo="/login"
        onSwitch={onSwitch}
      />

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <InputField
            id="firstName"
            label="First name"
            name="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            isTop
          />
          <InputField
            id="lastName"
            label="Last name"
            name="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <InputField
            id="email"
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            id="password"
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputField
            id="confirm"
            label="Confirm password"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            isBottom
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </div>
      </form>
    </>
  );
};

export default SignupForm;
