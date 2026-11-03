import { useEffect, useState, type ReactNode } from "react";
import { Moon, SunMedium } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { DATASET_INFO, METRIC_KEYS, METRICS } from "../data/static";

const navigation = [
  { to: "/", label: "Огляд", end: true },
  { to: "/preprocessing", label: "Попередня обробка" },
  { to: "/experiments", label: "Порівняння всіх моделей" },
  { to: "/best-vs-baseline", label: "Базова vs найкраща" },
  { to: "/datasets-compare", label: "Порівняння наборів" },
  { to: "/predict", label: "Прогноз для пацієнта" },
  { to: "/about", label: "Про систему" },
];

export function Layout({ children }: { children: ReactNode }) {
  const selectedDataset = useAppStore((state) => state.selectedDataset);
  const metricSource = useAppStore((state) => state.metricSource);
  const selectedMetric = useAppStore((state) => state.selectedMetric);
  const setSelectedDataset = useAppStore((state) => state.setSelectedDataset);
  const setMetricSource = useAppStore((state) => state.setMetricSource);
  const setSelectedMetric = useAppStore((state) => state.setSelectedMetric);
  const fetchDatasetBundle = useAppStore((state) => state.fetchDatasetBundle);
  const fetchMetricMatrix = useAppStore((state) => state.fetchMetricMatrix);
  const [isDark, setIsDark] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("vasculorisk-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("vasculorisk-theme", isDark ? "dark" : "light");
  }, [isDark]);
  useEffect(() => { void fetchDatasetBundle(selectedDataset); }, [selectedDataset, fetchDatasetBundle]);
  useEffect(() => { void fetchMetricMatrix(selectedDataset); }, [selectedDataset, metricSource, selectedMetric, fetchMetricMatrix]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-[1800px] gap-4 p-3 md:p-5">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80 xl:block">
          <div className="mb-6"><div className="text-xs uppercase tracking-[.2em] text-brand-500">VasculoRisk</div><h1 className="mt-1 text-xl font-semibold">Моделі ризику</h1></div>
          <nav className="space-y-1" aria-label="Головна навігація">
            {navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{item.label}</NavLink>)}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 space-y-4">
          <header className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center gap-3">
              <div className="mr-auto xl:hidden"><span className="text-xs uppercase tracking-[.2em] text-brand-500">VasculoRisk</span></div>
              <label className="text-xs text-slate-500">Набір даних<select aria-label="Обрати набір даних" value={selectedDataset} onChange={(event) => setSelectedDataset(event.target.value as typeof selectedDataset)} className="mt-1 block max-w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">{Object.entries(DATASET_INFO).map(([tag, data]) => <option key={tag} value={tag}>{tag} · {data.name}</option>)}</select></label>
              <label className="text-xs text-slate-500">Джерело метрик<select aria-label="Обрати джерело метрик" value={metricSource} onChange={(event) => setMetricSource(event.target.value as typeof metricSource)} className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"><option value="cv">Крос-валідація (train)</option><option value="test">Тест (hold-out)</option></select></label>
              <label className="text-xs text-slate-500">Метрика<select aria-label="Обрати метрику" value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value as typeof selectedMetric)} className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">{METRIC_KEYS.map((key) => <option key={key} value={key}>{METRICS[key].label}</option>)}</select></label>
              <button type="button" onClick={() => setIsDark((value) => !value)} className="soft-button ml-auto" aria-label="Перемкнути тему">{isDark ? <SunMedium size={17} /> : <Moon size={17} />}</button>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto xl:hidden" aria-label="Мобільна навігація">{navigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-xs ${isActive ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{item.label}</NavLink>)}</nav>
          </header>
          <main className="space-y-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
