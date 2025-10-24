
<img width="2048" height="2048" alt="icarus" src="https://github.com/user-attachments/assets/4c0a49e9-83f1-4488-a0c4-6a70101fdb9b" />



## 🚧 **Icarus** 
## 🧪 Analysis platform

<div align="center">
  ⚠️ **WIP – Work In Progress**  
  This project is currently under active development. Features, UI, and functionality are subject to change!
</div>

---

## 🧭 Overview

The **Statistical Analysis Platform** is a **React + Electron** interactive application for exploring and analyzing statistical data from various sources **like mass spectrometry–based proteomics datasets and many more**.  

It supports the imports of various txt, csv formats *like **MaxQuant outputs** (e.g., `proteinGroups.txt`, `evidence.txt`)) and provides filtering, summary statistics, and statistical analysis — all within an intuitive, visual interface.

---

## ✨ Features

### 📁 Data Import
- Upload **MaxQuant output files** (eg, `proteinGroups.txt`, `evidence.txt`, etc.).
- Parse and preview statistical data in a clean, interactive table.

### 🔍 Data Filtering
- Search proteins by **identifier** or **gene name**.
- Dynamically update filtered subsets in real time.

### 📊 Statistical Summaries
- Compute:
  - **Mean**, **Median**
  - **Coefficient of Variation (CV)**
  - **Missing Value Counts**
- Display summaries in a compact, visual dashboard.

### 🧬 Visualization
- **COMING SOON:**  **Volcano plots** for log₂ fold change vs. −log₁₀ p-value.
- **COMING SOON:** **Bar charts** of sample intensity distributions.
- **COMING SOON:**: **Heatmaps**, **PCA plots**, and **correlation maps**.

### 🧠 Analysis Tools
- Placeholder modules for:
  - **t-tests**
  - **ANOVA**
  - **PCA**
  - **Gene Ontology (GO) enrichment**
- Future expansion planned for full **differential expression** workflows.

---

## ⚙️ How It Works

1. **Data Import**  
   Upload your data file (in txt or csv format). The app parses and displays a customizable data table.

2. **Filtering**  
   Use search and numerical filters to interactively refine your dataset.

3. **Analysis**  
   Run initial analyses (t-test, ANOVA, PCA) and preview GO enrichment modules.  
   _(Advanced bioinformatics pipelines coming soon.)_

---

## 🧰 Technologies Used

| Category | Tools / Libraries |
|-----------|------------------|
| Frontend | ⚛️ **React**, 🧑‍💻 **TypeScript** |
| Styling | 🎨 **Tailwind CSS** |
| Visualization | 📈 **Recharts**, 📊 **D3.js** |
| Utilities | 🧩 **Lodash**, ✨ **Lucide-react** |
| Framework | ⚡ **Electron** (for desktop integration) |

---

## 🚀 Getting Started

### 📦 Installation

```bash
# Clone the repository
git clone <repo-url>

# Enter the project directory
cd mission-icarus

# Install dependencies
npm install

# Start development mode
npm run dev

