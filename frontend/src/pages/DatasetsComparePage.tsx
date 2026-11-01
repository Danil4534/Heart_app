import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { useAppStore } from "@/store/useAppStore";

export function DatasetsComparePage() {
  const { datasetComparisons } = useAppStore();

  return (
    <div className="space-y-4">
      <Card title="Порівняння наборів даних" subtitle="Зведення по датасетах">
        <DataTable
          columns={[
            { key: "dataset", header: "Датасет", sortable: true },
            {
              key: "best",
              header: "Найкраща",
              render: (row) => `${row.best.algo} / ${row.best.method}`,
              sortable: true,
            },
            {
              key: "baseline",
              header: "Базова",
              render: (row) => `${row.baseline.algo} / ${row.baseline.method}`,
              sortable: true,
            },
            {
              key: "delta",
              header: "Δ Recall",
              render: (row) => row.deltas.cv.recall.toFixed(3),
              sortable: true,
            },
          ]}
          data={datasetComparisons}
          searchPlaceholder="Пошук по датасетах…"
          exportFilename="datasets-compare.csv"
        />
      </Card>
    </div>
  );
}
