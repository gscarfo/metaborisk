
import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/authService';
import { UserCircle, Mail, Phone, Award, Briefcase, Save, ArrowLeft } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onCancel: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    title: user.title || '',
    specialization: user.specialization || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Check if we are in Offline/Mock mode
      if (user.id.startsWith('mock-')) {
         // Simulate local update
         const updatedUser = { ...user, ...formData };
         onUpdate(updatedUser);
         setSuccess('Profilo aggiornato (Modalità Offline/Locale)');
         setTimeout(() => setSuccess(''), 3000);
         setSaving(false);
         return;
      }

      const updatedUser = await updateUserProfile(user.id, formData);
      onUpdate(updatedUser);
      setSuccess('Profilo aggiornato con successo!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Errore durante l\'aggiornamento del profilo. Verifica la connessione.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medical focus:border-medical outline-none placeholder:text-slate-400";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-slate-800">Il Mio Profilo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <UserCircle size={64} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user.username}</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase text-xs font-bold mt-2">
              {user.role}
            </span>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="text-sm">
                <span className="block text-slate-500 text-xs uppercase tracking-wide">Iscritto dal</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
             </div>
             {user.expiresAt && (
               <div className="text-sm">
                  <span className="block text-slate-500 text-xs uppercase tracking-wide">Scadenza</span>
                  <span className="font-medium">{new Date(user.expiresAt).toLocaleDateString()}</span>
               </div>
             )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 pb-2 border-b">Modifica Informazioni</h2>
          
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-medium">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}><UserCircle size={16} /> Nome</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="Nome" />
              </div>
              <div>
                <label className={labelClass}><UserCircle size={16} /> Cognome</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Cognome" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}><Award size={16} /> Titolo (es. Dott, Prof)</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Dr." />
              </div>
              <div>
                <label className={labelClass}><Briefcase size={16} /> Specializzazione</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className={inputClass} placeholder="Nutrizionista" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}><Mail size={16} /> Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="email@esempio.com" />
              </div>
              <div>
                <label className={labelClass}><Phone size={16} /> Telefono</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+39 ..." />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-medical hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
