import { useState } from 'react';
import { Activity, BarChart3, BookOpen, ShieldHalf, Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Page = 'scanner' | 'reports' | 'academy' | 'admin';

interface ShellProps {
  page: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}

const NAV: { id: Page; label: string; icon: typeof Activity }[] = [
  { id: 'scanner', label: 'Scanner', icon: ShieldHalf },
  { id: 'reports', label: 'My Reports', icon: Activity },
  { id: 'academy', label: 'Safety Academy', icon: BookOpen },
  { id: 'admin', label: 'Admin Insights', icon: BarChart3 },
];

export function AppShell({ page, setPage, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navButton = (item: (typeof NAV)[number]) => {
    const Icon = item.icon;
    const active = page === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setPage(item.id);
          setMobileOpen(false);
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
          active
            ? 'bg-teal-500/10 text-teal-200 ring-1 ring-teal-500/30'
            : 'text-navy-300 hover:bg-navy-800/60 hover:text-navy-100',
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-navy-800 bg-navy-900/60 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <ShieldHalf className="h-7 w-7 text-teal-400" />
          <div>
            <p className="text-sm font-bold tracking-tight text-white">ThreatLens</p>
            <p className="text-[11px] text-navy-400">Phishing & fraud analysis</p>
          </div>
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(navButton)}
        </nav>
        <div className="m-3 rounded-lg border border-navy-800 bg-navy-950/60 p-3 text-[11px] leading-relaxed text-navy-400">
          Prototype. Analysis runs locally. No data leaves your browser.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-navy-800 bg-navy-900/70 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldHalf className="h-6 w-6 text-teal-400" />
          <span className="font-bold text-white">ThreatLens</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-2 text-navy-200 hover:bg-navy-800"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-navy-800 bg-navy-900/95 p-3 lg:hidden">
          <nav className="flex flex-col gap-1">{NAV.map(navButton)}</nav>
        </div>
      )}

      <main className="min-h-screen">{children}</main>
    </div>
  );
}
