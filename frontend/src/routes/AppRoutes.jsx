import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PatientDashboard from "../pages/patient/PatientDashboard";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import ReviewerDashboard from "../pages/ReviewerDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProtectedRoute from "../components/common/ProtectedRoute";

// New placeholder pages
import NewRequestPage from "../pages/patient/NewRequestPage";
import RequestDetailPage from "../pages/patient/RequestDetailPage";
import RequestHistoryPage from "../pages/patient/RequestHistoryPage";
import PrescriptionsPage from "../pages/patient/PrescriptionsPage";
import PendingVerificationPage from "../pages/doctor/PendingVerificationPage";
import CredentialUploadPage from "../pages/doctor/CredentialUploadPage";
import QueuePage from "../pages/doctor/QueuePage";
import FacilityQueuePage from "../pages/doctor/FacilityQueuePage";
import ConsultationPage from "../pages/doctor/ConsultationPage";
import LeaderboardPage from "../pages/doctor/LeaderboardPage";
import ProfilePage from "../pages/doctor/ProfilePage";
import DoctorVerificationPage from "../pages/admin/DoctorVerificationPage";
import HeatmapPage from "../pages/admin/HeatmapPage";
import UsersPage from "../pages/admin/UsersPage";
import StockPage from "../pages/admin/StockPage";
import FacilitiesPage from "../pages/admin/FacilitiesPage";
import FacilityDoctorsPage from "../pages/admin/FacilityDoctorsPage";
import FacilityQueueAssignPage from "../pages/admin/FacilityQueueAssignPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Patient Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                        <PatientDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/patient/new-request"
                element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                        <NewRequestPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/patient/request/:id"
                element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                        <RequestDetailPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/patient/history"
                element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                        <RequestHistoryPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/patient/prescriptions"
                element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                        <PrescriptionsPage />
                    </ProtectedRoute>
                }
            />

            {/* Doctor Routes */}
            <Route
                path="/doctor/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <DoctorDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/pending-verification"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <PendingVerificationPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/credentials"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <CredentialUploadPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/queue"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <QueuePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/queue/facility"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <FacilityQueuePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/consult/:requestId"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <ConsultationPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/leaderboard"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <LeaderboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/doctor/profile"
                element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />

            {/* Reviewer Routes */}
            <Route
                path="/reviewer/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["hitl_reviewer"]}>
                        <ReviewerDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/verify-doctors"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <DoctorVerificationPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/heatmap"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <HeatmapPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <UsersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/stock"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <StockPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/facilities"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <FacilitiesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/facility-doctors"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <FacilityDoctorsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/facility-queue-assign"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <FacilityQueueAssignPage />
                    </ProtectedRoute>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
