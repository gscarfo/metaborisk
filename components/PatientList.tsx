import React from 'react';
import { Patient } from '../types';
import { UserPlus, FileText, Trash2, Edit, Search } from 'lucide-react';
import { interpretHOMA } from '../utils/calculations';

interface PatientListProps {
  patients: Patient[];
  onAdd: () => void;
  onSelect: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onAdd, onSelect, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredPatients = patients.filter(p => 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Pazienti</h1>
          <p className="text-slate-500 mt-1">Gestione rischio cardiometabolico</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-medical hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all"
        >
          <UserPlus size={20} />
          Nuovo Paziente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Cerca per nome o cognome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical focus:border-medical outline-none shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Paziente</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Età/Sesso</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">HOMA-IR</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">TG:HDL</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nessun paziente trovato. Aggiungine uno nuovo.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  const homaStatus = interpretHOMA(patient.homaIr);
                  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
                  
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{patient.lastName} {patient.firstName}</div>
                        <div className="text-xs text-slate-400">ID: {patient.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {age} Anni <span className="text-slate-300">|</span> {patient.gender}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${homaStatus.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${homaStatus.color}`}>
                          {patient.homaIr}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {patient.tgHdlRatio}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => onSelect(patient)}
                          className="text-medical hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Vedi Report"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={() => onEdit(patient)}
                          className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => {
                             if(window.confirm('Sei sicuro di voler eliminare questo paziente?')) onDelete(patient.id);
                          }}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientList;