"""HTTP tests for every FastAPI endpoint."""

from __future__ import annotations

VALID_PATIENT = {
    "age": 67,
    "gender": "Male",
    "hypertension": 0,
    "heart_disease": 1,
    "ever_married": "Yes",
    "work_type": "Private",
    "Residence_type": "Urban",
    "avg_glucose_level": 228.69,
    "bmi": 36.6,
    "smoking_status": "formerly smoked",
}


def test_health(client) -> None:
    response = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["datasets"] == ["ds1", "ds2"]
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_health_openapi_summary_is_ukrainian(client) -> None:
    spec = client.get("/openapi.json").json()
    assert spec["paths"]["/api/health"]["get"]["summary"] == "Перевірка стану сервісу"


def test_list_datasets(client) -> None:
    response = client.get("/api/datasets")
    assert response.status_code == 200
    tags = {row["tag"] for row in response.json()}
    assert tags == {"ds1", "ds2"}
    ds1 = next(row for row in response.json() if row["tag"] == "ds1")
    assert ds1["n"] == 5109
    assert "n_pos" in ds1


def test_preprocessing_ok_and_unknown_dataset(client) -> None:
    ok = client.get("/api/datasets/ds1/preprocessing")
    assert ok.status_code == 200
    steps = ok.json()
    assert len(steps) == 3
    assert steps[0]["step"] == 1
    missing = client.get("/api/datasets/ds9/preprocessing")
    assert missing.status_code == 404


def test_configs(client) -> None:
    response = client.get("/api/experiments/ds1/configs")
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 25
    assert {"cv", "test", "algo", "method"} <= set(rows[0])
    assert client.get("/api/experiments/nope/configs").status_code == 404


def test_matrix(client) -> None:
    response = client.get(
        "/api/experiments/ds1/matrix",
        params={"metric": "recall", "source": "cv"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["algos"]) == 5
    assert len(body["methods"]) == 5
    assert len(body["values"]) == 5
    assert len(body["values"][0]) == 5
    bad_metric = client.get(
        "/api/experiments/ds1/matrix",
        params={"metric": "nope", "source": "cv"},
    )
    assert bad_metric.status_code == 422
    bad_source = client.get(
        "/api/experiments/ds1/matrix",
        params={"metric": "recall", "source": "train"},
    )
    assert bad_source.status_code == 422


def test_summary(client) -> None:
    response = client.get("/api/experiments/ds1/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["best"]["algo"] == "LR"
    assert body["baseline"]["algo"] == "SVM"
    assert "recall" in body["deltas"]["test"]
    assert "f1" in body["deltas"]["cv"]


def test_curves(client) -> None:
    ids = "LR|SMOTE,GB|Без балансування"
    response = client.get("/api/experiments/ds1/curves", params={"ids": ids})
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["algo"] == "LR"
    assert "roc" in body[0] and "pr" in body[0]
    missing = client.get(
        "/api/experiments/ds1/curves",
        params={"ids": "LR|немає"},
    )
    assert missing.status_code == 404
    empty = client.get("/api/experiments/ds1/curves", params={"ids": "   ,  "})
    assert empty.status_code == 422


def test_importance(client) -> None:
    response = client.get(
        "/api/experiments/ds1/importance",
        params={"which": "best"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["which"] == "best"
    assert "age" in body["values"]
    bad = client.get(
        "/api/experiments/ds1/importance",
        params={"which": "other"},
    )
    assert bad.status_code == 422


def test_compare(client) -> None:
    response = client.get("/api/experiments/compare")
    assert response.status_code == 200
    body = response.json()
    assert {row["dataset"] for row in body} == {"ds1", "ds2"}


def test_models(client) -> None:
    response = client.get("/api/models")
    assert response.status_code == 200
    body = response.json()
    ids = {(row["dataset"], row["model_id"]) for row in body}
    assert ("ds1", "best") in ids
    assert ("ds1", "baseline") in ids
    assert ("ds1", "LR|Без балансування") in ids


def test_predict_lr(client) -> None:
    response = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "best", "patient": VALID_PATIENT},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["risk_class"] in {"low", "high"}
    assert body["probability"] is not None
    assert isinstance(body["score"], float)
    assert body["model"]["algo"] == "LR"
    deltas = [abs(row["delta"]) for row in body["contributions"]]
    assert deltas == sorted(deltas, reverse=True)
    assert body["disclaimer"]


def test_predict_svm_probability_null(client) -> None:
    response = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "baseline", "patient": VALID_PATIENT},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model"]["algo"] == "SVM"
    assert body["probability"] is None
    assert isinstance(body["score"], float)


def test_predict_validation_422(client) -> None:
    bad_age = {**VALID_PATIENT, "age": 200}
    response = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "best", "patient": bad_age},
    )
    assert response.status_code == 422
    assert "Вік" in response.text

    bad_gender = {**VALID_PATIENT, "gender": "Other"}
    response = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "best", "patient": bad_gender},
    )
    assert response.status_code == 422

    bad_bmi = {**VALID_PATIENT, "bmi": 5}
    response = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "best", "patient": bad_bmi},
    )
    assert response.status_code == 422
    assert "ІМТ" in response.text


def test_predict_404_dataset_and_model(client) -> None:
    missing_ds = client.post(
        "/api/predict",
        json={"dataset": "ds9", "model_id": "best", "patient": VALID_PATIENT},
    )
    assert missing_ds.status_code == 404

    missing_model = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "RF|SMOTE", "patient": VALID_PATIENT},
    )
    assert missing_model.status_code == 404

    unknown_id = client.post(
        "/api/predict",
        json={"dataset": "ds1", "model_id": "not-a-model", "patient": VALID_PATIENT},
    )
    assert unknown_id.status_code == 404
