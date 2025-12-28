interface SimpleChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1); // Evitar división por 0

  return (
    <div className="space-y-6 mt-8">
      <div 
        className="flex items-end justify-around gap-4" 
        style={{ height: `${height}px`, position: 'relative' }}
      >
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * height * 0.8 : 0;
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2 h-full">
              <div className="relative flex w-full h-full items-end justify-center">
                <div
                  className="w-full max-w-[80px] rounded-t-lg bg-primary transition-all hover:bg-primary/80 print:bg-blue-500"
                  style={{ 
                    height: `${barHeight}px`,
                    minHeight: item.value > 0 ? '4px' : '0px',
                    backgroundColor: 'hsl(217 91% 60%)',
                    WebkitPrintColorAdjust: 'exact',
                    colorAdjust: 'exact'
                  }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground whitespace-nowrap print:text-black">
                    ${item.value.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-around gap-4">
        {data.map((item, index) => (
          <span key={index} className="text-sm font-medium text-muted-foreground text-center flex-1 print:text-black">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
