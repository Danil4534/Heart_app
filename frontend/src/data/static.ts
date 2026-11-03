export const DATASET_INFO = {
  ds1: { name: "Stroke Prediction Dataset", records: 5110, features: 10, positives: 249, minorityShare: "4,87 %", ratio: "≈ 19,5 : 1", missing: "bmi – 201 запис (3,93 %)" },
  ds2: { name: "Brain Stroke Dataset", records: 4981, features: 10, positives: 248, minorityShare: "4,98 %", ratio: "≈ 19,1 : 1", missing: "відсутні" },
} as const;

export const DATASET_ROWS = [
  ["Кількість записів", "records"],
  ["Кількість ознак (без id та цільової)", "features"],
  ['Записів класу "високий ризик"', "positives"],
  ["Частка міноритарного класу", "minorityShare"],
  ["Співвідношення класів (0 : 1)", "ratio"],
  ["Пропущені значення", "missing"],
] as const;

export const PREPROCESSING_STEPS = [
  ["1. Очищення", "Видалення службового поля id, дублікатів та записів із нетиповим значенням gender = «Other»", "Поле id не несе прогностичної інформації; єдиний запис із нетиповою статтю не дозволяє коректно закодувати категорію"],
  ["2. Імпутація", "Заповнення пропусків медіаною числових ознак", "bmi; медіана стійка до викидів"],
  ["3. Кодування", "One-hot encoding категоріальних ознак", "gender, ever_married, work_type, Residence_type, smoking_status"],
  ["4. Масштабування", "Стандартизація (StandardScaler)", "age, avg_glucose_level, bmi; обов'язкова для логістичної регресії та SVM"],
  ["5. Похідні ознаки", "Категоризація ІМТ за порогами ВООЗ (18,5; 25; 30)", "Недостатня вага, норма, надмірна вага, ожиріння"],
  ["6. Розбиття вибірки", "Стратифіковане розбиття 80 % / 20 % (random_state = 42)", "Окрема тестова вибірка, не використовується до фінального оцінювання"],
] as const;

export const PATIENT_FIELDS = [
  ["Вік", "age", "number", "0–120 (років)"],
  ["Стать", "gender", "select", "Male, Female"],
  ["Гіпертензія", "hypertension", "binary", "0 – немає, 1 – є"],
  ["Хвороба серця", "heart_disease", "binary", "0 – немає, 1 – є"],
  ["Перебування в шлюбі", "ever_married", "select", "Yes, No"],
  ["Тип зайнятості", "work_type", "select", "Private, Self-employed, Govt_job, children, Never_worked"],
  ["Тип місця проживання", "Residence_type", "select", "Urban, Rural"],
  ["Середній рівень глюкози", "avg_glucose_level", "number", "30–500 (мг/дл)"],
  ["Індекс маси тіла", "bmi", "number", "10–100 (кг/м²)"],
  ["Статус паління", "smoking_status", "select", "formerly smoked, never smoked, smokes, Unknown"],
] as const;

export const API_ENDPOINTS = [
  ["GET", "/api/health", "Перевірка стану сервісу"],
  ["GET", "/api/datasets", "Статистика доступних наборів даних"],
  ["GET", "/api/datasets/{ds}/preprocessing", "Етапи попередньої обробки набору даних"],
  ["GET", "/api/experiments/compare", "Порівняння базової та найкращої конфігурацій наборів"],
  ["GET", "/api/experiments/{ds}/configs", "Метрики всіх конфігурацій моделей"],
  ["GET", "/api/experiments/{ds}/matrix", "Матриця метрик алгоритмів і методів балансування"],
  ["GET", "/api/experiments/{ds}/summary", "Зведення найкращої та базової моделей"],
  ["GET", "/api/experiments/{ds}/curves?ids=…", "ROC- та Precision-Recall-криві вибраних моделей"],
  ["GET", "/api/experiments/{ds}/importance?which=best|baseline", "Permutation importance ознак"],
  ["GET", "/api/models", "Перелік доступних моделей та метадані"],
  ["POST", "/api/predict", "Прогноз ризику за клінічними показниками пацієнта"],
] as const;

export const METRICS = {
  precision: { label: "Точність", hint: "Частка правильних позитивних прогнозів серед усіх позитивних прогнозів." },
  recall: { label: "Повнота", hint: "Частка виявлених пацієнтів групи ризику." },
  f1: { label: "F1-міра", hint: "Гармонічне середнє точності та повноти." },
  roc_auc: { label: "ROC-AUC", hint: "Площа під ROC-кривою." },
  pr_auc: { label: "PR-AUC", hint: "Площа під Precision–Recall-кривою." },
  mcc: { label: "MCC (коефіцієнт Метьюса)", hint: "Збалансована оцінка якості бінарної класифікації." },
  accuracy: { label: "Accuracy", hint: "При дисбалансі ≈19:1 не відображає здатності виявляти пацієнтів групи ризику." },
} as const;
export const METRIC_KEYS = ["precision", "recall", "f1", "roc_auc", "pr_auc", "mcc", "accuracy"] as const;
export const BALANCE_COLORS: Record<string, string> = {
  "Без балансування": "#94a3b8", "Зважування класів": "#3b82f6", SMOTE: "#f59e0b", ADASYN: "#22c55e", "Borderline-SMOTE": "#a855f7",
};
export const ALGO_MARKERS: Record<string, string> = { LR: "circle", SVM: "square", RF: "triangle", GB: "diamond", LightGBM: "star" };
export const METHODS = Object.keys(BALANCE_COLORS);
export const ALGOS = Object.keys(ALGO_MARKERS);
export const formatNumber = (value: number, digits = 3) => value.toLocaleString("uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });
