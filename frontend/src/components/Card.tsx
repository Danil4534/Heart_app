import { create } from 'zustand';
import { api } from '../api/client';
import type {
  ConfigMetrics,
  DatasetStats,
  DatasetTag,
  ExperimentSummary,
  MetricMatrix,
  MetricName,
  MetricSource,
  PredictModelInfo,
  PreprocessingStep,
} from '../types';

interface LoadingState {
  datasets: boolean;
  configs: boolean;
  summary: boolean;
  preprocessing: boolean;
  matrix: boolean;
  predictions: boolean;
}

interface AppState {
  selectedDataset: DatasetTag;
  metricSource: MetricSource;
  selectedMetric: MetricName;
  selectedConfigIds: string[];
  datasets: DatasetStats[];
  datasetComparisons: ExperimentSummary[];
  configs: ConfigMetrics[];
  summary: ExperimentSummary | null;
  preprocessing: PreprocessingStep[];
  metricMatrix: MetricMatrix | null;
  predictModels: PredictModelInfo[];
  loading: LoadingState;
  error: string | null;
  setSelectedDataset: (dataset: DatasetTag) => void;
  setMetricSource: (source: MetricSource) => void;
  setSelectedMetric: (metric: MetricName) => void;
  setSelectedConfigIds: (ids: string[]) => void;
  fetchDatasets: () => Promise<void>;
  fetchDatasetComparisons: () => Promise<void>;
  fetchDatasetBundle: (dataset?: DatasetTag) => Promise<void>;
  fetchMetricMatrix: (dataset?: DatasetTag) => Promise<void>;
  fetchPredictModels: () => Promise<void>;
  resetError: () => void;
}

const defaultLoading: LoadingState = {
  datasets: false,
  configs: false,
  summary: false,
  preprocessing: false,
  matrix: false,
  predictions: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedDataset: 'ds1',
  metricSource: 'cv',
  selectedMetric: 'recall',
  selectedConfigIds: [],
  datasets: [],
  datasetComparisons: [],
  configs: [],
  summary: null,
  preprocessing: [],
  metricMatrix: null,
  predictModels: [],
  loading: defaultLoading,
  error: null,

  setSelectedDataset: (dataset) => {
    set({ selectedDataset: dataset, error: null });
  },

  setMetricSource: (source) => {
    set({ metricSource: source, error: null });
  },

  setSelectedMetric: (metric) => {
    set({ selectedMetric: metric, error: null });
  },

  setSelectedConfigIds: (ids) => set({ selectedConfigIds: ids }),

  fetchDatasets: async () => {
    set((state) => ({ loading: { ...state.loading, datasets: true }, error: null }));
    try {
      const payload = await api.getDatasets();
      set({ datasets: payload });
      if (payload.length && !payload.some((item) => item.tag === get().selectedDataset)) {
        set({ selectedDataset: payload[0].tag as DatasetTag });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Не вдалося завантажити перелік датасетів.',
      });
    } finally {
      set((state) => ({ loading: { ...state.loading, datasets: false } }));
    }
  },

  fetchDatasetComparisons: async () => {
    try {
      const payload = await api.getCompareDatasets();
      set({ datasetComparisons: payload });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Не вдалося завантажити порівняння датасетів.',
      });
    }
  },

  fetchDatasetBundle: async (dataset = get().selectedDataset) => {
    set((state) => ({
      loading: { ...state.loading, configs: true, summary: true, preprocessing: true },
      error: null,
    }));

    try {
      const [configs, summary, preprocessing] = await Promise.all([
        api.getDatasetConfigs(dataset),
        api.getDatasetSummary(dataset),
        api.getDatasetPreprocessing(dataset),
      ]);

      set({ configs, summary, preprocessing });
      set({
        selectedConfigIds:
          configs.length > 0
            ? configs.map((config) => `${config.algo}|${config.method}`)
            : [],
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Не вдалося завантажити дані датасету.',
      });
    } finally {
      set((state) => ({
        loading: { ...state.loading, configs: false, summary: false, preprocessing: false },
      }));
    }
  },

  fetchMetricMatrix: async (dataset = get().selectedDataset) => {
    set((state) => ({ loading: { ...state.loading, matrix: true }, error: null }));
    try {
      const payload = await api.getMetricMatrix(dataset, get().selectedMetric, get().metricSource);
      set({ metricMatrix: payload });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Не вдалося завантажити матрицю метрик.',
      });
    } finally {
      set((state) => ({ loading: { ...state.loading, matrix: false } }));
    }
  },

  fetchPredictModels: async () => {
    set((state) => ({ loading: { ...state.loading, predictions: true }, error: null }));
    try {
      const payload = await api.getPredictModels();
      set({ predictModels: payload });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Не вдалося завантажити моделі прогнозу.',
      });
    } finally {
      set((state) => ({ loading: { ...state.loading, predictions: false } }));
    }
  },

  resetError: () => set({ error: null }),
}));
