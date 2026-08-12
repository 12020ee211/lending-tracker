import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoanProvider } from "./context/LoanContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import LoanList from "./pages/LoanList";
import LoanForm from "./pages/LoanForm";
import LoanDetail from "./pages/LoanDetail";
import AdminPage from "./pages/AdminPage";

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <LoanProvider>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/loans" element={<LoanList />} />
                  <Route path="/loans/:id" element={<LoanDetail />} />
                  <Route path="/loans/:id/edit" element={<LoanForm />} />
                  <Route path="/add-loan" element={<LoanForm />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </LoanProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
