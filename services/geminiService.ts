import { Patient } from "../types";

export const generateClinicalSummary = async (patient: Patient): Promise<string> => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patient }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Errore API");
    }

    return data.text || "Nessuna risposta generata.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Impossibile generare l'analisi AI al momento. Verifica la connessione o riprova più tardi.";
  }
};