const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Не вдалося виконати запит.';
    try {
      const payload = await response.json();
      message = payload?.detail ?? payload?.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  health: () => fetchJson<{ status: string; datasets: string[] }>(`/api/health`),
  getDatasets: () => fetchJson<import('./types').DatasetStats[]>(`/api/datasets`),
  getDatasetPreprocessing: (dataset: string) =>
    fetchJson<import('./types').PreprocessingStep[]>(`/api/datasets/${dataset}/preprocessing`),
  getDatasetConfigs: (dataset: string) =>
    fetchJson<import('./types').ConfigMetrics[]>(`/api/experiments/${dataset}/configs`),
  getDatasetSummary: (dataset: string) =>
    fetchJson<import('./types').ExperimentSummary>(`/api/experiments/${dataset}/summary`),
  getDatasetCurves: (dataset: string, ids: string[]) =>
    fetchJson<import('./types').CurveBundle[]>(`/api/experiments/${dataset}/curves?ids=${ids.join(',')}`),
  getDatasetImportance: (dataset: string, which: 'best' | 'baseline') =>
    fetchJson<import('./types').ImportanceResponse>(`/api/experiments/${dataset}/importance?which=${which}`),
  getCompareDatasets: () => fetchJson<import('./types').ExperimentSummary[]>(`/api/experiments/compare`),
  getMetricMatrix: (dataset: string, metric: string, source: 'cv' | 'test') =>
    fetchJson<import('./types').MetricMatrix>(`/api/experiments/${dataset}/matrix?metric=${encodeURIComponent(metric)}&source=${source}`),
  getPredictModels: () => fetchJson<import('./types').PredictModelInfo[]>(`/api/models`),
  predict: (payload: import('./types').PredictRequest) =>
    fetchJson<import('./types').PredictResponse>(`/api/predict`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
