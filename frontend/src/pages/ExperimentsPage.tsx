import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { DataTable } from "../components/DataTable";
import { Heatmap } from "../components/Heatmap";
import { METRIC_KEYS, METRICS, formatNumber, BALANCE_COLORS, ALGO_MARKERS } from "../data/static";
import { api } from "../api/client";
import { useAppStore } from "../store/useAppStore";
import type { ConfigMetrics, MetricName } from "../types";
import { CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Bar, BarChart } from "recharts";

const metricLabel = (key: string) => METRICS[key as MetricName]?.label ?? key;
const configId = (config: ConfigMetrics) => `${config.algo}|${config.method}`;
const COLORS = ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#db2777"];

export function ExperimentsPage() {
  const { selectedDataset, metricSource, selectedMetric, configs, summary, selectedConfigIds, setSelectedConfigIds } = useAppStore();
  const [metric, setMetric] = useState<MetricName>(selectedMetric);
  const [algoFilter, setAlgoFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [groupBy, setGroupBy] = useState<"algo" | "method">("algo");
  const [curves, setCurves] = useState<Awaited<ReturnType<typeof api.getDatasetCurves>>>([]);
  const [curveError, setCurveError] = useState("");
  const selected = useMemo(() => configs.filter((config) => selectedConfigIds.includes(configId(config))).slice(0, 5), [configs, selectedConfigIds]);
  const methods = Array.from(new Set(configs.map((config) => config.method)));
  const algos = Array.from(new Set(configs.map((config) => config.algo)));

  useEffect(() => setMetric(selectedMetric), [selectedMetric]);
  useEffect(() => {
    let cancelled = false;
    if (!selected.length) { setCurves([]); setCurveError(""); return; }
    setCurveError("");
    api.getDatasetCurves(selectedDataset, selected.map(configId)).then((result) => { if (!cancelled) setCurves(result); }).catch((error: unknown) => { if (!cancelled) setCurveError(error instanceof Error ? error.message : "Не вдалося завантажити криві."); });
    return () => { cancelled = true; };
  }, [selectedDataset, selectedConfigIds, configs]);

  const toggle = (id: string) => {
    if (selectedConfigIds.includes(id)) setSelectedConfigIds(selectedConfigIds.filter((item) => item !== id));
    else if (selectedConfigIds.length < 5) setSelectedConfigIds([...selectedConfigIds, id]);
  };
  const bestId = summary ? `${summary.best.algo}|${summary.best.method}` : "";
  const baselineId = summary ? `${summary.baseline.algo}|${summary.baseline.method}` : "";
  const metricRows = configs.map((config) => ({ id: configId(config), ...config }));
  const metricColumns = METRIC_KEYS.map((key) => ({
    key,
    header: metricLabel(key),
    sortable: true,
    value: (row: ConfigMetrics) => row[metricSource][key],
    render: (row: ConfigMetrics) => <span title={`${metricLabel(key)}: ${formatNumber(row[metricSource][key])}`}>{formatNumber(row[metricSource][key])}<span aria-hidden="true" className="ml-2 inline-block h-1.5 rounded bg-brand-400 align-middle" style={{ width: `${Math.max(3, row[metricSource][key] * 36)}px` }} /></span>,
  }));
  const tableColumns = [
    { key: "algo", header: "Алгоритм", sortable: true },
    { key: "method", header: "Метод", sortable: true },
    ...metricColumns,
    { key: "fit_seconds", header: "Час навчання (с)", sortable: true },
  ];
  const points = configs.map((config) => ({ ...config[metricSource], algo: config.algo, method: config.method, label: `${config.algo} / ${config.method}` }));
  const radarData = METRIC_KEYS.filter((key) => key !== "accuracy").map((key) => ({ metric: metricLabel(key), ...Object.fromEntries(selected.map((config) => [configId(config), config[metricSource][key]])) }));
  const barData = METRIC_KEYS.map((key) => ({ metric: metricLabel(key), ...Object.fromEntries(selected.map((config) => [configId(config), config[metricSource][key]])) }));
  const groupedData = groupBy === "algo" ? algos : methods;
  const groupedChartData = groupedData.map((group) => ({ group, ...Object.fromEntries(selected.map((config) => [configId(config), config[groupBy] === group ? config[metricSource][metric] : null])) }));

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-bold">Порівняння всіх моделей</h1><p className="mt-1 text-sm text-slate-500">Оберіть до 5 комбінацій у heatmap або таблиці для детального порівняння.</p></div>
    {configs.length === 0 ? <Card title="Конфігурації моделей"><p className="text-sm text-slate-500">Дані конфігурацій відсутні або ще завантажуються.</p></Card> : <>
      <div className="grid gap-4 xl:grid-cols-2">{(["recall", "f1"] as const).map((key) => <Heatmap key={key} title={metricLabel(key)} methods={methods} algos={algos} values={algos.map((algo) => methods.map((method) => configs.find((config) => config.algo === algo && config.method === method)?.[metricSource][key] ?? null))} metric={key} source={metricSource} configs={configs} selectedIds={selectedConfigIds} onCellClick={(algo, method) => toggle(`${algo}|${method}`)} />)}</div>
      <Card title="Усі конфігурації"><DataTable columns={tableColumns as any} data={metricRows} exportFilename={`configs-${selectedDataset}.csv`} rowKey={(row) => row.id} selectedIds={selectedConfigIds} onToggleRow={toggle} badges={(row) => [...(row.id === bestId ? ["Найкраща"] : []), ...(row.id === baselineId ? ["Базова"] : [])]} filters={[{ label: "Алгоритм", options: algos, value: algoFilter, onChange: setAlgoFilter, getValue: (row: ConfigMetrics) => row.algo }, { label: "Метод", options: methods, value: methodFilter, onChange: setMethodFilter, getValue: (row: ConfigMetrics) => row.method }]} /></Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Профіль метрик вибраних моделей"><div className="h-80">{selected.length ? <ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="metric" /><Tooltip /><Legend />{selected.map((config, index) => <Radar key={configId(config)} name={configId(config)} dataKey={configId(config)} stroke={COLORS[index]} fill={COLORS[index]} fillOpacity={0.12} />)}</RadarChart></ResponsiveContainer> : <p className="p-10 text-center text-slate-500">Оберіть моделі в таблиці або heatmap.</p>}</div></ChartCard>
        <ChartCard title="ROC та Precision–Recall криві"><div className="grid gap-3 md:grid-cols-2">{(["roc", "pr"] as const).map((kind) => <div key={kind} className="h-72">{curves.length ? <ResponsiveContainer width="100%" height="100%"><LineChart><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" dataKey={kind === "roc" ? "fpr" : "recall"} domain={[0, 1]} /><YAxis type="number" dataKey={kind === "roc" ? "tpr" : "precision"} domain={[0, 1]} /><Tooltip /><Legend />{curves.map((curve, index) => <Line key={`${curve.algo}|${curve.method}|${kind}`} data={kind === "roc" ? curve.roc.fpr.map((fpr, point) => ({ fpr, tpr: curve.roc.tpr[point] })) : curve.pr.recall.map((recall, point) => ({ recall, precision: curve.pr.precision[point] }))} dataKey={kind === "roc" ? "tpr" : "precision"} name={`${curve.algo} / ${curve.method}`} dot={false} stroke={COLORS[index % COLORS.length]} isAnimationActive={false} />)}</LineChart></ResponsiveContainer> : <p className="p-8 text-center text-slate-500">{curveError || "Оберіть моделі для побудови кривих."}</p>}</div>)}</div></ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-2"><ChartCard title="Precision vs Recall · усі конфігурації"><div className="h-80"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid /><XAxis type="number" dataKey="precision" name="Precision" domain={[0, 1]} /><YAxis type="number" dataKey="recall" name="Recall" domain={[0, 1]} /><ZAxis range={[70, 130]} /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Legend />{methods.map((method) => <Scatter key={method} name={method} data={points.filter((point) => point.method === method)} fill={BALANCE_COLORS[method]} shape="circle" />)}</ScatterChart></ResponsiveContainer></div><p className="mt-2 text-xs text-slate-500">Маркер алгоритму: {Object.entries(ALGO_MARKERS).map(([algo, shape]) => `${algo} — ${shape}`).join(" · ")}</p></ChartCard>
        <ChartCard title="Порівняння вибраної метрики"><div className="mb-2 flex flex-wrap gap-3"><label className="text-xs">Метрика<select aria-label="Метрика графіка" value={metric} onChange={(event) => setMetric(event.target.value as MetricName)} className="ml-2 rounded border p-1">{METRIC_KEYS.map((key) => <option key={key} value={key}>{metricLabel(key)}</option>)}</select></label><label className="text-xs">Групування<select aria-label="Групування стовпців" value={groupBy} onChange={(event) => setGroupBy(event.target.value as "algo" | "method")} className="ml-2 rounded border p-1"><option value="algo">За алгоритмом</option><option value="method">За методом</option></select></label></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={groupedChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="group" /><YAxis /><Tooltip /><Legend />{selected.map((config, index) => <Bar key={configId(config)} dataKey={configId(config)} fill={COLORS[index]} />)}</BarChart></ResponsiveContainer></div></ChartCard></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{selected.map((config) => { const [[tn, fp], [fn, tp]] = config.cm; return <Card key={configId(config)} title={`${config.algo} · ${config.method}`}><div className="grid grid-cols-2 gap-2 text-center"><div className="rounded bg-slate-100 p-3 dark:bg-slate-800">TN <b>{tn}</b></div><div className="rounded bg-red-50 p-3 dark:bg-red-950/30">FP <b>{fp}</b><small className="block">{fp + tn ? formatNumber(fp / (fp + tn), 1) : "0,0 %"} рядка</small></div><div className="rounded bg-amber-50 p-3 dark:bg-amber-950/30">FN <b>{fn}</b><small className="block">{fn + tp ? formatNumber(fn / (fn + tp), 1) : "0,0 %"} рядка</small></div><div className="rounded bg-green-50 p-3 dark:bg-green-950/30">TP <b>{tp}</b><small className="block">{fn + tp ? formatNumber(tp / (fn + tp), 1) : "0,0 %"} рядка</small></div></div><p className="mt-2 text-xs text-slate-500">Факт — рядки · Прогноз — стовпці</p></Card>; })}</div>
    </>}</div>;
}
