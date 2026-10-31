import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const LoginPage: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
        <LogIn className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Authentication page placeholder. Login logic and credentials form will be integrated in future steps.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
        Status: <span className="font-semibold text-amber-600">Under Development</span>
        <br />
        Role-based authentication will support Admin, Staff, and Customer logins.
      </div>

      <div className="space-y-3 pt-2">
        <Link to="/dashboard" className="block">
          <Button variant="primary" className="w-full">
            Enter Dashboard (Dev Preview)
          </Button>
        </Link>
        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

