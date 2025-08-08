import { ProteinRow } from "@/domain/proteins/index.types";

export const proteinsSeed = [
  'P12345_ACTB_HUMAN',
  'Q67890_ALB_HUMAN',
  'P54321_GAPDH_HUMAN',
  'Q98765_HSP70_HUMAN',
  'P13579_TUBB_HUMAN',
  'Q24680_VIME_HUMAN',
  'P11111_ENO1_HUMAN',
  'P22222_LDHA_HUMAN',
  'P33333_PGK1_HUMAN'
];

export function generateSampleData(): ProteinRow[] {
  return proteinsSeed.map((protein, idx) => ({
    id: idx + 1,
    proteinId: protein,
    geneNames: protein.split('_')[1] ?? 'UNK',
    description: `${protein.split('_')[1] ?? 'Unknown'} protein description`,
    molecularWeight: Math.round(20000 + Math.random() * 80000),
    peptides: Math.floor(Math.random() * 20) + 5,
    uniquePeptides: Math.floor(Math.random() * 15) + 3,
    intensity_Sample1: Math.round(Math.random() * 1e6 + 1e5),
    intensity_Sample2: Math.round(Math.random() * 1e6 + 1e5),
    intensity_Sample3: Math.round(Math.random() * 1e6 + 1e5),
    intensity_Control1: Math.round(Math.random() * 8e5 + 5e4),
    intensity_Control2: Math.round(Math.random() * 8e5 + 5e4),
    intensity_Control3: Math.round(Math.random() * 8e5 + 5e4),
    coverage: +(Math.random() * 60 + 10).toFixed(2),
    score: +(Math.random() * 200 + 50).toFixed(2),
    validValues: Math.floor(Math.random() * 6) + 3,
    qValue: +(Math.random() * 0.05).toFixed(4),
    pValue: +(Math.random() * 0.1).toFixed(4)
  }));
}