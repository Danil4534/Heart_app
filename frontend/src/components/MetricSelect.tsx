import { useAppStore } from "../store/useAppStore";
import type { MetricName } from "../types";
import { METRIC_KEYS, METRICS } from "../data/static";
export function MetricSelect({value,onChange}:{value:MetricName;onChange:(value:MetricName)=>void}) { const globalMetric=useAppStore(s=>s.selectedMetric); return <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300"><span>Метрика</span><select aria-label="Оберіть метрику" value={value||globalMetric} onChange={e=>onChange(e.target.value as MetricName)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">{METRIC_KEYS.map(key=><option key={key} value={key}>{METRICS[key].label}</option>)}</select></label>; }
