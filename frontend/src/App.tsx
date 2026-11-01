import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { OverviewPage } from "./pages/OverviewPage";
import { PreprocessingPage } from "./pages/PreprocessingPage";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { BestVsBaselinePage } from "./pages/BestVsBaselinePage";
import { DatasetsComparePage } from "./pages/DatasetsComparePage";
import { PredictPage } from "./pages/PredictPage";

export default function App() {
  const { fetchDatasets, fetchDatasetComparisons } = useAppStore();

  useEffect(() => {
    void fetchDatasets();
    void fetchDatasetComparisons();
  }, [fetchDatasets, fetchDatasetComparisons]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/preprocessing" element={<PreprocessingPage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/best-vs-baseline" element={<BestVsBaselinePage />} />
        <Route path="/datasets-compare" element={<DatasetsComparePage />} />
        <Route path="/predict" element={<PredictPage />} />
      </Routes>
    </Layout>
  );
}
