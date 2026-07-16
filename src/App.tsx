import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import UploadPage from "@/pages/dashboard/UploadPage";
import AnalysisPage from "@/pages/dashboard/AnalysisPage";
import CrisprRecommendationsPage from "@/pages/dashboard/CrisprRecommendationsPage";
import DiseaseLibraryPage from "@/pages/dashboard/DiseaseLibraryPage";
import ReportsPage from "@/pages/dashboard/ReportsPage";
import ResearchPage from "@/pages/dashboard/ResearchPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import HelpPage from "@/pages/dashboard/HelpPage";
import AdminPage from "@/pages/dashboard/AdminPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes share the split-screen AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Authenticated app routes require a signed-in session, and share
              the sidebar/topbar AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/crispr-recommendations" element={<CrisprRecommendationsPage />} />
              <Route path="/disease-library" element={<DiseaseLibraryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;