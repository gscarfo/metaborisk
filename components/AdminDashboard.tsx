import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getAllUsers, createUser, updateUserStatus, changeUserPassword } from '../services/authService';
import { Shield, UserPlus, Calendar, Ban, CheckCircle, RefreshCw, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      setShowAddModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Errore creazione utente');
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.role === 'admin') return;
    await updateUserStatus(user.id, !user.isActive, user.expiresAt);
    loadUsers();
  };

  const handleSetExpiry = async (user: User, date: string) => {
    if (user.role === 'admin') return;
    // If date is empty string, set to null (no expiry)
    const newDate = date ? new Date(date).toISOString() : null;
    await updateUserStatus(user.id, user.isActive, newDate);
    loadUsers();
  };

  const inputClass = "w-full p-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-medical outline-none";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-400" />
            <h1 className="font-bold text-lg">Pannello Amministrazione</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Loggato come {currentUser.username}</span>
            <button onClick={onLogout} className="text-sm bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Gestione Utenti</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-medical text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <UserPlus size={18} />
            Crea Nuovo Medico
          </button>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Utente</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Ruolo</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Stato</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Scadenza Abbonamento</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className={!user.isActive ? 'bg-slate-50 opacity-75' : ''}>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{user.username}</span>
                    <div className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={14} /> Attivo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                        <Ban size={14} /> Disattivato
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="text-slate-400 text-sm">Illimitato</span>
                    ) : (
                      <div className="flex items-center gap-2">
                         <input 
                           type="date" 
                           className="text-sm p-1 border rounded bg-white"
                           value={user.expiresAt ? user.expiresAt.split('T')[0] : ''}
                           onChange={(e) => handleSetExpiry(user, e.target.value)}
                         />
                         {user.expiresAt && new Date(user.expiresAt) < new Date() && (
                           <span className="text-xs text-red-500 font-bold">SCADUTO</span>
                         )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className={`text-sm px-3 py-1 rounded border ${user.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {user.isActive ? 'Disattiva' : 'Riattiva'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Aggiungi Medico</h3>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Username</label>
                <input required type="text" className={inputClass} value={newUsername} onChange={e => setNewUsername(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Password</label>
                <input required type="text" className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-medical text-white rounded hover:bg-blue-700">Crea Utente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;