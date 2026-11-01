import { useEffect } from 'react';
import { Card } from '../components/Card';
import { ConfigPicker } from '../components/ConfigPicker';
import { DataTable } from '../components/DataTable';
import { Heatmap } from '../components/Heatmap';
import { Loader } from '../components/Loader';
import { MetricSelect } from '../components/MetricSelect';
import { useAppStore } from '../store/useAppStore';

export function ExperimentsPage() {
  const {
    selectedDataset,
    selectedMetric,
    metricSource,
    configs,
    metricMatrix,
    selectedConfigIds,
    setSelectedConfigIds,
    setSelectedMetric,
    setMetricSource,
    fetchMetricMatrix,
    loading,
  } = useAppStore();

  useEffect(() => {
    void fetchMetricMatrix(selectedDataset);
  }, [selectedDataset, metricSource, selectedMetric, fetchMetricMatrix]);

  const configOptions = configs.map((config) => `${config.algo}|${config.method}`);

  return (
    <div className="space-y-4">
      <Card title="Порівняння всіх моделей" subtitle={`Датасет ${selectedDataset}`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricSelect value={selectedMetric} onChange={setSelectedMetric} />
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Джерело метрик</span>
            <select
              value={metricSource}
              onChange={(event) => setMetricSource(event.target.value as 'cv' | 'test')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="cv">CV</option>
              <option value="test">Test</option>
            </select>
          </label>
        </div>
      </Card>

      {loading.matrix || loading.configs ? (
        <Loader label="Оновлення матриці метрик…" />
      ) : null}

      {metricMatrix ? (
        <Heatmap
          title="Матриця алгоритм × метод"
          methods={metricMatrix.methods}
          algos={metricMatrix.algos}
          values={metricMatrix.values}
          metric={metricMatrix.metric}
        />
      ) : null}

      <Card title="Вибір конфігурацій для порівняння" subtitle="Мультивибір моделей для графіків">
        <ConfigPicker options={configOptions} value={selectedConfigIds} onChange={setSelectedConfigIds} />
      </Card>

      <DataTable
        columns={[
          { key: 'algo', header: 'Алгоритм', sortable: true },
          { key: 'method', header: 'Метод', sortable: true },
          { key: 'cv', header: 'CV', render: (row) => row.cv?.f1?.toFixed(3) ?? '—', sortable: true },
          { key: 'test', header: 'Test', render: (row) => row.test?.f1?.toFixed(3) ?? '—', sortable: true },
          { key: 'fit_seconds', header: 'Fit (s)', sortable: true },
        ]}
        data={configs}
        searchPlaceholder="Пошук по алгоритму або методу…"
        exportFilename={`configs-${selectedDataset}.csv`}
      />
    </div>
  );
}
