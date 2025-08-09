import React from 'react';
import { tv } from 'tailwind-variants';

const container = tv({
  base: 'space-y-6',
});

const card = tv({
  base: 'bg-white rounded-lg shadow p-6',
});

const grid = tv({
  base: 'grid grid-cols-1 md:grid-cols-3 gap-4',
});

const button = tv({
  base:
    'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors duration-150',
});

const heading2 = tv({
  base: 'text-lg font-semibold mb-4',
});

const heading3 = tv({
  base: 'text-lg font-semibold mb-4',
});

const title = tv({
  base: 'font-medium',
});

const description = tv({
  base: 'text-sm text-gray-600',
});

const placeholderBox = tv({
  base:
    'bg-gray-100 h-40 rounded-lg flex items-center justify-center',
});

const placeholderText = tv({
  base: 'text-gray-500',
});

const AnalysisPanel: React.FC = () => (
  <div className={container()}>
    <div className={card()}>
      <h2 className={heading2()}>Statistical Analysis</h2>
      <div className={grid()}>
        <button className={button()}>
          <h3 className={title()}>t-Test</h3>
          <p className={description()}>Compare two groups</p>
        </button>
        <button className={button()}>
          <h3 className={title()}>ANOVA</h3>
          <p className={description()}>Multiple group comparison</p>
        </button>
        <button className={button()}>
          <h3 className={title()}>PCA</h3>
          <p className={description()}>Principal component analysis</p>
        </button>
      </div>
    </div>

    <div className={card()}>
      <h3 className={heading3()}>Gene Ontology Enrichment</h3>
      <div className={placeholderBox()}>
        <p className={placeholderText()}>
          GO enrichment results would be displayed here (placeholder)
        </p>
      </div>
    </div>
  </div>
);

export default AnalysisPanel;
