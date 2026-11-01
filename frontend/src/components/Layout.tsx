import { useEffect, useState, type ReactNode } from "react";
import { Moon, SunMedium } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

const navigation = [
  { to: "/", label: "Огляд", end: true },
  { to: "/preprocessing", label: "Попередня обробка" },
  { to: "/experiments", label: "Порівняння моделей" },
  { to: "/best-vs-baseline", label: "Базова vs найкраща" },
  { to: "/datasets-compare", label: "Порівняння наборів" },
  { to: "/predict", label: "Прогноз" },
];

export function Layout({ children }: { children: ReactNode }) {
  const {
    selectedDataset,
    metricSource,
    selectedMetric,
    setSelectedDataset,
    setMetricSource,
    setSelectedMetric,
    datasets,
    loading,
    fetchDatasetBundle,
    fetchMetricMatrix,
    error,
  } = useAppStore();
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("vasculorisk-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("vasculorisk-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    void fetchDatasetBundle(selectedDataset);
  }, [selectedDataset, fetchDatasetBundle]);

  useEffect(() => {
    void fetchMetricMatrix(selectedDataset);
  }, [selectedDataset, metricSource, selectedMetric, fetchMetricMatrix]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-[1800px] gap-4 p-4 xl:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 xl:block">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-brand-500">
                VasculoRisk
              </div>
              <h1 className="mt-1 text-xl font-semibold">Моделі ризику</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 space-y-4">
          <header className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="xl:hidden">
                  <div className="text-xs uppercase tracking-[0.2em] text-brand-500">
                    VasculoRisk
                  </div>
                </div>
                <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                  Датасет
                  <select
                    value={selectedDataset}
                    onChange={(event) =>
                      setSelectedDataset(
                        event.target.value as typeof selectedDataset,
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {datasets.length > 0 ? (
                      datasets.map((dataset) => (
                        <option key={dataset.tag} value={dataset.tag}>
                          {dataset.tag}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="ds1">ds1</option>
                        <option value="ds2">ds2</option>
                      </>
                    )}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                  Джерело метрик
                  <select
                    value={metricSource}
                    onChange={(event) =>
                      setMetricSource(event.target.value as typeof metricSource)
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="cv">CV</option>
                    <option value="test">Test</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                  Метрика
                  <select
                    value={selectedMetric}
                    onChange={(event) =>
                      setSelectedMetric(
                        event.target.value as typeof selectedMetric,
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {[
                      "precision",
                      "recall",
                      "f1",
                      "roc_auc",
                      "pr_auc",
                      "mcc",
                      "accuracy",
                    ].map((metric) => (
                      <option key={metric} value={metric}>
                        {metric}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setIsDark((value) => !value)}
                className="soft-button ml-auto"
                aria-label="Перемкнути тему"
              >
                {isDark ? (
                  <SunMedium className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </header>

          {loading.configs ||
          loading.summary ||
          loading.preprocessing ||
          loading.matrix ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Завантаження даних…
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <main className="space-y-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
