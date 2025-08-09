import React from 'react';
import { tv } from 'tailwind-variants';

const analysisPanel = tv({
  slots: {
    container: 'space-y-6',
    card: 'bg-white rounded-lg shadow p-6',
    grid: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    button:
      'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors duration-150',
    heading2: 'text-lg font-semibold mb-4',
    heading3: 'text-lg font-semibold mb-4',
    title: 'font-medium',
    description: 'text-sm text-gray-600',
    placeholderBox: 'bg-gray-100 h-40 rounded-lg flex items-center justify-center',
    placeholderText: 'text-gray-500',
  },
});

const AnalysisPanel: React.FC = () => {
  const styles = analysisPanel();

  return (
    <div className={styles.container()}>
      <div className={styles.card()}>
        <h2 className={styles.heading2()}>Statistical Analysis</h2>
        <div className={styles.grid()}>
          <button className={styles.button()}>
            <h3 className={styles.title()}>t-Test</h3>
            <p className={styles.description()}>Compare two groups</p>
          </button>
          <button className={styles.button()}>
            <h3 className={styles.title()}>ANOVA</h3>
            <p className={styles.description()}>Multiple group comparison</p>
          </button>
          <button className={styles.button()}>
            <h3 className={styles.title()}>PCA</h3>
            <p className={styles.description()}>Principal component analysis</p>
          </button>
        </div>
      </div>

      <div className={styles.card()}>
        <h3 className={styles.heading3()}>Gene Ontology Enrichment</h3>
        <div className={styles.placeholderBox()}>
          <p className={styles.placeholderText()}>
            GO enrichment results would be displayed here (placeholder)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
