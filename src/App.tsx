import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Overview } from './routes/Overview';
import { Kompensaty } from './routes/Kompensaty';
import { Prolongaty } from './routes/Prolongaty';
import { Wiekowanie } from './routes/Wiekowanie';
import { Trend } from './routes/Trend';
import { Rozrachunki } from './routes/Rozrachunki';
import { Naleznosci } from './routes/Naleznosci';
import { Zobowiazania } from './routes/Zobowiazania';

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
            <Route path="/naleznosci" element={<Naleznosci />} />
            <Route path="/zobowiazania" element={<Zobowiazania />} />
            <Route path="/wiekowanie" element={<Wiekowanie />} />
            <Route path="/kompensaty" element={<Kompensaty />} />
            <Route path="/prolongaty" element={<Prolongaty />} />
            <Route path="/rozrachunki" element={<Rozrachunki />} />
            <Route path="/trend" element={<Trend />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
