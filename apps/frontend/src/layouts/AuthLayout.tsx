import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If already logged in, redirect away from login/register
  if (user) {
    if (user.role === "CUSTOMER") {
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/customers" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
            B
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Brightloop
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Subscription Management & Billing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
