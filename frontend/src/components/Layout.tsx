import { useMemo, useState } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  exportFilename?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Пошук…',
  exportFilename = 'export.csv',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const list = normalized
      ? data.filter((row) =>
          Object.values(row)
            .join(' ')
            .toLowerCase()
            .includes(normalized),
        )
      : data;

    if (!sortKey) return list;

    return [...list].sort((a, b) => {
      const left = a[sortKey as keyof T];
      const right = b[sortKey as keyof T];

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left;
      }

      const leftText = String(left ?? '');
      const rightText = String(right ?? '');
      return sortDirection === 'asc'
        ? leftText.localeCompare(rightText)
        : rightText.localeCompare(leftText);
    });
  }, [data, search, sortDirection, sortKey]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const exportCsv = () => {
    const header = columns.map((column) => column.header).join(',');
    const rows = filteredData.map((row) =>
      columns
        .map((column) => {
          const value = column.render ? column.render(row) : row[(column.key as keyof T) as string];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 md:max-w-xs"
        />
        <button type="button" onClick={exportCsv} className="soft-button self-end md:self-auto">
          Експорт CSV
        </button>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
                  {column.sortable === false ? (
                    <span>{column.header}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSort(String(column.key))}
                      className="inline-flex items-center gap-2"
                    >
                      {column.header}
                      {sortKey === String(column.key) ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                  Немає даних для відображення.
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-200 last:border-none dark:border-slate-700">
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${String(column.key)}`} className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                      {column.render ? column.render(row) : row[(column.key as keyof T) as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
