import { BALANCE_COLORS } from "../data/static";
import type { ConfigMetrics, MetricSource } from "../types";

interface HeatmapProps {
  title: string;
  methods: string[];
  algos: string[];
  values: Array<Array<number | null>>;
  metric: string;
  onCellClick?: (algo: string, method: string) => void;
  selectedIds?: string[];
  configs?: ConfigMetrics[];
  source?: MetricSource;
}

export function Heatmap({ title, methods, algos, values, metric, onCellClick, selectedIds = [], configs = [], source = "cv" }: HeatmapProps) {
  const allValues = values.flat().filter((value): value is number => value !== null && Number.isFinite(value));
  const minimum = allValues.length ? Math.min(...allValues) : 0;
  const maximum = allValues.length ? Math.max(...allValues) : 1;
  const background = (value: number | null) => {
    if (value === null) return "#f1f5f9";
    const ratio = maximum === minimum ? 0.5 : (value - minimum) / (maximum - minimum);
    return `hsl(217 85% ${96 - ratio * 43}%)`;
  };

  return (
    <section className="panel overflow-auto">
      <h2 className="mb-3 font-semibold">{title} · {metric}</h2>
      {allValues.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Дані матриці недоступні.</p> : (
        <table className="w-full min-w-[600px] border-separate border-spacing-1 text-center text-xs">
          <thead><tr><th scope="col">Алгоритм</th>{methods.map((method) => <th scope="col" key={method} className="max-w-24">{method}</th>)}</tr></thead>
          <tbody>{algos.map((algo, rowIndex) => <tr key={algo}><th scope="row" className="text-left">{algo}</th>{methods.map((method, columnIndex) => {
            const value = values[rowIndex]?.[columnIndex] ?? null;
            const config = configs.find((item) => item.algo === algo && item.method === method);
            const deviation = config?.cv_std?.[metric as keyof ConfigMetrics["cv_std"]];
            const selected = selectedIds.includes(`${algo}|${method}`);
            const titleText = `${algo} / ${method}: ${value === null ? "немає даних" : value.toFixed(3)}${source === "cv" && deviation !== undefined ? ` ± ${deviation.toFixed(3)}` : ""}`;
            return <td key={method}><button type="button" aria-label={`Додати або прибрати ${algo}, ${method} у порівняння`} aria-pressed={selected} onClick={() => onCellClick?.(algo, method)} title={titleText} className={`w-full rounded-lg border p-3 font-semibold ${selected ? "ring-2 ring-violet-500" : "border-white/60"}`} style={{ backgroundColor: background(value), borderColor: value === maximum ? "#111827" : BALANCE_COLORS[method] ?? "transparent", color: (value ?? 0) > 0.55 ? "white" : "#0f172a" }}>{value === null ? "—" : value.toFixed(3)}{source === "cv" && deviation !== undefined && <span className="block text-[9px] font-normal">± {deviation.toFixed(3)}</span>}</button></td>;
          })}</tr>)}</tbody>
        </table>
      )}
    </section>
  );
}
