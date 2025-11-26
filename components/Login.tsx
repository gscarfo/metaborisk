
import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { User } from '../types';
import { Activity, Lock, User as UserIcon, ArrowRight, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Login fallito');
      }
    } catch (err) {
      setError('Si è verificato un errore.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!regFirstName || !regLastName || !regUsername || !regPassword) {
      setError("Tutti i campi sono obbligatori.");
      setLoading(false);
      return;
    }

    try {
      const result = await register(regFirstName, regLastName, regUsername, regPassword);
      if (result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Registrazione fallita');
      }
    } catch (err) {
      setError('Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 pl-10 bg-white text-slate-900 border rounded-lg focus:ring-2 focus:ring-medical focus:border-medical outline-none placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-medical text-white p-3 rounded-xl shadow-lg mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MetaboRisk Pro</h1>
          <p className="text-slate-500 text-sm">
            {isRegistering ? 'Registrazione Medico' : 'Accesso Riservato'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 mb-6">
            {error}
          </div>
        )}

        {!isRegistering ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Nome Utente" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'} <ArrowRight size={18} />
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-2">Non hai un account?</p>
              <button 
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-medical font-medium hover:underline text-sm"
              >
                Registrati come Medico
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nome" 
                  value={regFirstName}
                  onChange={e => setRegFirstName(e.target.value)}
                  className="w-full p-3 bg-white text-slate-900 border rounded-lg focus:ring-2 focus:ring-medical outline-none"
                  required
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cognome" 
                  value={regLastName}
                  onChange={e => setRegLastName(e.target.value)}
                  className="w-full p-3 bg-white text-slate-900 border rounded-lg focus:ring-2 focus:ring-medical outline-none"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Nome Utente (Login)" 
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-medical text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? 'Registrazione...' : 'Crea Account'} <UserPlus size={18} />
            </button>

             <div className="text-center pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-slate-500 hover:text-slate-800 text-sm"
              >
                Torna al Login
              </button>
            </div>
          </form>
        )}
        
        <p className="text-center text-xs text-slate-400 mt-8">
          Versione Professionale v1.3
        </p>
      </div>
    </div>
  );
};

export default Login;
