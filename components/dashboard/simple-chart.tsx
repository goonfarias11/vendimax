interface SimpleChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-around gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full items-end justify-center">
                <div
                  className="w-full rounded-t-lg bg-primary transition-all hover:bg-primary/80"
                  style={{ height: `${barHeight}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-around">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-gray-600">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
