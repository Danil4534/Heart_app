import { Card } from "@/components/Card";
import { Loader } from "@/components/Loader";
import { useAppStore } from "@/store/useAppStore";

export function PreprocessingPage() {
  const { preprocessing, loading, selectedDataset } = useAppStore();
  if (loading.preprocessing) {
    return <Loader label="Завантаження опису підготовки даних…" />;
  }

  return (
    <Card title="Попередня обробка" subtitle={`Датасет ${selectedDataset}`}>
      <div className="space-y-3">
        {preprocessing.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Опис етапів обробки відсутній.
          </div>
        ) : (
          preprocessing.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Крок {step.step}: {step.name}
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-200">
                  {step.transformer}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {step.description}
              </div>
              {step.columns && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Колонки:{" "}
                  {Array.isArray(step.columns)
                    ? step.columns.join(", ")
                    : JSON.stringify(step.columns)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
