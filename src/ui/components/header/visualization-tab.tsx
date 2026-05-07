import { IcarusVisualization } from '@/domain/workflow/main.types'
import { getVisualizationLabel } from '@/domain/visualization/utils/main'
import { tabNavigationVariants } from './variants'

const VisualizationTab = ({
  visualizations,
  activeVisualizationId,
  setActiveVisualizationId
}: {
  visualizations: IcarusVisualization[],
  activeVisualizationId: string,
  setActiveVisualizationId: (id: string) => void
}) => {

  const {
    tabList,
    tabButton,
  } = tabNavigationVariants()

  return (
    <>
      <div className={tabList()}>
        {visualizations.map((visualization, index) => (
          <button
            key={visualization.id}
            type="button"
            title={visualization.id}
            onClick={() => setActiveVisualizationId(visualization.id)}
            className={tabButton({ active: activeVisualizationId === visualization.id })}
          >
            {getVisualizationLabel(visualization, index)}
          </button>
        ))}
      </div>
    </>
  )
}

export default VisualizationTab;
