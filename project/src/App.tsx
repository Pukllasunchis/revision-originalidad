import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RequestForm from './components/RequestForm';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const [showAdmin, setShowAdmin] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (showAdmin) {
    if (!user) {
      return <Login />;
    }
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img
                src="/logo-iesp-pukllasunchis.png"
                alt="EESP Pukllasunchis"
                className="h-16"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Revisión de Originalidad y Escritura con IA
                </h1>
                <p className="text-gray-600">
                  EESP Pukllasunchis - Sistema de Solicitudes
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Acceder al panel de administración"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Solicitud de Revisión
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Complete el siguiente formulario para solicitar la revisión de porcentaje de
            originalidad y porcentaje de escritura con IA de su trabajo de investigación o
            tesis.
          </p>
        </div>

        <RequestForm />
      </main>

      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            EESP Pukllasunchis - Sistema de Revisión de Originalidad
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
