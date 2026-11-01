import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BestVsBaselinePage } from './pages/BestVsBaselinePage';
import { DatasetsComparePage } from './pages/DatasetsComparePage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { OverviewPage } from './pages/OverviewPage';
import { PredictPage } from './pages/PredictPage';
import { PreprocessingPage } from './pages/PreprocessingPage';
import { useAppStore } from './store/useAppStore';

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
