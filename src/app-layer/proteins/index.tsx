import * as d3 from 'd3';
import _ from 'lodash';
import { ProteinRow } from '@/domain/proteins/index.types';

export function calculateStatistics(data: ProteinRow[], selectedColumns: string[]) {
   const stats = {
    totalProteins: data.length,
    averageIntensity: 0,
    medianIntensity: 0,
    coefficientOfVariation: 0,
    missingValues: 0
  };

  if (!data.length) return stats;

  const intensityCols = selectedColumns.filter(col => col.includes('intensity'));
  
  if (intensityCols.length) {
    const allValues = data.flatMap(row =>
      intensityCols.map(col => Number(row[col]) || 0)
    ).filter(val => val > 0);

    stats.averageIntensity = _.mean(allValues);
    stats.medianIntensity = d3.median(allValues) ?? 0;
    stats.coefficientOfVariation =
      stats.averageIntensity > 0
        ? (d3.deviation(allValues) ?? 0) / stats.averageIntensity
        : 0;
    stats.missingValues = data.reduce(
      (sum, row) =>
        sum + intensityCols.filter(col => !row[col] || row[col] === 0).length,
      0
    );
  }

  return stats;
}







