import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PlayerDashboard from "@/pages/PlayerDashboard";
import UploadVideoPage from "@/pages/UploadVideoPage";
import VideoHistoryPage from "@/pages/VideoHistoryPage";
import AnalysisResultPage from "@/pages/AnalysisResultPage";
import ProgressPage from "@/pages/ProgressPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import TutorialsPage from "@/pages/TutorialsPage";
import ProfilePage from "@/pages/ProfilePage";
import ChatPage from "@/pages/ChatPage";
import CoachDashboard from "@/pages/CoachDashboard";
import CoachPlayersPage from "@/pages/CoachPlayersPage";
import CoachFeedbackPage from "@/pages/CoachFeedbackPage";
import CoachTutorialsPage from "@/pages/CoachTutorialsPage";
import CoachSchedulePage from "@/pages/CoachSchedulePage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminReportsPage from "@/pages/AdminReportsPage";
import AdminMonitoringPage from "@/pages/AdminMonitoringPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'coach') return <Navigate to="/coach" />;
  return <Navigate to="/dashboard" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                {/* Player */}
                <Route path="/dashboard" element={<PlayerDashboard />} />
                <Route path="/upload" element={<UploadVideoPage />} />
                <Route path="/videos" element={<VideoHistoryPage />} />
                <Route path="/analysis/:videoId" element={<AnalysisResultPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/tutorials" element={<TutorialsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="/chat" element={<ChatPage />} />

                {/* Coach */}
                <Route path="/coach" element={<ProtectedRoute allowedRoles={['coach']}><CoachDashboard /></ProtectedRoute>} />
                <Route path="/coach/players" element={<ProtectedRoute allowedRoles={['coach']}><CoachPlayersPage /></ProtectedRoute>} />
                <Route path="/coach/players/:id" element={<ProtectedRoute allowedRoles={['coach']}><CoachPlayersPage /></ProtectedRoute>} />
                <Route path="/coach/feedback" element={<ProtectedRoute allowedRoles={['coach']}><CoachFeedbackPage /></ProtectedRoute>} />
                <Route path="/coach/tutorials" element={<ProtectedRoute allowedRoles={['coach']}><CoachTutorialsPage /></ProtectedRoute>} />
                <Route path="/coach/schedule" element={<ProtectedRoute allowedRoles={['coach']}><CoachSchedulePage /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
                <Route path="/admin/tutorials" element={<ProtectedRoute allowedRoles={['admin']}><TutorialsPage /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
                <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['admin']}><AdminMonitoringPage /></ProtectedRoute>} />
              </Route>

              <Route path="/home" element={<RoleRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
