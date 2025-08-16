import { DataPreviewPagination } from './types'
import { dataOutputStyles } from './variants/data-output.variant';

const PreviewPagination = ({
  filteredData,
  paginatedData,
  goToPrev,
  goToNext,
  currentPage,
  totalPages,
  selectedAnalysisColumn,
}: DataPreviewPagination) => {
  const s = dataOutputStyles();  
  return (
    <div className={s.pagination()}>
        <div>
          Showing {paginatedData.length} of {filteredData.length} proteins
          {selectedAnalysisColumn && (
            <span className="ml-4 text-blue-600 font-medium">
              Analyzing: {selectedAnalysisColumn}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={goToPrev}
            disabled={currentPage === 1}
            className={s.paginationButton({ paginationButtonDisabled: currentPage === 1 })}
          >
            Previous
          </button>
          <span className={s.paginationInfo()}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className={s.paginationButton({ paginationButtonDisabled: currentPage === totalPages })}
          >
            Next
          </button>
        </div>
      </div>
  )
}

export default PreviewPagination