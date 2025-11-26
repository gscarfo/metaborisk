import { CalculationResult } from '../types';

export const calculateBMI = (weight: number, heightCm: number): number => {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
};

export const calculateHOMA = (glucose: number, insulin: number): number => {
  // Formula: (Glucose (mg/dL) * Insulin (uIU/mL)) / 405
  if (!glucose || !insulin) return 0;
  return parseFloat(((glucose * insulin) / 405).toFixed(2));
};

export const calculateTGHDL = (tg: number, hdl: number): number => {
  if (!hdl || hdl === 0) return 0;
  return parseFloat((tg / hdl).toFixed(2));
};

// Interpretation based on The Blood Code / Functional Medicine standards
export const interpretHOMA = (value: number): CalculationResult => {
  if (value < 1.0) {
    return {
      value,
      status: 'Ottimo',
      color: 'text-green-600',
      description: 'Sensibilità insulinica ottimale.'
    };
  } else if (value <= 1.9) {
    return {
      value,
      status: 'Buono',
      color: 'text-emerald-500',
      description: 'Sensibilità insulinica nella norma, ma monitorare.'
    };
  } else if (value <= 2.9) {
    return {
      value,
      status: 'Attenzione',
      color: 'text-yellow-600',
      description: 'Insulino-resistenza precoce. Necessario intervento sullo stile di vita.'
    };
  } else {
    return {
      value,
      status: 'Rischio Elevato',
      color: 'text-red-600',
      description: 'Insulino-resistenza significativa. Rischio cardiometabolico elevato.'
    };
  }
};

export const interpretTGHDL = (value: number): CalculationResult => {
  if (value < 2.0) {
    return {
      value,
      status: 'Ottimo',
      color: 'text-green-600',
      description: 'Pattern lipidico ideale (LDL particelle grandi).'
    };
  } else if (value < 3.8) { // approximations roughly < 3.5-4 is okayish standard, > 3.8 often risk
    return {
      value,
      status: 'Attenzione',
      color: 'text-yellow-600',
      description: 'Rischio moderato. Monitorare assunzione di carboidrati.'
    };
  } else {
    return {
      value,
      status: 'Rischio Elevato',
      color: 'text-red-600',
      description: 'Pattern lipidico aterogenico (LDL particelle piccole e dense).'
    };
  }
};

export const interpretBMI = (value: number): CalculationResult => {
  if (value < 18.5) return { value, status: 'Attenzione', color: 'text-blue-500', description: 'Sottopeso' };
  if (value < 25) return { value, status: 'Ottimo', color: 'text-green-600', description: 'Normopeso' };
  if (value < 30) return { value, status: 'Attenzione', color: 'text-yellow-600', description: 'Sovrappeso' };
  return { value, status: 'Rischio Elevato', color: 'text-red-600', description: 'Obesità' };
};