import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { router } from "./router";

// app/router.tsx is the single route table for every module (staff pages and customer portal).
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
