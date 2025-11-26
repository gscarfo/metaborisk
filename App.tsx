
import React, { useState, useEffect } from 'react';
import { Patient, AppView, User } from './types';
import { getPatients, savePatient, deletePatient } from './services/storageService';
import { generateClinicalSummary } from './services/geminiService';
import { getDbPool } from './services/db';
import PatientList from './components/PatientList';
import PatientForm from './components/PatientForm';
import ReportView from './components/ReportView';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import { Activity, LogOut, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check connection status
    const pool = getDbPool();
    setDbConnected(!!pool);
  }, []);

  // Load patients when user logs in
  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      loadPatients();
      setView(AppView.DASHBOARD);
    } else if (currentUser && currentUser.role === 'admin') {
      setView(AppView.ADMIN_DASHBOARD);
    }
  }, [currentUser]);

  const loadPatients = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getPatients(currentUser.id);
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPatients([]);
    setView(AppView.LOGIN);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handleSavePatient = async (patient: Patient) => {
    if (!currentUser) return;
    try {
      const saved = await savePatient(patient, currentUser.id);
      await loadPatients();
      setSelectedPatient(saved); 
      setView(AppView.DASHBOARD);
      setSelectedPatient(null);
    } catch (error) {
      console.error("Error saving patient", error);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!currentUser) return;
    try {
      await deletePatient(id, currentUser.id);
      await loadPatients();
    } catch (error) {
      console.error("Error deleting patient", error);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedPatient || !currentUser) return;
    setIsGeneratingAI(true);
    try {
      const summary = await generateClinicalSummary(selectedPatient);
      const updatedPatient = { ...selectedPatient, aiAnalysis: summary };
      await savePatient(updatedPatient, currentUser.id);
      setSelectedPatient(updatedPatient);
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    } catch (error) {
      console.error("Error generating AI summary", error);
      alert("Errore nella generazione dell'analisi AI.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // --- RENDER VIEWS ---

  if (view === AppView.LOGIN) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === AppView.ADMIN_DASHBOARD && currentUser) {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Loading Screen for Data Fetching
  if (loading && view !== AppView.REPORT && view !== AppView.FORM && view !== AppView.PROFILE) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-pulse text-medical" size={48} />
          <p>Caricamento database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Navbar for Authenticated Users */}
      {currentUser && (
        <nav className="bg-slate-900 text-white shadow-md print:hidden">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
              <Activity className="text-medical" />
              <span className="font-bold text-xl tracking-tight">MetaboRisk <span className="text-medical">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView(AppView.PROFILE)}
                className="flex items-center gap-2 hover:bg-slate-800 py-1.5 px-3 rounded-lg transition-colors"
              >
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold">{currentUser.firstName} {currentUser.lastName}</div>
                  <div className="text-xs text-slate-400">{currentUser.specialization || 'Medico'}</div>
                </div>
                <div className="bg-slate-700 p-2 rounded-full">
                  <UserCircle size={20} className="text-slate-300" />
                </div>
              </button>

              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="py-8">
        {view === AppView.DASHBOARD && (
          <PatientList 
            patients={patients} 
            onAdd={() => { setSelectedPatient(null); setView(AppView.FORM); }}
            onSelect={(p) => { setSelectedPatient(p); setView(AppView.REPORT); }}
            onEdit={(p) => { setSelectedPatient(p); setView(AppView.FORM); }}
            onDelete={handleDeletePatient}
          />
        )}

        {view === AppView.FORM && (
          <PatientForm 
            initialData={selectedPatient} 
            onSave={handleSavePatient}
            onCancel={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.REPORT && selectedPatient && (
          <ReportView 
            patient={selectedPatient}
            currentUser={currentUser} 
            onBack={() => setView(AppView.DASHBOARD)}
            onGenerateAI={handleGenerateAI}
            isGeneratingAI={isGeneratingAI}
          />
        )}

        {view === AppView.PROFILE && currentUser && (
          <UserProfile 
            user={currentUser}
            onUpdate={handleUpdateProfile}
            onCancel={() => setView(AppView.DASHBOARD)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
