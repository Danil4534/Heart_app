import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { useAppStore } from '../store/useAppStore';

export function OverviewPage() {
  const { datasets, loading, summary, selectedDataset } = useAppStore();

  if (loading.datasets) {
    return <Loader label="Завантаження датасетів…" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.tag} title={dataset.tag} subtitle="Загальна статистика" className="min-h-[260px]">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Кількість записів</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dataset.n}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Позитивні</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dataset.n_pos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Відсутні BMI</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dataset.bmi_missing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Train / Test</span>
                <span className="font-semibold text-slate-900 dark:text-white">{dataset.ntr} / {dataset.nte}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary && (
        <Card title="Поточний датасет" subtitle={`Короткий огляд: ${selectedDataset}`}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Найкраща</div>
              <div className="mt-2 text-xl font-semibold">{summary.best.algo}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{summary.best.method}</div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Базова</div>
              <div className="mt-2 text-xl font-semibold">{summary.baseline.algo}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{summary.baseline.method}</div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Recall Δ</div>
              <div className="mt-2 text-xl font-semibold">{summary.deltas.cv.recall.toFixed(3)}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">CV</div>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500">PR-AUC Δ</div>
              <div className="mt-2 text-xl font-semibold">{summary.deltas.test.pr_auc.toFixed(3)}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Test</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
