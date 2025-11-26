
import React, { useRef, useState } from 'react';
import { Patient, User } from '../types';
import { interpretHOMA, interpretTGHDL, interpretBMI } from '../utils/calculations';
import { Printer, ArrowLeft, BrainCircuit, Download, Sparkles, X, Activity, Mail, Phone, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateClinicalSummary } from '../services/geminiService';

interface ReportViewProps {
  patient: Patient;
  currentUser: User | null;
  onBack: () => void;
  onGenerateAI: () => void;
  isGeneratingAI: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({ patient, currentUser, onBack, onGenerateAI, isGeneratingAI }) => {
  const homa = interpretHOMA(patient.homaIr);
  const tgHdl = interpretTGHDL(patient.tgHdlRatio);
  const bmi = interpretBMI(patient.bmi);
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Quick AI State
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickContent, setQuickContent] = useState('');
  const [loadingQuick, setLoadingQuick] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
      // Use html2canvas to render the DOM element to a canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Improve resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions in mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add image to PDF, scaling to fit width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Referto_${patient.lastName}_${patient.firstName}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Errore durante la generazione del PDF:", error);
      alert("Si è verificato un errore durante la creazione del PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleQuickAnalysis = async () => {
    setShowQuickModal(true);
    setLoadingQuick(true);
    try {
      const summary = await generateClinicalSummary(patient);
      setQuickContent(summary);
    } catch (error) {
      console.error(error);
      setQuickContent("Impossibile generare l'analisi rapida al momento.");
    } finally {
      setLoadingQuick(false);
    }
  };

  const today = new Date().toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();

  const doctorName = currentUser?.lastName 
    ? `${currentUser.title || ''} ${currentUser.firstName || ''} ${currentUser.lastName}`.trim()
    : 'Dr. Amministratore';
    
  const doctorSpec = currentUser?.specialization || 'Medicina Metabolica e Funzionale';

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-100 py-8">
      {/* Action Bar - Hidden on Print */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-col md:flex-row justify-between items-center no-print px-4 md:px-0 gap-4 md:gap-0">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={20} /> Torna alla Dashboard
        </button>
        <div className="flex flex-wrap gap-3 justify-center">
          <button 
            onClick={handleQuickAnalysis}
            className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 shadow-sm text-sm md:text-base transition-colors"
          >
            <Sparkles size={18} />
            Quick AI
          </button>
          <button 
            onClick={onGenerateAI} 
            disabled={isGeneratingAI}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-sm text-sm md:text-base"
          >
            <BrainCircuit size={18} />
            {isGeneratingAI ? 'Generazione...' : 'Salva Analisi AI'}
          </button>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm text-sm md:text-base"
          >
            <Download size={18} />
            {isDownloading ? 'Scaricamento...' : 'Salva PDF'}
          </button>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 shadow-sm text-sm md:text-base"
          >
            <Printer size={18} />
            Stampa
          </button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div ref={reportRef} className="a4-page font-serif text-slate-800">
        
        {/* Header */}
        <header className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
          {/* Logo Section */}
          <div className="flex items-center gap-5">
            <div className="bg-white p-4 rounded-2xl border-2 border-medical/20 text-medical shadow-sm print:shadow-none print:border-medical flex items-center justify-center">
              <Activity size={38} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center h-full">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                MetaboRisk <span className="text-medical">Pro</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 bg-medical rounded-full"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                  Valutazione Clinica
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Info Section */}
          <div className="flex flex-col items-end text-right">
            <div className="mb-3">
              <h2 className="text-xl font-serif font-bold text-slate-900 leading-tight">{doctorName}</h2>
              <p className="text-xs font-bold text-medical uppercase tracking-widest mt-0.5">
                {doctorSpec}
              </p>
            </div>
            
            <div className="text-sm text-slate-500 font-sans flex flex-col items-end gap-1 border-r-2 border-slate-200 pr-3 mr-1 print:border-none print:pr-0 print:mr-0">
              {currentUser?.email && (
                <div className="flex items-center gap-2">
                   <span className="text-slate-600 font-medium">{currentUser.email}</span>
                   <Mail size={14} className="text-slate-400" />
                </div>
              )}
              {currentUser?.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">{currentUser.phone}</span>
                  <Phone size={14} className="text-slate-400" />
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-700 font-bold">{today}</span>
                <Calendar size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Patient Details */}
        <section className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest border-b border-slate-200 pb-2">Dati Paziente</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm font-sans">
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
              <span className="text-slate-500">Paziente</span>
              <span className="font-semibold text-slate-800 text-base">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
              <span className="text-slate-500">Età / Sesso</span>
              <span className="font-semibold text-slate-800">{age} Anni / {patient.gender}</span>
            </div>
             <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
              <span className="text-slate-500">Peso / Altezza</span>
              <span className="font-semibold text-slate-800">{patient.weight} kg / {patient.height} cm</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
              <span className="text-slate-500">Peso Ideale</span>
              <span className="font-semibold text-slate-800">{patient.idealWeight ? `${patient.idealWeight} kg` : 'N/D'}</span>
            </div>
          </div>
        </section>

