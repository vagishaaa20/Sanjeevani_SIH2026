import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './hooks/LanguageContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ClinicProfile from './pages/clinic/ClinicProfile';
import DepartmentManager from './pages/clinic/DepartmentManager';
import ClinicApprovalList from './pages/admin/ClinicApprovalList';
import DoctorApprovalList from './pages/admin/DoctorApprovalList';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DocumentUpload from './pages/doctor/DocumentUpload';
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import AiTriage from './pages/patient/AiTriage';
import PatientConsultations from './pages/patient/PatientConsultations';
import PatientSubsidy from './pages/patient/PatientSubsidy';
import MedicineAvailability from './pages/patient/MedicineAvailability';
import HeatmapView from './pages/patient/HeatmapView';
import PatientRequests from './pages/patient/PatientRequests';
import TeleconsultationRoom from './pages/shared/TeleconsultationRoom';
import AdminOutbreakPanel from './pages/admin/AdminOutbreakPanel';
import MedicineInventory from './pages/clinic/MedicineInventory';

// Main layout wrapper that includes sidebar and navbar for authenticated users
const AppLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-col md:flex-row flex-grow">
                <Sidebar />
                <main className="flex-grow p-6 md:p-8 bg-cream-bg">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <NotificationProvider>
                        <div className="app-container min-h-screen bg-cream-bg flex flex-col">
                            <LanguageProvider>
                                <Routes>
                                    {/* Public Auth Routes */}
                                    <Route path="/login" element={
                                        <>
                                            <Navbar />
                                            <Login />
                                        </>
                                    } />
                                    <Route path="/register" element={
                                        <>
                                            <Navbar />
                                            <Register />
                                        </>
                                    } />

                                    {/* Dashboard Guards */}
                                    <Route
                                        path="/admin/clinics"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin']}>
                                                <AppLayout>
                                                    <ClinicApprovalList />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/admin/doctors"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin']}>
                                                <AppLayout>
                                                    <DoctorApprovalList />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/admin/outbreaks"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin']}>
                                                <AppLayout>
                                                    <AdminOutbreakPanel />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/clinic/profile"
                                        element={
                                            <ProtectedRoute allowedRoles={['clinic_admin']}>
                                                <AppLayout>
                                                    <ClinicProfile />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/clinic/departments"
                                        element={
                                            <ProtectedRoute allowedRoles={['clinic_admin']}>
                                                <AppLayout>
                                                    <DepartmentManager />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/doctor/dashboard"
                                        element={
                                            <ProtectedRoute allowedRoles={['doctor']}>
                                                <AppLayout>
                                                    <DoctorDashboard />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />
                                <Route
                                    path="/clinic/medicine-inventory"
                                    element={
                                        <ProtectedRoute allowedRoles={['clinic_admin']}>
                                            <AppLayout>
                                                <MedicineInventory />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/doctor/dashboard"
                                    element={
                                        <ProtectedRoute allowedRoles={['doctor']}>
                                            <AppLayout>
                                                <DoctorDashboard />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                    <Route
                                        path="/doctor/documents"
                                        element={
                                            <ProtectedRoute allowedRoles={['doctor']}>
                                                <AppLayout>
                                                    <DocumentUpload />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/doctor/consultation/:id/room"
                                        element={
                                            <ProtectedRoute allowedRoles={['doctor']}>
                                                <AppLayout>
                                                    <TeleconsultationRoom />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/dashboard"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <PatientDashboard />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/book-appointment"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <BookAppointment />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/ai-triage"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <AiTriage />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/consultations"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <PatientConsultations />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/requests"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <PatientRequests />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/subsidy"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <PatientSubsidy />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/patient/heatmap"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <HeatmapView />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />
                                <Route
                                    path="/patient/medicine-availability"
                                    element={
                                        <ProtectedRoute allowedRoles={['patient']}>
                                            <AppLayout>
                                                <MedicineAvailability />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/patient/heatmap"
                                    element={
                                        <ProtectedRoute allowedRoles={['patient']}>
                                            <AppLayout>
                                                <HeatmapView />
                                            </AppLayout>
                                        </ProtectedRoute>
                                    }
                                />

                                    <Route
                                        path="/patient/consultation/:id/room"
                                        element={
                                            <ProtectedRoute allowedRoles={['patient']}>
                                                <AppLayout>
                                                    <TeleconsultationRoom />
                                                </AppLayout>
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* Catch-all navigation */}
                                    <Route path="*" element={<Navigate to="/login" replace />} />
                                </Routes>
                            </LanguageProvider>
                        </div>
                    </NotificationProvider>
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
