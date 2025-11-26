import { GoogleGenAI } from "@google/genai";
import { Patient } from "../types";
import { interpretHOMA, interpretTGHDL, interpretBMI } from "../utils/calculations";

export const generateClinicalSummary = async (patient: Patient): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return "Analisi AI non disponibile: API Key mancante.";
  }

  const homaInfo = interpretHOMA(patient.homaIr);
  const tgHdlInfo = interpretTGHDL(patient.tgHdlRatio);
  const bmiInfo = interpretBMI(patient.bmi);

  const prompt = `
    Sei un medico esperto in medicina metabolica e funzionale.
    Scrivi una breve "Valutazione Clinica e Conclusioni" per un referto medico basato sui seguenti dati.
    Usa un tono professionale, medico, formale e in italiano.
    
    Dati Paziente:
    - Nome: ${patient.firstName} ${patient.lastName}
    - Sesso: ${patient.gender}
    - Età: ${new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anni
    - BMI: ${patient.bmi} (${bmiInfo.description})
    
    Dati Laboratorio:
    - Glicemia: ${patient.glucose} mg/dL
    - Insulina: ${patient.insulin} uIU/mL
    - Trigliceridi: ${patient.triglycerides} mg/dL
    - HDL: ${patient.hdl} mg/dL
    
    Risultati Calcolati:
    - HOMA-IR: ${patient.homaIr} (Interpretazione: ${homaInfo.description})
    - Rapporto TG/HDL: ${patient.tgHdlRatio} (Interpretazione: ${tgHdlInfo.description})
    
    Istruzioni per l'output:
    1. Analizza sinteticamente lo stato metabolico (resistenza insulinica, rischio cardiovascolare lipidico).
    2. Fornisci 3 raccomandazioni cliniche/nutrizionali prioritarie basate sui valori alterati (se presenti).
    3. Non usare markdown o bold, solo testo piano formattato in paragrafi chiari.
    4. Sii diretto e costruttivo.
    5. Lunghezza massima 200 parole.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Impossibile generare l'analisi al momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Errore nella generazione dell'analisi AI. Verificare la connessione o la chiave API.";
  }
};