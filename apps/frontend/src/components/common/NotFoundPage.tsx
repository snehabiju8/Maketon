import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        404 Error
      </span>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 text-base text-slate-500 max-w-md">
        The page you are looking for does not exist or has been moved in Brightloop.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

