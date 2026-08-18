import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Overview } from './routes/Overview';
import { WBudowie } from './routes/WBudowie';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Overview />} />
            <Route path="/wiekowanie" element={<WBudowie nazwa="Wiekowanie" />} />
            <Route path="/kompensaty" element={<WBudowie nazwa="Kompensaty" />} />
            <Route path="/prolongaty" element={<WBudowie nazwa="Prolongaty" />} />
            <Route path="/rozrachunki" element={<WBudowie nazwa="Rozrachunki" />} />
            <Route path="/trend" element={<WBudowie nazwa="Trend" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
