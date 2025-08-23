import { IcarusMatrix } from '@/domain/workflow/main.types'
import { tabNavigationVariants } from './variants'

const MatrixTab = ({
  matrices,
  activeMatrixId,
  setActiveMatrixId
}: {
  matrices: IcarusMatrix[],
  activeMatrixId: string,
  setActiveMatrixId: (id: string) => void
}) => {

  const {
    tabList,
    tabButton,
  } = tabNavigationVariants()

  return (
    <>
      <div className={tabList()}>
        {matrices.map((matrix) => (
          <button
            key={matrix.id}
            onClick={() => setActiveMatrixId(matrix.id)}
            className={tabButton({ active: activeMatrixId === matrix.id })}
          >
            {matrix.id}
          </button>
        ))}
      </div>
    </>
  )
}

export default MatrixTab;