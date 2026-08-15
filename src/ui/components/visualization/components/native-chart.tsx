import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  InteractiveNativeChartProps,
  NativeChartAxesProps,
  NativeChartProps,
} from "../types/index.types";
import { useNativeChartSize } from "../hooks/useNativeChartSize";
import {
  formatNativeChartNumericTick,
  getNativeChartSeriesColor,
  getNativeChartTickInterval,
  nativeChartMargin,
  nativeChartTooltipStyle,
  normalizeNativeChartImageSource,
  resolveNativeChartXAxisAngle,
  truncateNativeChartLabel,
} from "../utils/native-chart";

const NativeChartAxes = ({
  categoryKey,
  labels,
  settings,
  width,
}: NativeChartAxesProps) => {
  const xTickAngle = resolveNativeChartXAxisAngle({ labels, settings, width });
  const xTickInterval = getNativeChartTickInterval(
    labels.length,
    settings.maxXTicks
  );

  return (
    <>
      {settings.showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
      <XAxis
        dataKey={categoryKey}
        tick={{ fontSize: settings.tickFontSize }}
        angle={-xTickAngle}
        height={xTickAngle ? 72 : 48}
        interval={xTickInterval}
        textAnchor={xTickAngle ? "end" : "middle"}
        tickFormatter={(value) =>
          truncateNativeChartLabel(value, settings.xMaxLabelLength)
        }
        label={{
          value: settings.xAxisLabel,
          position: "insideBottom",
          offset: -8,
          fontSize: settings.axisLabelFontSize,
        }}
      />
      <YAxis
        angle={settings.yTickAngle}
        tick={{ fontSize: settings.tickFontSize }}
        tickCount={Math.max(2, settings.maxYTicks)}
        tickFormatter={(value) =>
          formatNativeChartNumericTick(value, settings.yMaxLabelLength)
        }
        label={{
          value: settings.yAxisLabel,
          angle: -90,
          position: "insideLeft",
          fontSize: settings.axisLabelFontSize,
        }}
      />
      <RechartsTooltip contentStyle={nativeChartTooltipStyle} />
      <Legend />
    </>
  );
};

function InteractiveNativeChart<TData extends object>({
  className = "h-full w-full",
  content: { categoryKey, data, kind, series, settings },
}: InteractiveNativeChartProps<TData>) {
  const { containerRef, size } = useNativeChartSize({
    initialWidth: settings.plotWidth,
    initialHeight: settings.plotHeight,
  });

  const categoryLabels = data.map((row) => String(row[categoryKey] ?? ""));
  const axes = (
    <NativeChartAxes
      categoryKey={categoryKey}
      labels={categoryLabels}
      settings={settings}
      width={size.width}
    />
  );
  let chart: ReactNode;

  if (kind === "line") {
    chart = (
      <LineChart
        data={data}
        width={size.width}
        height={size.height}
        margin={nativeChartMargin}
      >
        {axes}
        {series.map((item, index) => (
          <Line
            key={item.dataKey}
            type="monotone"
            dataKey={item.dataKey}
            name={item.name}
            stroke={getNativeChartSeriesColor(item, index, settings)}
            dot={{ r: settings.pointSize }}
          />
        ))}
      </LineChart>
    );
  } else if (kind === "area") {
    chart = (
      <AreaChart
        data={data}
        width={size.width}
        height={size.height}
        margin={nativeChartMargin}
      >
        {axes}
        {series.map((item, index) => {
          const color = getNativeChartSeriesColor(item, index, settings);
          return (
            <Area
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={color}
              fill={color}
            />
          );
        })}
      </AreaChart>
    );
  } else {
    chart = (
      <BarChart
        data={data}
        width={size.width}
        height={size.height}
        margin={nativeChartMargin}
      >
        {axes}
        {series.map((item, index) => (
          <Bar
            key={item.dataKey}
            dataKey={item.dataKey}
            name={item.name}
            fill={getNativeChartSeriesColor(item, index, settings)}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {chart}
    </div>
  );
}

export function NativeChart<
  TData extends object = Record<string, unknown>,
>({ className = "h-full w-full", content }: NativeChartProps<TData>) {
  if (content.type === "image") {
    return (
      <div className={className}>
        <img
          src={normalizeNativeChartImageSource(content.source)}
          alt={content.alt}
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return <InteractiveNativeChart className={className} content={content} />;
}
