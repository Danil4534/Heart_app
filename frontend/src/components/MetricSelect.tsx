import type { MetricName } from "../types";

const METRICS: { value: MetricName; label: string }[] = [
  { value: "precision", label: "Precision" },
  { value: "recall", label: "Recall" },
  { value: "f1", label: "F1" },
  { value: "roc_auc", label: "ROC-AUC" },
  { value: "pr_auc", label: "PR-AUC" },
  { value: "mcc", label: "MCC" },
  { value: "accuracy", label: "Accuracy" },
];

interface MetricSelectProps {
  value: MetricName;
  onChange: (metric: MetricName) => void;
}

export function MetricSelect({ value, onChange }: MetricSelectProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>Метрика</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as MetricName)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {METRICS.map((metric) => (
          <option key={metric.value} value={metric.value}>
            {metric.label}
          </option>
        ))}
      </select>
    </label>
  );
}
