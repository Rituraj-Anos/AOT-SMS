import { useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContents } from './Sidebar';

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Mobile hamburger — only shows below md */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContents onItemClick={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 rounded-full bg-muted border-transparent focus-visible:bg-card"
            placeholder="Quick search…"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="relative rounded-full h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white grid place-items-center border-2 border-card">3</span>
        </button>
      </div>
    </header>
  );
}
