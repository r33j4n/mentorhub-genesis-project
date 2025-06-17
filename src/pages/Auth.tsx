
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MentorHub</h1>
          <p className="text-gray-600">Connect with expert mentors worldwide</p>
        </div>
        
        <AuthForm mode={mode} />
        
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            variant="ghost"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Create Account' : 'Sign In'}
          </Button>
          <div className="mt-4">
            <Link to="/" className="text-sm text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