        {/* Lab Data & Primary Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest border-b border-slate-200 pb-2">Parametri di Laboratorio</h2>
          <table className="w-full text-sm font-sans">
            <thead className="bg-slate-100/80 text-slate-600 uppercase text-xs">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold rounded-l-lg">Parametro</th>
                <th className="py-2.5 px-4 text-right font-semibold">Valore Rilevato</th>
                <th className="py-2.5 px-4 text-right font-semibold rounded-r-lg">Unità</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700">Glicemia A Digiuno</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{patient.glucose}</td>
                <td className="py-3 px-4 text-right text-slate-500">mg/dL</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700">Insulina A Digiuno</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{patient.insulin}</td>
                <td className="py-3 px-4 text-right text-slate-500">uIU/mL</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700">Trigliceridi</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{patient.triglycerides}</td>
                <td className="py-3 px-4 text-right text-slate-500">mg/dL</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-700">Colesterolo HDL</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">{patient.hdl}</td>
                <td className="py-3 px-4 text-right text-slate-500">mg/dL</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Risk Assessment Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest border-b border-slate-200 pb-2">Analisi del Rischio Metabolico</h2>
          
          <div className="grid grid-cols-2 gap-8 font-sans">
            {/* HOMA-IR Box */}
            <div className="border border-slate-200 rounded-2xl p-6 break-inside-avoid shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-700 text-lg">HOMA-IR</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${homa.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${homa.color}`}>
                  {homa.status}
                </span>
              </div>
              <div className="text-5xl font-bold text-slate-900 mb-3 tracking-tighter">{patient.homaIr}</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{homa.description}</p>
              <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                Range: Ottimale &lt; 1.0 | Rischio &gt; 1.9
              </div>
            </div>

            {/* TG:HDL Box */}
            <div className="border border-slate-200 rounded-2xl p-6 break-inside-avoid shadow-sm">
               <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-700 text-lg">TG:HDL Ratio</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${tgHdl.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${tgHdl.color}`}>
                  {tgHdl.status}
                </span>
              </div>
              <div className="text-5xl font-bold text-slate-900 mb-3 tracking-tighter">{patient.tgHdlRatio}</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{tgHdl.description}</p>
              <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                Range: Ideale &lt; 2.0 | Rischio &gt; 3.5
              </div>
            </div>

            {/* BMI Box (Full Width) */}
            <div className="col-span-2 border border-slate-200 rounded-2xl p-6 break-inside-avoid shadow-sm">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-slate-700 text-lg">Indice Massa Corporea (BMI)</h3>
                 <span className={`font-bold text-lg ${bmi.color}`}>{bmi.value} <span className="text-sm font-normal text-slate-500 ml-1">- {bmi.status}</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${bmi.color.replace('text-', 'bg-')}`} 
                  style={{ width: `${Math.min(Math.max((patient.bmi / 40) * 100, 10), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Clinical Summary */}
        <section className="break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
            <BrainCircuit size={18} className="text-medical" />
            Valutazione Clinica e Conclusioni
          </h2>
          <div className="bg-white p-8 border-l-4 border-medical shadow-sm rounded-r-xl text-slate-700 text-sm leading-7 text-justify font-serif">
            {patient.aiAnalysis ? (
              <p className="whitespace-pre-line">{patient.aiAnalysis}</p>
            ) : (
               <p className="text-slate-400 italic text-center py-4">Nessuna analisi salvata. Premi "Salva Analisi AI" per includerla nel referto.</p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="absolute bottom-12 left-0 w-full text-center text-xs text-slate-400 px-20 font-sans">
          <p>Documento generato da MetaboRisk Pro. Le informazioni contenute sono a supporto della decisione medica e non sostituiscono il giudizio clinico professionale.</p>
          <p className="mt-1">Riferimenti: The Blood Code Calculators.</p>
        </footer>
      </div>

      {/* Quick Analysis Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Sparkles className="text-indigo-500" size={20} />
                Analisi Rapida AI
              </h3>
              <button 
                onClick={() => setShowQuickModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingQuick ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
                    <Sparkles className="animate-pulse text-indigo-500 relative z-10" size={48} />
                  </div>
                  <p className="font-medium text-slate-600">Elaborazione valutazione clinica in corso...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-line text-slate-700 leading-relaxed text-justify">
                    {quickContent}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowQuickModal(false)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
