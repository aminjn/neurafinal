import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DataGrid } from "./data-grid";
import { ArrowRight, Bot, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  agentTypeConfig,
  type AgentTypeKey,
  type SubMenu,
} from "./agent-management-config";

function ItemDetail({
  subMenu,
  row,
  onBack,
}: {
  subMenu: SubMenu;
  row: any;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({ ...row });

  const save = () => {
    Object.assign(row, values);
    setEditing(false);
    toast.success("تغییرات ذخیره شد");
  };

  const cancel = () => {
    setValues({ ...row });
    setEditing(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1>
              {subMenu.itemLabel} —{" "}
              {String(values[subMenu.columns[0].field] ?? "")}
            </h1>
            <p className="text-sm text-muted-foreground">
              مشاهده و اصلاح اطلاعات
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save}>
                <Save className="h-4 w-4 ml-1" />
                ذخیره
              </Button>
              <Button size="sm" variant="outline" onClick={cancel}>
                <X className="h-4 w-4 ml-1" />
                انصراف
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 ml-1" />
              اصلاح
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subMenu.columns.map((c) => (
            <div key={c.field} className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {c.headerName}
              </Label>
              <Input
                value={String(values[c.field] ?? "")}
                disabled={!editing}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    [c.field]:
                      c.filterType === "number"
                        ? Number(e.target.value) || 0
                        : e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function MarketerAgentDetail({
  agent,
  agentType,
  onBack,
}: {
  agent: any;
  agentType: AgentTypeKey;
  onBack: () => void;
}) {
  const config = agentTypeConfig[agentType];
  const [sectionKey, setSectionKey] = useState<string>(
    config.subMenus[0]?.key ?? "",
  );
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const section = useMemo(
    () => config.subMenus.find((s) => s.key === sectionKey) ?? config.subMenus[0],
    [config, sectionKey],
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-60 shrink-0 border-l bg-sidebar/60 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate">{agent.name}</span>
              <span className="text-xs text-muted-foreground">
                {config.label}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {config.subMenus.map((m) => {
            const Icon = m.icon;
            const isActive = sectionKey === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  setSectionKey(m.key);
                  setSelectedRow(null);
                }}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-right ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {selectedRow ? (
        <ItemDetail
          subMenu={section}
          row={selectedRow}
          onBack={() => setSelectedRow(null)}
        />
      ) : (
        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div>
                <h1>
                  {agent.name} — {section.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {config.description} · بیزینس «{agent.business}»
                </p>
              </div>
            </div>
            <Badge variant="secondary">{agent.business}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{section.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataGrid
                rowData={section.rows}
                columnDefs={section.columns}
                onRowAction={(row) => setSelectedRow(row)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
