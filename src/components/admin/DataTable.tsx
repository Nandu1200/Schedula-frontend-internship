"use client";

import type { ReactNode } from "react";

type DataTableColumn<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (item: T, index: number) => string;
  emptyMessage?: string;
};

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No data available.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-xl text-slate-400">
          —
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-600">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className="transition hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-5 py-4 text-sm text-slate-600"
                  >
                    {column.render
                      ? column.render(item)
                      : String(
                          (item as Record<string, unknown>)[
                            column.key
                          ] ?? "—"
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}