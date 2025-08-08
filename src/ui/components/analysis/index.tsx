const AnalysisPanel: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Statistical Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
          <h3 className="font-medium">t-Test</h3>
          <p className="text-sm text-gray-600">Compare two groups</p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
          <h3 className="font-medium">ANOVA</h3>
          <p className="text-sm text-gray-600">Multiple group comparison</p>
        </button>
        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
          <h3 className="font-medium">PCA</h3>
          <p className="text-sm text-gray-600">Principal component analysis</p>
        </button>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Gene Ontology Enrichment</h3>
      <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">GO enrichment results would be displayed here (placeholder)</p>
      </div>
    </div>
  </div>
);


export default AnalysisPanel;