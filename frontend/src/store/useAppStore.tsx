import { create } from "zustand";
import { api } from "../api/client";
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
} from "../types";

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

const initialLoading: LoadingState = {
  datasets: false,
  configs: false,
  summary: false,
  preprocessing: false,
  matrix: false,
  predictions: false,
};

const messageFrom = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const useAppStore = create<AppState>((set, get) => ({
  selectedDataset: "ds1",
  metricSource: "cv",
  selectedMetric: "recall",
  selectedConfigIds: [],
  datasets: [],
  datasetComparisons: [],
  configs: [],
  summary: null,
  preprocessing: [],
  metricMatrix: null,
  predictModels: [],
  loading: initialLoading,
  error: null,

  setSelectedDataset: (selectedDataset) => set({ selectedDataset, error: null }),
  setMetricSource: (metricSource) => set({ metricSource, error: null }),
  setSelectedMetric: (selectedMetric) => set({ selectedMetric, error: null }),
  setSelectedConfigIds: (selectedConfigIds) => set({ selectedConfigIds }),

  fetchDatasets: async () => {
    set((state) => ({ loading: { ...state.loading, datasets: true }, error: null }));
    try {
      const datasets = await api.getDatasets();
      set({ datasets });
      if (datasets.length && !datasets.some((item) => item.tag === get().selectedDataset)) {
        set({ selectedDataset: datasets[0].tag as DatasetTag });
      }
    } catch (error) {
      set({ error: messageFrom(error, "Не вдалося завантажити набори даних.") });
    } finally {
      set((state) => ({ loading: { ...state.loading, datasets: false } }));
    }
  },

  fetchDatasetComparisons: async () => {
    try {
      set({ datasetComparisons: await api.getCompareDatasets() });
    } catch (error) {
      set({ error: messageFrom(error, "Не вдалося завантажити порівняння наборів даних.") });
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
      set({ configs, summary, preprocessing, selectedConfigIds: [] });
    } catch (error) {
      set({ error: messageFrom(error, "Не вдалося завантажити дані набору.") });
    } finally {
      set((state) => ({
        loading: { ...state.loading, configs: false, summary: false, preprocessing: false },
      }));
    }
  },

  fetchMetricMatrix: async (dataset = get().selectedDataset) => {
    set((state) => ({ loading: { ...state.loading, matrix: true } }));
    try {
      const { selectedMetric, metricSource } = get();
      const metricMatrix = await api.getMetricMatrix(dataset, selectedMetric, metricSource);
      set({ metricMatrix });
    } catch (error) {
      set({ error: messageFrom(error, "Не вдалося завантажити матрицю метрик.") });
    } finally {
      set((state) => ({ loading: { ...state.loading, matrix: false } }));
    }
  },

  fetchPredictModels: async () => {
    set((state) => ({ loading: { ...state.loading, predictions: true } }));
    try {
      set({ predictModels: await api.getPredictModels() });
    } catch (error) {
      set({ error: messageFrom(error, "Не вдалося завантажити моделі прогнозу.") });
    } finally {
      set((state) => ({ loading: { ...state.loading, predictions: false } }));
    }
  },

  resetError: () => set({ error: null }),
}));
