import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const RegisterPage: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
        <UserPlus className="w-6 h-6" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Create an account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Customer self-service registration placeholder. Registration workflow will be connected to the backend auth module.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
        Status: <span className="font-semibold text-amber-600">Under Development</span>
        <br />
        Allows new customers to sign up and view subscription self-service features.
      </div>

      <div className="space-y-3 pt-2">
        <Link to="/login" className="block">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

