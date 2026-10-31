import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../../../lib/api-client";

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

  // Password rule checks
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
      navigate("/portal/profile");
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Create Customer Account</h3>
        <p className="text-xs text-gray-500">Register to manage your subscriptions and billing</p>
      </div>

      {localError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
          {localError}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-gray-700">
          Customer or Company Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Acme Innovations Ltd"
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-xs font-medium text-gray-700">
          Email address *
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="billing@acme.com"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-xs font-medium text-gray-700">
          Password *
        </label>
        <input
          id="reg-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        {/* Password complexity checklist */}
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
        <label htmlFor="phone" className="block text-xs font-medium text-gray-700">
          Phone number (optional)
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="+91 9876543210"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-xs font-medium text-gray-700">
          Billing address (optional)
        </label>
        <textarea
          id="address"
          rows={2}
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="123 Tech Park, Bangalore"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </div>

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign In here
          </Link>
        </p>
      </div>
    </form>
  );
};
