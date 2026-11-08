"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, SortDownIcon, SortIcon, SortUpIcon } from "@/components/business-os/ui/icons";
import { Button } from "@/components/business-os/ui/primitives";

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
});

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number | null;
  align?: "end";
  /** Hide below the large breakpoint to keep tablet tables readable. */
  wide?: boolean;
};

export type MobileRow = { title: ReactNode; amount?: ReactNode; caption?: ReactNode; badge?: ReactNode };

/**
 * Sortable, paginated table on desktop; a stacked row list on phones. With
 * `onRowClick`, the first cell is a button (keyboard and screen readers) and the
 * whole row is a mouse target.
 */
export function DataTable<T extends RowData>({
  rows,
  columns,
  rowKey,
  mobileRow,
  onRowClick,
  initialSort,
  pageSize = 25,
  empty,
  label,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  mobileRow: (row: T) => MobileRow;
  onRowClick?: (row: T) => void;
  initialSort?: { id: string; desc?: boolean };
  pageSize?: number;
  empty: ReactNode;
  label: string;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSort ? [{ id: initialSort.id, desc: initialSort.desc ?? false }] : []);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const defs = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        header: column.header,
        accessorFn: (row: T) => column.sortValue?.(row) ?? null,
        enableSorting: Boolean(column.sortValue),
        sortFn: "alphanumeric",
        sortUndefined: "last",
      })),
    [columns],
  );
  const byId = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

  const table = useTable({
    features,
    columns: defs,
    data: rows,
    getRowId: (row: T) => rowKey(row),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  if (rows.length === 0) return <>{empty}</>;

  const pageRows = table.getRowModel().rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
  const first = pagination.pageIndex * pagination.pageSize + 1;
  const last = Math.min(rows.length, first + pagination.pageSize - 1);

  return (
    <div>
      <div className="bos-table-wrap bos-desktop-only">
        <table className="bos-table" aria-label={label}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const column = byId.get(header.column.id);
                  const sorted = header.column.getIsSorted();
                  const wide = column?.wide ? "hidden lg:table-cell" : undefined;
                  return (
                    <th
                      key={header.id}
                      data-align={column?.align}
                      className={wide}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button type="button" className="bos-sort" onClick={header.column.getToggleSortingHandler()}>
                          {column?.header}
                          {sorted === "asc" ? <SortUpIcon size={14} /> : sorted === "desc" ? <SortDownIcon size={14} /> : <SortIcon size={14} className="opacity-40" />}
                        </button>
                      ) : (
                        column?.header
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} data-clickable={onRowClick ? "" : undefined} onClick={onRowClick ? () => onRowClick(row.original) : undefined}>
                {columns.map((column, index) => (
                  <td key={column.id} data-align={column.align} className={[column.align === "end" ? "bos-num" : "", column.wide ? "hidden lg:table-cell" : ""].join(" ")}>
                    {index === 0 && onRowClick ? (
                      <button
                        type="button"
                        className="bos-row-open"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRowClick(row.original);
                        }}
                      >
                        {column.cell(row.original)}
                      </button>
                    ) : (
                      column.cell(row.original)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bos-rows bos-mobile-only">
        {pageRows.map((row) => {
          const view = mobileRow(row.original);
          const body = (
            <>
              <div className="bos-row__main">
                <div className="bos-row__line">
                  <span className="bos-row__title">{view.title}</span>
                  {view.amount ? <span className="bos-row__amount bos-num">{view.amount}</span> : null}
                </div>
                {view.caption || view.badge ? (
                  <div className="bos-row__line">
                    <span className="bos-caption truncate">{view.caption}</span>
                    {view.badge}
                  </div>
                ) : null}
              </div>
              {onRowClick ? <ChevronRightIcon size={16} className="bos-row__chev" /> : null}
            </>
          );
          return onRowClick ? (
            <button key={row.id} type="button" className="bos-row" onClick={() => onRowClick(row.original)}>
              {body}
            </button>
          ) : (
            <div key={row.id} className="bos-row">
              {body}
            </div>
          );
        })}
      </div>
      {pageCount > 1 ? (
        <div className="bos-table-foot">
          <p className="bos-caption">
            {first}–{last} of {rows.length}
          </p>
          <div className="flex gap-1">
            <Button size="sm" iconOnly variant="ghost" aria-label="Previous page" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              <ChevronLeftIcon size={16} />
            </Button>
            <Button size="sm" iconOnly variant="ghost" aria-label="Next page" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
