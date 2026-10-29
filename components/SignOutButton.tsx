'use client';

import { useState } from 'react';

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoading(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
    }

    if (typeof document !== 'undefined') {
      document.cookie = 'auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';
      document.cookie = 'mock_user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';
    }

    window.location.href = '/login';
  };

  return (
    <form action="/api/auth/logout" method="POST" onSubmit={handleSignOut} className="inline-block m-0 p-0">
      <button
        type="submit"
        disabled={loading}
        className="text-sm font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 transition-colors"
      >
        {loading ? 'Signing out...' : 'Sign Out'}
      </button>
    </form>
  );
}

export default SignOutButton;
