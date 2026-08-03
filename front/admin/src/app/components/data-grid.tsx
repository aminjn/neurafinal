import { useMemo, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  type ColDef,
  type IFilterParams,
  type IDoesFilterPassParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Settings2 } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const SetFilter = forwardRef((props: IFilterParams, ref) => {
  const { api, colDef, filterChangedCallback } = props;
  const [values, setValues] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const set = new Set<string>();
    api.forEachNode((node) => {
      const v = node.data?.[colDef.field as string];
      if (v !== undefined && v !== null && v !== "") set.add(String(v));
    });
    const arr = Array.from(set).sort();
    setValues(arr);
    setSelected(new Set(arr));
  }, [api, colDef.field]);

  useImperativeHandle(ref, () => ({
    isFilterActive() {
      return selected.size !== values.length;
    },
    doesFilterPass(p: IDoesFilterPassParams) {
      const v = p.data?.[colDef.field as string];
      return selected.has(String(v));
    },
    getModel() {
      if (selected.size === values.length) return null;
      return { values: Array.from(selected) };
    },
    setModel(model: { values: string[] } | null) {
      setSelected(new Set(model?.values ?? values));
    },
  }));

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSelected(next);
    setTimeout(() => filterChangedCallback(), 0);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(values) : new Set());
    setTimeout(() => filterChangedCallback(), 0);
  };

  const filtered = values.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase()),
  );
  const allChecked = selected.size === values.length;

  return (
    <div className="p-2 w-56 bg-popover text-popover-foreground" dir="rtl">
      <Input
        placeholder="جستجو..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 mb-2"
      />
      <label className="flex items-center gap-2 px-1 py-1 text-sm border-b mb-1">
        <Checkbox
          checked={allChecked}
          onCheckedChange={(c) => toggleAll(Boolean(c))}
        />
        <span>(انتخاب همه)</span>
      </label>
      <div className="max-h-56 overflow-auto">
        {filtered.map((v) => (
          <label
            key={v}
            className="flex items-center gap-2 px-1 py-1 text-sm hover:bg-accent rounded cursor-pointer"
          >
            <Checkbox
              checked={selected.has(v)}
              onCheckedChange={() => toggle(v)}
            />
            <span className="truncate">{v}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

export type GridColumn = ColDef & {
  filterType?: "text" | "number" | "date" | "set";
};

// نمایشِ تاریخ به‌صورتِ شمسی در همهٔ ستون‌های نوعِ تاریخ
function toShamsi(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  try { return d.toLocaleDateString("fa-IR"); } catch { return String(v); }
}

function resolveFilter(c: GridColumn): ColDef {
  const { filterType, ...rest } = c;
  switch (filterType) {
    case "number":
      return { ...rest, filter: "agNumberColumnFilter" };
    case "date":
      return { ...rest, filter: "agDateColumnFilter", valueFormatter: (rest as any).valueFormatter || ((p: any) => toShamsi(p.value)) };
    case "set":
      return { ...rest, filter: SetFilter };
    case "text":
    default:
      return { ...rest, filter: "agTextColumnFilter" };
  }
}

export function DataGrid<T = any>({
  rowData,
  columnDefs,
  height = 480,
  onRowAction,
  actionLabel = "مدیریت",
  rowActions,
  actionsWidth,
}: {
  rowData: T[];
  columnDefs: GridColumn[];
  height?: number | string;
  onRowAction?: (row: T) => void;
  actionLabel?: string;
  rowActions?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
    onClick: (row: T) => void;
  }[];
  actionsWidth?: number;
}) {
  const cols = useMemo(() => {
    const base = columnDefs.map(resolveFilter);
    if (!onRowAction && !rowActions) return base;
    const actionsCol: ColDef = {
      headerName: "عملیات",
      colId: "__actions",
      pinned: "left",
      filter: false,
      sortable: false,
      resizable: false,
      suppressMovable: true,
      lockPosition: true,
      width: actionsWidth ?? (rowActions ? 180 : 130),
      minWidth: 110,
      flex: 0,
      cellRenderer: (p: any) => {
        if (rowActions) {
          return (
            <div className="flex items-center gap-1 h-full">
              {rowActions.map((a) => (
                <Button
                  key={a.label}
                  size="sm"
                  variant={a.variant ?? "outline"}
                  className="h-7 px-2 gap-1"
                  onClick={() => a.onClick(p.data)}
                >
                  {a.icon && <a.icon className="h-3.5 w-3.5" />}
                  <span>{a.label}</span>
                </Button>
              ))}
            </div>
          );
        }
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 gap-1"
            onClick={() => onRowAction!(p.data)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>{actionLabel}</span>
          </Button>
        );
      },
    };
    return [actionsCol, ...base];
  }, [columnDefs, onRowAction, actionLabel, rowActions, actionsWidth]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 120,
    }),
    [],
  );

  return (
    <div
      className="ag-theme-quartz ag-theme-vazir w-full"
      style={{ height, direction: "rtl" }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={cols}
        defaultColDef={defaultColDef}
        enableRtl
        animateRows
        suppressDragLeaveHidesColumns={false}
        rowDragManaged={false}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
      />
    </div>
  );
}
