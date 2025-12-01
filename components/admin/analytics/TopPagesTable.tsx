import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TopPagesTableProps = {
  pages: Array<{ path: string; views: number }>;
};

export function TopPagesTable({ pages }: TopPagesTableProps) {
  if (!pages || pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        אין נתונים להצגה
      </div>
    );
  }

  // Helper to get readable page name
  const getPageName = (path: string) => {
    const pages: Record<string, string> = {
      '/': 'עמוד הבית',
      '/admin': 'לוח בקרה',
      '/about': 'אודות',
      '/methodology': 'מתודולוגיה',
      '/law-document': 'מסמך החוק',
      '/login': 'התחברות',
      '/admin/law-comments': 'ניהול תגובות חוק',
      '/admin/analytics': 'ניתוח תעבורה',
      '/admin/questionnaires': 'ניהול שאלונים',
    };
    return pages[path] || path;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">צפיות</TableHead>
          <TableHead className="text-right">דף</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page, index) => (
          <TableRow key={index}>
            <TableCell className="text-right font-semibold">
              {page.views.toLocaleString('he-IL')}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col">
                <span className="font-medium">{getPageName(page.path)}</span>
                <span className="text-sm text-muted-foreground">{page.path}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
