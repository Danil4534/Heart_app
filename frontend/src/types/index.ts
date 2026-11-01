export type MetricName =
  | 'precision'
  | 'recall'
  | 'f1'
  | 'roc_auc'
  | 'pr_auc'
  | 'mcc'
  | 'accuracy';

export type MetricSource = 'cv' | 'test';
export type DatasetTag = 'ds1' | 'ds2';
export type RiskClass = 'low' | 'high';
export type ImportanceWhich = 'best' | 'baseline';

export interface MetricSet {
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  pr_auc: number;
  mcc: number;
  accuracy: number;
}

export interface RocCurve {
  fpr: number[];
  tpr: number[];
}

export interface PrCurve {
  precision: number[];
  recall: number[];
}

export interface DatasetStats {
  tag: string;
  n: number;
  n_pos: number;
  ntr: number;
  ntr_pos: number;
  nte: number;
  nte_pos: number;
  bmi_missing: number;
  class_before_smote: Record<string, number>;
  class_after_smote: Record<string, number>;
}

export interface ConfigMetrics {
  algo: string;
  method: string;
  cv: MetricSet;
  cv_std: MetricSet;
  test: MetricSet;
  cm: number[][];
  fit_seconds: number;
  model_file: string | null;
}

export interface DeltaMetrics {
  recall: number;
  f1: number;
  pr_auc: number;
  roc_auc: number;
}

export interface ExperimentSummary {
  dataset: string;
  best: { algo: string; method: string };
  baseline: { algo: string; method: string };
  best_metrics: Record<'cv' | 'test', MetricSet>;
  baseline_metrics: Record<'cv' | 'test', MetricSet>;
  deltas: Record<'cv' | 'test', DeltaMetrics>;
}

export interface MetricMatrix {
  methods: string[];
  algos: string[];
  values: Array<Array<number | null>>;
  metric: string;
  source: MetricSource;
}

export interface CurveBundle {
  algo: string;
  method: string;
  roc: RocCurve;
  pr: PrCurve;
}

export interface ImportanceResponse {
  which: ImportanceWhich;
  algo: string;
  method: string;
  values: Record<string, number>;
}

export interface PreprocessingStep {
  step: number;
  name: string;
  transformer: string;
  columns: unknown;
  description: string;
}

export interface PredictModelInfo {
  dataset: string;
  model_id: string;
  algo: string;
  method: string;
  kind: string;
}

export interface Patient {
  age: number;
  gender: 'Male' | 'Female';
  hypertension: 0 | 1;
  heart_disease: 0 | 1;
  ever_married: 'Yes' | 'No';
  work_type: 'Private' | 'Self-employed' | 'Govt_job' | 'children' | 'Never_worked';
  Residence_type: 'Urban' | 'Rural';
  avg_glucose_level: number;
  bmi: number;
  smoking_status: 'formerly smoked' | 'never smoked' | 'smokes' | 'Unknown';
}

export interface PredictRequest {
  dataset: string;
  model_id: string;
  patient: Patient;
}

export interface Contribution {
  feature: string;
  delta: number;
}

export interface PredictResponse {
  risk_class: RiskClass;
  probability: number | null;
  score: number;
  model: {
    algo: string;
    method: string;
  };
  contributions: Contribution[];
  disclaimer: string;
}
