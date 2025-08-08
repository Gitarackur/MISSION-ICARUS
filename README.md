# Proteomics Analysis Platform

## Overview

The **Proteomics Analysis Platform** is a React-based interactive Electron application designed for exploring and analyzing mass spectrometry-based proteomics datasets. It supports importing MaxQuant outputs or similar tabular proteomics data, filtering, statistical summaries, and visualizations relevant to proteomics research.

---

## Features

### Data Import

- Upload proteinGroups.txt, evidence.txt, or other tab-delimited MaxQuant output files.
- Parses and previews proteomics data with key metrics such as protein IDs, gene names, peptides, and intensity values across samples.

### Data Filtering

- Search proteins by identifiers or gene names.
- Filter based on quantitative criteria such as minimum valid peptide counts.
- Dynamic update of filtered data subsets.

### Statistical Summaries

- Calculates summary statistics on intensity values, including mean, median, coefficient of variation (CV), and missing value counts.
- Displays these stats in a dashboard with clear visual cues.

### Visualization

- Generates volcano plots showing log2 fold changes vs -log10 p-values for differential protein expression.
- Displays intensity distribution bar charts across samples.
- Placeholder for correlation heatmaps and other proteomics visualizations.

### Analysis Tools

- Buttons for common proteomics analyses: t-tests, ANOVA, PCA (placeholders for further implementation).
- Section for gene ontology enrichment results (placeholder).

---

## Data Model

The application works with proteomics data structured around these key fields:

| Field               | Description                                   |
|---------------------|-----------------------------------------------|
| proteinId           | Unique protein accession code                 |
| geneNames           | Associated gene names                          |
| peptides            | Number of peptides identified                  |
| uniquePeptides      | Number of unique peptides                      |
| intensity_Sample*   | Quantitative intensity values for samples     |
| intensity_Control*  | Quantitative intensity values for controls    |
| coverage            | Sequence coverage (%)                           |
| score               | Protein score (e.g., identification confidence) |
| validValues         | Number of valid intensity values                |
| qValue, pValue      | Statistical significance metrics                |

---

## How It Works

1. **Data Import:** Upload your proteomics result file. The app parses tab-delimited data and displays a preview table with customizable visible columns.

2. **Filtering:** Use text search and numeric filters (e.g., minimum valid peptide values) to refine the dataset interactively.

3. **Statistics:** The app computes and displays protein count, average intensity, CV, and missing data metrics dynamically.

4. **Visualization:** View volcano plots to identify significantly regulated proteins and bar charts of intensity distributions across samples.

5. **Analysis:** Access preliminary analysis modules (t-test, ANOVA, PCA) and GO enrichment placeholders for downstream bioinformatics.

---

## Technologies

- **React** with hooks for UI state management.
- **TypeScript** for type safety.
- **Tailwind CSS** for styling.
- **Recharts** for charting and data visualization.
- **D3.js** for statistics calculations.
- **Lodash** for utility functions.
- **Lucide-react** for icons.

---

## Getting Started

### Installation

```bash
git clone <repo-url>
cd proteomics-analysis-platform
npm install
npm run dev
