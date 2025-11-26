import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { calculateBMI, calculateHOMA, calculateTGHDL } from '../utils/calculations';
import { Save, X, Activity } from 'lucide-react';

interface PatientFormProps {
  initialData?: Patient | null;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: '',
    weight: 0,
    height: 0,
    idealWeight: 0,
    glucose: 0,
    insulin: 0,
    triglycerides: 0,
    hdl: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'firstName' || name === 'lastName' || name === 'birthDate' || name === 'gender' 
        ? value 
        : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weight = formData.weight || 0;
    const height = formData.height || 0;
    const glucose = formData.glucose || 0;
    const insulin = formData.insulin || 0;
    const tg = formData.triglycerides || 0;
    const hdl = formData.hdl || 0;

    const bmi = calculateBMI(weight, height);
    const homaIr = calculateHOMA(glucose, insulin);
    const tgHdlRatio = calculateTGHDL(tg, hdl);

    const newPatient: Patient = {
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      gender: (formData.gender as 'M' | 'F') || 'M',
      birthDate: formData.birthDate || '',
      weight,
      height,
      idealWeight: formData.idealWeight,
      bmi,
      glucose,
      insulin,
      triglycerides: tg,
      hdl,
      homaIr,
      tgHdlRatio,
      aiAnalysis: initialData?.aiAnalysis || undefined // Preserve or reset
    };

    onSave(newPatient);
  };

  const inputClass = "w-full p-2.5 bg-white text-slate-900 border rounded-lg focus:ring-2 focus:ring-medical focus:border-medical outline-none placeholder:text-slate-400";

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-medical" />
          {initialData ? 'Modifica Paziente' : 'Nuovo Paziente'}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Anagrafica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Dati Anagrafici</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="Mario" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cognome</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Rossi" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Data di Nascita</label>
              <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sesso</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </div>
          </div>
        </div>

        {/* Antropometrici */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Dati Antropometrici</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Peso (kg)</label>
              <input required type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Altezza (cm)</label>
              <input required type="number" step="1" name="height" value={formData.height} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Peso Ideale (kg)</label>
              <input type="number" step="0.1" name="idealWeight" value={formData.idealWeight} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Laboratorio */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Dati di Laboratorio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Glicemia (mg/dL)</label>
              <input required type="number" step="1" name="glucose" value={formData.glucose} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Insulina (uIU/mL)</label>
              <input required type="number" step="0.1" name="insulin" value={formData.insulin} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Trigliceridi (mg/dL)</label>
              <input required type="number" step="1" name="triglycerides" value={formData.triglycerides} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Colesterolo HDL (mg/dL)</label>
              <input required type="number" step="1" name="hdl" value={formData.hdl} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">
            Annulla
          </button>
          <button type="submit" className="px-6 py-2.5 bg-medical text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
            <Save size={18} />
            Salva Paziente
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;