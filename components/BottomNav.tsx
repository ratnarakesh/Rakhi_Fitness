'use client';

import { CalendarDays, Dumbbell, LayoutDashboard, LineChart, Pill, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const TABS = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/plan', label: 'Plan', icon: CalendarDays },
  { href: '/tracker', label: 'Log', icon: Dumbbell },
  { href: '/progress', label: 'Stats', icon: LineChart },
  { href: '/checklist', label: 'Stack', icon: Pill },
  { href: '/account', label: 'Me', icon: User },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition',
                active ? 'text-accent' : 'text-muted hover:text-white'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
