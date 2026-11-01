import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { Loader } from '../components/Loader';
import { api } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import type { Patient, PredictRequest, PredictResponse } from '../types';

const initialPatient: Patient = {
  age: 58,
  gender: 'Male',
  hypertension: 1,
  heart_disease: 0,
  ever_married: 'Yes',
  work_type: 'Private',
  Residence_type: 'Urban',
  avg_glucose_level: 120,
  bmi: 27.5,
  smoking_status: 'formerly smoked',
};

export function PredictPage() {
  const { selectedDataset, predictModels, fetchPredictModels, loading } = useAppStore();
  const [selectedModel, setSelectedModel] = useState('best');
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPredictModels();
  }, [fetchPredictModels]);

  useEffect(() => {
    if (predictModels.length > 0) {
      const currentChoice = predictModels.find((model) => model.dataset === selectedDataset && model.kind === 'best');
      setSelectedModel(currentChoice?.model_id ?? predictModels[0].model_id);
    }
  }, [predictModels, selectedDataset]);

  const handleFieldChange = <K extends keyof Patient>(field: K, value: Patient[K]) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: PredictRequest = {
        dataset: selectedDataset,
        model_id: selectedModel,
        patient,
      };
      const response = await api.predict(payload);
      setResult(response);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не вдалося виконати прогноз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card title="Прогноз для пацієнта" subtitle={`Датасет ${selectedDataset}`}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Модель</span>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {predictModels.length > 0 ? (
                predictModels
                  .filter((model) => model.dataset === selectedDataset)
                  .map((model) => (
                    <option key={model.model_id} value={model.model_id}>
                      {model.model_id} ({model.algo})
                    </option>
                  ))
              ) : (
                <option value="best">best</option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Вік</span>
            <input type="number" value={patient.age} onChange={(event) => handleFieldChange('age', Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Gender</span>
            <select value={patient.gender} onChange={(event) => handleFieldChange('gender', event.target.value as Patient['gender'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Гіпертонія</span>
            <select value={patient.hypertension} onChange={(event) => handleFieldChange('hypertension', Number(event.target.value) as 0 | 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value={0}>Ні</option>
              <option value={1}>Так</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Серцеві захворювання</span>
            <select value={patient.heart_disease} onChange={(event) => handleFieldChange('heart_disease', Number(event.target.value) as 0 | 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value={0}>Ні</option>
              <option value={1}>Так</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Ever married</span>
            <select value={patient.ever_married} onChange={(event) => handleFieldChange('ever_married', event.target.value as Patient['ever_married'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Work type</span>
            <select value={patient.work_type} onChange={(event) => handleFieldChange('work_type', event.target.value as Patient['work_type'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Private">Private</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Govt_job">Govt_job</option>
              <option value="children">children</option>
              <option value="Never_worked">Never_worked</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Residence type</span>
            <select value={patient.Residence_type} onChange={(event) => handleFieldChange('Residence_type', event.target.value as Patient['Residence_type'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Urban">Urban</option>
              <option value="Rural">Rural</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Avg glucose</span>
            <input type="number" value={patient.avg_glucose_level} onChange={(event) => handleFieldChange('avg_glucose_level', Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>BMI</span>
            <input type="number" step="0.1" value={patient.bmi} onChange={(event) => handleFieldChange('bmi', Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
            <span>Smoking status</span>
            <select value={patient.smoking_status} onChange={(event) => handleFieldChange('smoking_status', event.target.value as Patient['smoking_status'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="formerly smoked">formerly smoked</option>
              <option value="never smoked">never smoked</option>
              <option value="smokes">smokes</option>
              <option value="Unknown">Unknown</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSubmit} disabled={submitting || loading.predictions} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Розрахунок…' : 'Провести прогноз'}
          </button>
          {loading.predictions && <Loader label="Завантаження моделей…" />}
        </div>

        {formError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {formError}
          </div>
        ) : null}
      </Card>

      <Card title="Результат прогнозу" subtitle="Оцінка ризику">
        {submitting ? (
          <Loader label="Проводимо прогноз…" />
        ) : result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Клас ризику</div>
              <div className="mt-2 text-3xl font-semibold text-brand-600 dark:text-brand-400">
                {result.risk_class === 'high' ? 'Високий' : 'Низький'}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Score</div>
                <div className="mt-1 text-xl font-semibold">{result.score.toFixed(3)}</div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <div className="text-xs uppercase tracking-[0.1em] text-slate-500">Probability</div>
                <div className="mt-1 text-xl font-semibold">{result.probability !== null ? result.probability.toFixed(3) : '—'}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Найважливіші ознаки</div>
              <div className="space-y-2">
                {result.contributions.slice(0, 5).map((item) => (
                  <div key={item.feature} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span>{item.feature}</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-300">{item.delta.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Disclaimer text={result.disclaimer} />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Ще немає результатів прогнозу.
          </div>
        )}
      </Card>
    </div>
  );
}

