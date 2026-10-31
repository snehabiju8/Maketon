import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

// Mirrors the role-protected routes in app/router.tsx
const STAFF_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/products", label: "Products" },
  { to: "/plans", label: "Plans" },
  { to: "/subscriptions", label: "Subscriptions" },
  { to: "/invoices", label: "Invoices" },
  { to: "/payments", label: "Payments" },
];

const CUSTOMER_LINKS = [{ to: "/portal", label: "My Profile" }];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleBadgeColor = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    INTERNAL: "bg-blue-100 text-blue-800 border-blue-200",
    CUSTOMER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }[user?.role || "CUSTOMER"];

  const links = user?.role === "CUSTOMER" ? CUSTOMER_LINKS : STAFF_LINKS;
  const navLinks = links.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      className={({ isActive }) =>
        `whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition ${
          isActive ? "text-indigo-700 bg-indigo-50" : "text-gray-700 hover:text-indigo-600"
        }`
      }
    >
      {link.label}
    </NavLink>
  ));

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                B
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">Brightloop</span>
            </Link>

            {user && <div className="hidden xl:flex space-x-1">{navLinks}</div>}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="hidden sm:inline max-w-[10rem] truncate text-sm font-medium text-gray-800">
                    {user.name}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleBadgeColor}`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-md border border-gray-300 hover:border-red-300 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-md shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
        {user && <div className="xl:hidden flex space-x-1 overflow-x-auto pb-2 -mx-1">{navLinks}</div>}
      </div>
    </nav>
  );
};
