// Generic data table with optional row actions + built-in pagination.
// Columns describe how to render each cell; rows are plain objects.
// Pagination is on by default (pageSize=10) — pass pageSize={0} to disable.

import { useState, useEffect } from "react";
import Icon from "./icons.jsx";
import { EmptyState } from "./kit.jsx";

export default function DataTable({ columns, rows, rowKey = (r) => r.id, empty, onRowClick, pageSize = 10 }) {
  const [page, setPage] = useState(1);
  // reset to page 1 whenever the (filtered/searched) row set changes
  const sig = rows.map(rowKey).join("|");
  useEffect(() => { setPage(1); }, [sig]);

  if (!rows.length) {
    return (
      <div className="table-wrap">
        {empty || <EmptyState title="Nothing here yet" message="Add your first item to get started." />}
      </div>
    );
  }

  const paginate = pageSize > 0 && rows.length > pageSize;
  const totalPages = paginate ? Math.ceil(rows.length / pageSize) : 1;
  const safe = Math.min(page, totalPages);
  const pageRows = paginate ? rows.slice((safe - 1) * pageSize, safe * pageSize) : rows;
  const rangeStart = (safe - 1) * pageSize + 1;
  const rangeEnd = Math.min(safe * pageSize, rows.length);

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.actions ? "col-actions" : ""} style={c.width ? { width: c.width } : undefined}>
                  {c.actions ? "" : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={c.actions ? "col-actions" : ""}
                    onClick={c.actions ? (e) => e.stopPropagation() : undefined}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginate && (
        <div className="table-pager">
          <span className="tiny" style={{ color: "var(--text-3)" }}>Showing {rangeStart}–{rangeEnd} of {rows.length}</span>
          <div className="pager" style={{ marginTop: 0 }}>
            <button className="pager-btn" disabled={safe <= 1} onClick={() => setPage(safe - 1)} title="Previous"><Icon name="chevronLeft" size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`pager-num ${p === safe ? "on" : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pager-btn" disabled={safe >= totalPages} onClick={() => setPage(safe + 1)} title="Next"><Icon name="chevronRight" size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}
