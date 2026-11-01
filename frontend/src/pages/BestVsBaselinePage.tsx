import { Card } from "@/components/Card";
import { Loader } from "@/components/Loader";
import { useAppStore } from "@/store/useAppStore";

export function BestVsBaselinePage() {
  const { summary, loading, selectedDataset } = useAppStore();

  if (loading.summary) {
    return <Loader label="Розрахунок порівняння…" />;
  }

  if (!summary) {
    return <Card title="Немає даних">Порівняння недоступне.</Card>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="Найкраща конфігурація"
        subtitle={`Датасет ${selectedDataset}`}
      >
        <div className="space-y-3">
          <div className="text-xl font-semibold">{summary.best.algo}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {summary.best.method}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(summary.best_metrics.cv).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
              >
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  {key}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Базова лінія" subtitle={`Датасет ${selectedDataset}`}>
        <div className="space-y-3">
          <div className="text-xl font-semibold">{summary.baseline.algo}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {summary.baseline.method}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(summary.baseline_metrics.cv).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
              >
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">
                  {key}
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="xl:col-span-2">
        <Card
          title="Зміни щодо базового рівня"
          subtitle="Δ за метриками CV / Test"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(summary.deltas.cv).map(([metric, value]) => (
              <div
                key={metric}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
                  {metric}
                </div>
                <div className="mt-2 text-2xl font-semibold text-brand-600">
                  {value.toFixed(3)}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  CV
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
