import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { CustomersPage } from "../features/customers/pages/CustomersPage";
import { CustomerProfilePage } from "../features/customers/pages/CustomerProfilePage";
import { useAuth } from "../features/auth/hooks/useAuth";

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "CUSTOMER") {
    return <Navigate to="/portal/profile" replace />;
  }

  return <Navigate to="/admin/customers" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root smart redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated Dashboard / Portal routes */}
      <Route element={<DashboardLayout />}>
        {/* Admin and Internal Staff routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN", "INTERNAL"]} />}>
          <Route path="/admin/customers" element={<CustomersPage />} />
        </Route>

        {/* Customer Self-Service Portal routes */}
        <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
          <Route path="/portal/profile" element={<CustomerProfilePage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
