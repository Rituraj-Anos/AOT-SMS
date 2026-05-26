import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-sm', className)} {...p} />
  </div>
);
export const TableHeader = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('sticky top-0 z-10 bg-muted/80 backdrop-blur [&_tr]:border-b', className)} {...p} />
);
export const TableBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />;
export const TableFooter = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) =>
  <tfoot className={cn('border-t bg-muted/50 font-medium', className)} {...p} />;
export const TableRow = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted', className)} {...p} />
);
export const TableHead = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'h-10 px-3 text-left align-middle text-[11px] uppercase tracking-wider font-bold text-muted-foreground',
      className,
    )}
    {...p}
  />
);
export const TableCell = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) =>
  <td className={cn('px-3 py-3 align-middle whitespace-nowrap', className)} {...p} />;
export const TableCaption = ({ className, ...p }: React.HTMLAttributes<HTMLTableCaptionElement>) =>
  <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...p} />;
