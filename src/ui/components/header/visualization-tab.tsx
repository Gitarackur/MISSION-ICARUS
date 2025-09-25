import { IcarusVisualization } from '@/domain/workflow/main.types'
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
        {visualizations.map((visualization) => (
          <button
            key={visualization.id}
            onClick={() => setActiveVisualizationId(visualization.id)}
            className={tabButton({ active: activeVisualizationId === visualization.id })}
          >
            {visualization.id}
          </button>
        ))}
      </div>
    </>
  )
}

export default VisualizationTab;