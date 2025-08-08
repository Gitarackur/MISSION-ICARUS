// src/types/protein.ts
export interface ProteinRow {
  id: number;
  proteinId: string;
  geneNames: string;
  description: string;
  molecularWeight: number;
  peptides: number;
  uniquePeptides: number;
  intensity_Sample1: number;
  intensity_Sample2: number;
  intensity_Sample3: number;
  intensity_Control1: number;
  intensity_Control2: number;
  intensity_Control3: number;
  coverage: number;
  score: number;
  validValues: number;
  qValue: number;
  pValue: number;
  [key: string]: string | number;
}


export type Stats = {
  totalProteins: number;
  averageIntensity: number;
  medianIntensity: number;
  coefficientOfVariation: number;
  missingValues: number;
} | null;
