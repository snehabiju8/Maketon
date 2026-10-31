import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ApiError } from "@/lib/api-client";
import { UserPlus } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // FR-A3 Password complexity rules
  const isMinLength = password.length >= 9;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isPasswordValid) {
      setLocalError("Please satisfy all password complexity requirements.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name,
        email,
        password,
        phone: phone || undefined,
        billingAddress: billingAddress || undefined,
      });
      navigate("/portal");
    } catch (err) {
      if (err instanceof ApiError) {
        setLocalError(err.message);
      } else {
        setLocalError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Create Customer Account</h2>
        <p className="text-xs text-slate-500">
          Register to view subscriptions and invoices
        </p>
      </div>

      {localError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
          {localError}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Customer / Company Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Acme Corp"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email address *
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="billing@acme.com"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Password *
          </label>
          <input
            id="reg-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {/* FR-A3 Password validation checklist */}
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
            <span className={isMinLength ? "text-emerald-600 font-semibold" : ""}>
              {isMinLength ? "✓" : "•"} Min 9 characters
            </span>
            <span className={hasUpper ? "text-emerald-600 font-semibold" : ""}>
              {hasUpper ? "✓" : "•"} Uppercase letter
            </span>
            <span className={hasLower ? "text-emerald-600 font-semibold" : ""}>
              {hasLower ? "✓" : "•"} Lowercase letter
            </span>
            <span className={hasSpecial ? "text-emerald-600 font-semibold" : ""}>
              {hasSpecial ? "✓" : "•"} Special character
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Phone number (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Billing Address (optional)
          </label>
          <textarea
            id="address"
            rows={2}
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="123 Tech Park, Bangalore"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
