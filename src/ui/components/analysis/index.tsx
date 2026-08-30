import React from 'react';
import { tv } from 'tailwind-variants';

const analysisPanel = tv({
  slots: {
    container: 'space-y-6',
    card: 'space-y-4',
    grid: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    button:
      'p-4 border border-gray-200 rounded-sm hover:bg-gray-50 text-left transition-colors duration-150 dark:border-gray-800 dark:hover:bg-gray-900',
    heading2: 'text-lg font-semibold dark:text-gray-100',
    heading3: 'text-lg font-semibold dark:text-gray-100',
    title: 'font-medium',
    description: 'text-sm text-gray-600 dark:text-gray-400',
    placeholderBox:
      'flex h-40 items-center justify-center border border-dashed border-gray-300 bg-gray-50 rounded-sm dark:border-gray-800 dark:bg-gray-950',
    placeholderText: 'text-gray-500 dark:text-gray-400',
  },
});

const AnalysisPanel: React.FC = () => {
  const styles = analysisPanel();

  return (
    <div className={styles.container()}>
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
