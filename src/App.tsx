import { useCallback, useState } from 'react';
import { AppShell, type Page } from '@/components/AppShell';
import { ScannerPage } from '@/features/scanner/ScannerPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AdminPage } from '@/features/admin/AdminPage';
import { AcademyPage } from '@/features/academy/AcademyPage';

export default function App() {
  const [page, setPage] = useState<Page>('scanner');
  const [reportDraft, setReportDraft] = useState<{ summary: string; suspectedUrl?: string } | null>(null);

  const goToReport = useCallback((summary: string, suspectedUrl?: string) => {
    setReportDraft({ summary, suspectedUrl });
    setPage('reports');
  }, []);

  return (
    <AppShell page={page} setPage={setPage}>
      {page === 'scanner' && <ScannerPage onReportFromScan={goToReport} />}
      {page === 'reports' && (
        <ReportsPage
          externalDraft={reportDraft}
          consumeExternalDraft={() => setReportDraft(null)}
        />
      )}
      {page === 'academy' && <AcademyPage />}
      {page === 'admin' && <AdminPage />}
    </AppShell>
  );
}
