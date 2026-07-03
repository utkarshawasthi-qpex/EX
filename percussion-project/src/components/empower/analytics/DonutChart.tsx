type DonutSegment = {
  percent: number;
  color: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  centerLabel: string;
  size?: number;
};

export function DonutChart({ segments, centerLabel, size = 140 }: DonutChartProps) {
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((segment, index) => {
          const dash = (segment.percent / 100) * circumference;
          const circle = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <span className="absolute text-xs font-medium text-gray-500 text-center px-2 leading-tight">
        {centerLabel}
      </span>
    </div>
  );
}
