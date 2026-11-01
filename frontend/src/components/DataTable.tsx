interface HeatmapProps {
  title: string;
  methods: string[];
  algos: string[];
  values: Array<Array<number | null>>;
  metric: string;
}

function colorFor(value: number | null, min: number, max: number) {
  if (value === null || Number.isNaN(value)) return 'rgba(148,163,184,0.08)';
  const normalized = max === min ? 0.5 : (value - min) / (max - min);
  const hue = 210 - normalized * 90;
  return `hsla(${hue}, 90%, 60%, 0.75)`;
}

export function Heatmap({ title, methods, algos, values, metric }: HeatmapProps) {
  const flattened = values.flat().filter((value): value is number => value !== null && !Number.isNaN(value));
  const min = flattened.length ? Math.min(...flattened) : 0;
  const max = flattened.length ? Math.max(...flattened) : 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
        {title} · {metric}
      </div>
      <div className="overflow-auto">
        <div className="min-w-[420px] p-3">
          <div className="mb-2 grid grid-cols-[88px_repeat(5,minmax(52px,1fr))] gap-2 text-center text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
            <div />
            {methods.map((method) => (
              <div key={method}>{method}</div>
            ))}
          </div>
          {algos.map((algo, rowIndex) => (
            <div key={algo} className="grid grid-cols-[88px_repeat(5,minmax(52px,1fr))] gap-2 py-1">
              <div className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">{algo}</div>
              {values[rowIndex].map((value, colIndex) => (
                <div
                  key={`${algo}-${methods[colIndex]}`}
                  className="flex min-h-12 items-center justify-center rounded-lg border border-slate-100 px-1 text-center text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  style={{ background: colorFor(value, min, max) }}
                  title={`${algo} / ${methods[colIndex]}: ${value ?? 'n/a'}`}
                >
                  {value === null ? '—' : value.toFixed(3)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
