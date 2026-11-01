Ты разрабатываешь систему VasculoRisk: интеллектуальную систему классификации
риска сосудистых заболеваний (инсульта) с учётом дисбаланса классов.
Это практическая часть магистерской работы. Главная цель веб-части: ВИЗУАЛЬНО
СРАВНИВАТЬ все комбинации «алгоритм × метод балансировки» на двух датасетах,
а также делать прогноз для отдельного пациента.

ЯЗЫК ИНТЕРФЕЙСА: украинский. Код, имена переменных, комментарии: английский.

СТЕК (не менять):
- Backend: Python 3.11+, FastAPI, Pydantic v2, uvicorn, pandas, numpy,
  scikit-learn, imbalanced-learn, lightgbm, joblib.
- Frontend: React 18 + TypeScript + Vite, Zustand (состояние), TailwindCSS,
  Recharts (графики), react-router-dom.
- Взаимодействие: REST API, JSON. Тесты: pytest (backend), vitest (frontend).

СТРУКТУРА РЕПОЗИТОРИЯ:
vasculorisk/
  backend/
    app/
      main.py                 # FastAPI app, CORS, подключение роутеров
      config.py               # пути, SEED=42, константы
      schemas.py              # Pydantic-модели запросов/ответов
      data.py                 # загрузка и очистка датасетов
      preprocessing.py        # шаги препроцессинга
      models.py               # фабрика классификаторов и конвейеров
      metrics.py              # метрики, ранг-критерий выбора
      explain.py              # объяснение прогноза (occlusion)
      training/run.py         # CLI: python -m app.training.run
      routers/{health,datasets,experiments,predict}.py
    data/                     # stroke1.csv, stroke2.csv (не коммитить)
    artifacts/                # результаты обучения (JSON, joblib)
    tests/
  frontend/
    src/{api,store,pages,components,types,utils}
  README.md

ВОСПРОИЗВОДИМОСТЬ (строго):
- SEED = 42 везде (split, CV, модели, сэмплеры).
- Загрузка: удалить колонку id, строки gender == "Other", дубликаты.
- Разбиение: train_test_split(test_size=0.2, stratify=y, random_state=42).
- Препроцессинг (шаги общего imblearn Pipeline, БЕЗ вложенных Pipeline):
  1) ColumnTransformer: медианная импутация числовых [age, avg_glucose_level, bmi]
     (set_output pandas, остальные колонки passthrough);
  2) FunctionTransformer: bmi_cat = pd.cut(bmi, [-inf,18.5,25,30,inf],
     labels=[under, normal, over, obese]) как строка;
  3) ColumnTransformer: StandardScaler для [age, avg_glucose_level, bmi],
     passthrough для [hypertension, heart_disease],
     OneHotEncoder(handle_unknown="ignore") для
     [gender, ever_married, work_type, Residence_type, smoking_status, bmi_cat].
- Все преобразования и семплеры обучаются ТОЛЬКО на train-части каждого фолда
  (imblearn Pipeline), чтобы не было утечки данных.
- Алгоритмы (algo): LR, SVM, RF, GB, LightGBM.
  LR: LogisticRegression(max_iter=3000)
  SVM: SVC(kernel="rbf", C=1.0, gamma="scale"), оценка через decision_function
  RF: RandomForestClassifier(n_estimators=300, min_samples_leaf=2, n_jobs=-1)
  GB: GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=3)
  LightGBM: LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=31,
            verbose=-1)
- Методы (method): "Без балансування", "Зважування класів", "SMOTE", "ADASYN",
  "Borderline-SMOTE".
  Зважування: class_weight="balanced" для LR и SVM; "balanced_subsample" для RF;
  scale_pos_weight = N_neg/N_pos для LightGBM; sample_weight=balanced для GB
  (передавать как clf__sample_weight в fit).
  SMOTE/ADASYN/BorderlineSMOTE: отдельный шаг пайплайна перед классификатором.
- Порог классификации 0.5 (для SVM используется predict).
- Метрики для класса «високий ризик» (stroke=1): precision, recall, f1, roc_auc,
  pr_auc (average_precision), mcc, accuracy.
- CV: StratifiedKFold(5, shuffle=True, random_state=42) на train, метрики
  усредняются по фолдам.
- Критерий выбора лучшей конфигурации: средний ранг по (recall, f1, pr_auc)
  среди 25 конфигураций. Базовая модель: лучшая по тому же критерию среди
  конфигураций с method == "Без балансування".

КАЧЕСТВО КОДА: типизация (mypy-friendly), docstrings у публичных функций,
обработка ошибок (понятные HTTP-ошибки), никаких захардкоженных абсолютных
путей, ESLint/Prettier на фронтенде, без неиспользуемого кода.
Не придумывай результаты: все числа в вебе берутся из artifacts/*.json,
которые создаёт скрипт обучения.