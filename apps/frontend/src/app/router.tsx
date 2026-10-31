import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { ProductsPage } from "@/features/products/ProductsPage";
import { PlansPage } from "@/features/plans/PlansPage";
import { SubscriptionsPage } from "@/features/subscriptions/SubscriptionsPage";
import { InvoicesPage } from "@/features/invoices/InvoicesPage";
import { PaymentsPage } from "@/features/payments/PaymentsPage";
import { CustomerPortalPage } from "@/features/portal/CustomerPortalPage";
import { NotFoundPage } from "@/components/common/NotFoundPage";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export const router = createBrowserRouter([
  // Redirect root to dashboard or portal based on auth
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },

  // Public Auth routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },

  // Protected Core Application Routes
  {
    element: <DashboardLayout />,
    children: [
      // Operational routes (ADMIN and INTERNAL only)
      {
        element: <ProtectedRoute allowedRoles={["ADMIN", "INTERNAL"]} />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/customers",
            element: <CustomersPage />,
          },
          {
            path: "/products",
            element: <ProductsPage />,
          },
          {
            path: "/plans",
            element: <PlansPage />,
          },
          {
            path: "/subscriptions",
            element: <SubscriptionsPage />,
          },
          {
            path: "/invoices",
            element: <InvoicesPage />,
          },
          {
            path: "/payments",
            element: <PaymentsPage />,
          },
        ],
      },

      // Customer Self-Service Portal (CUSTOMER only)
      {
        element: <ProtectedRoute allowedRoles={["CUSTOMER"]} />,
        children: [
          {
            path: "/portal",
            element: <CustomerPortalPage />,
          },
        ],
      },
    ],
  },

  // 404 catch-all
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
