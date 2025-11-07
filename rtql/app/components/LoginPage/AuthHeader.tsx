import React from 'react';
import { Link } from 'react-router-dom';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  linkText: string;
  linkTo: string;
  onSwitch?: () => void;
}

/**
 * AuthHeader: Displays the main heading and the secondary link 
 * (e.g., "Sign in to your account" and "Or sign up here").
 */
const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, linkText, linkTo, onSwitch }) => (
  <div className="mb-8">
    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {title}
    </h2>
    <p className="mt-2 text-center text-sm text-gray-600">
      {subtitle}{' '}
      {onSwitch ? (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitch();
          }}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {linkText}
        </a>
      ) : (
        <Link to={linkTo} className="font-medium text-indigo-600 hover:text-indigo-500">
          {linkText}
        </Link>
      )}
    </p>
  </div>
);

export default AuthHeader;