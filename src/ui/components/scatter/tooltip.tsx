import React from 'react'
import { TooltipProps } from 'recharts'

type PayloadData = {
  protein: string
  x: number
  y: number
}

interface ScatterTooltipProps extends TooltipProps<number, string> {
  payload?: {
    payload: PayloadData
  }[]
}

const ScatterTooltip: React.FC<ScatterTooltipProps> = ({
  active,
  payload,
}) => {
  if (!(active && payload && payload.length)) return null

  const d = payload[0].payload

  return (
    <div className="bg-white p-3 border border-gray-300 rounded shadow">
      <p className="font-medium">{d.protein}</p>
      <p>Log2 FC: {d.x.toFixed(2)}</p>
      <p>-Log10 p: {d.y.toFixed(2)}</p>
    </div>
  )
}

export default ScatterTooltip
