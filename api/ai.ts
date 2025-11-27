import { GoogleGenAI } from "@google/genai";
import { interpretHOMA, interpretTGHDL, interpretBMI } from "../utils/calculations";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient } = req.body;
  
  if (!patient) {
     return res.status(400).json({ error: 'Dati paziente mancanti' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API Configuration Error: Key missing." });
  }

  const homaInfo = interpretHOMA(patient.homaIr);
  const tgHdlInfo = interpretTGHDL(patient.tgHdlRatio);
  const bmiInfo = interpretBMI(patient.bmi);
  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();

  const prompt = `
    Sei un medico esperto in medicina metabolica e funzionale.
    Scrivi una breve "Valutazione Clinica e Conclusioni" per un referto medico basato sui seguenti dati.
    Usa un tono professionale, medico, formale e in italiano.
    
    Dati Paziente:
    - Nome: ${patient.firstName} ${patient.lastName}
    - Sesso: ${patient.gender}
    - Età: ${age} anni
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
    
    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Errore durante la generazione dell'analisi." });
  }
}