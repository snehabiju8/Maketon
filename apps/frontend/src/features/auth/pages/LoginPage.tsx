import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../../../lib/api-client";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setLocalError(err.message);
      } else {
        setLocalError("Invalid credentials or server unavailable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Sign In to Your Account</h3>
        <p className="text-xs text-gray-500">Access your subscriptions, invoices, and operations</p>
      </div>

      {localError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {localError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="admin@brightloop.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </div>

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          New Customer?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
};
