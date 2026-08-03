import { useEffect, useState } from "react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { DataGrid, type GridColumn } from "./data-grid";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  status: "فعال" | "غیرفعال";
};

const availableRoles = [
  "ادمین کل",
  "ادمین پشتیبانی",
  "ادمین مالی",
  "ادمین محتوا",
];

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const registeredUsers: RegisteredUser[] = [
  { id: "U-1001", name: "سارا احمدی", email: "sara@example.com", phone: "0912-2220001" },
  { id: "U-1002", name: "محمد کریمی", email: "mk@example.com", phone: "0912-2220002" },
  { id: "U-1003", name: "نگار موسوی", email: "negar@example.com", phone: "0912-2220003" },
  { id: "U-1004", name: "رضا نجفی", email: "reza@example.com", phone: "0912-2220004" },
  { id: "U-1005", name: "مریم صادقی", email: "maryam@example.com", phone: "0912-2220005" },
  { id: "U-1006", name: "علی حسینی", email: "ali.h@example.com", phone: "0912-2220006" },
  { id: "U-1007", name: "زهرا قاسمی", email: "z.ghasemi@example.com", phone: "0912-2220007" },
  { id: "U-1008", name: "حسین رحیمی", email: "h.rahimi@example.com", phone: "0912-2220008" },
  { id: "U-1009", name: "سپیده طاهری", email: "sepideh@example.com", phone: "0912-2220009" },
  { id: "U-1010", name: "بهزاد علوی", email: "behzad@example.com", phone: "0912-2220010" },
];

const initialAdmins: AdminUser[] = [
  { id: "AD-001", name: "علی رضایی", email: "ali.rezaei@example.com", phone: "0912-1000001", role: "ادمین کل", createdAt: "2026-01-12", status: "فعال" },
  { id: "AD-002", name: "مریم احمدی", email: "maryam.ahmadi@example.com", phone: "0912-1000002", role: "ادمین کل", createdAt: "2026-01-15", status: "فعال" },
  { id: "AD-003", name: "حسین رحیمی", email: "h.rahimi@example.com", phone: "0912-1000003", role: "ادمین پشتیبانی", createdAt: "2026-02-08", status: "فعال" },
  { id: "AD-004", name: "نگار موسوی", email: "negar.m@example.com", phone: "0912-1000004", role: "ادمین پشتیبانی", createdAt: "2026-02-20", status: "فعال" },
  { id: "AD-005", name: "زهرا قاسمی", email: "z.ghasemi@example.com", phone: "0912-1000005", role: "ادمین مالی", createdAt: "2026-03-03", status: "فعال" },
  { id: "AD-006", name: "محمد کریمی", email: "m.karimi@example.com", phone: "0912-1000006", role: "ادمین محتوا", createdAt: "2026-03-21", status: "غیرفعال" },
];

const mapAdmin = (u: any): AdminUser => ({
  id: String(u.id),
  name: u.name || u.username,
  email: u.email || "",
  phone: u.meta?.phone || "",
  role: u.meta?.accessRole || (u.role === "superadmin" ? "ادمین کل" : "ادمین"),
  createdAt: String(u.created_at || "").slice(0, 10),
  status: u.status === "active" ? "فعال" : "غیرفعال",
});

export function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [regUsers, setRegUsers] = useState<RegisteredUser[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newRole, setNewRole] = useState(availableRoles[1]);

  const load = async () => {
    try {
      const r = await api.listUsers({ limit: 200 });
      setAdmins(r.items.filter((u: any) => u.role !== "user").map(mapAdmin));
      setRegUsers(
        r.items.filter((u: any) => u.role === "user").map((u: any) => ({
          id: String(u.id), name: u.name || u.username, email: u.email || "", phone: u.meta?.phone || "",
        })),
      );
    } catch {
      setAdmins(initialAdmins); // fallback آفلاین
    }
  };
  useEffect(() => { load(); }, []);

  // ادمین = کاربری که نقشش ادمین/سوپرادمین است؛ «افزودن ادمین» یعنی ارتقای یک کاربر عادی
  const availableUsers = regUsers;

  const createAdmin = async () => {
    const user = regUsers.find((u) => u.id === selectedUserId);
    if (!user) {
      toast.error("لطفاً یک کاربر را انتخاب کنید");
      return;
    }
    try {
      await api.updateUser(user.id, { role: "admin", meta: { accessRole: newRole } });
      toast.success("ادمین جدید اضافه شد");
      await load();
    } catch {
      toast.error("خطا در افزودن ادمین");
    }
    setSelectedUserId("");
    setNewRole(availableRoles[1]);
    setAddOpen(false);
  };

  const changeRole = async (id: string, role: string) => {
    setAdmins((a) => a.map((x) => (x.id === id ? { ...x, role } : x)));
    try { await api.updateUser(id, { meta: { accessRole: role } }); toast.success("سطح دسترسی به‌روزرسانی شد"); }
    catch { toast.error("خطا در به‌روزرسانی"); }
  };

  const deleteAdmin = async (id: string) => {
    try {
      await api.updateUser(id, { role: "user", meta: { accessRole: null } });
      toast.success("دسترسی ادمین حذف شد");
      await load();
    } catch {
      toast.error("خطا در حذف دسترسی");
    }
  };

  const columns: GridColumn[] = [
    { field: "id", headerName: "شناسه", filterType: "text", width: 120 },
    { field: "name", headerName: "نام", filterType: "text" },
    { field: "email", headerName: "ایمیل", filterType: "text", flex: 2 },
    { field: "phone", headerName: "تلفن", filterType: "text" },
    {
      field: "role",
      headerName: "سطح دسترسی",
      filterType: "set",
      cellRenderer: (params: { value: string; data: AdminUser }) => (
        <Select
          value={params.value}
          onValueChange={(v) => changeRole(params.data.id, v)}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    { field: "status", headerName: "وضعیت", filterType: "set" },
    { field: "createdAt", headerName: "تاریخ ایجاد", filterType: "date" },
    {
      field: "actions",
      headerName: "عملیات",
      width: 110,
      filterType: "text",
      sortable: false,
      cellRenderer: (params: { data: AdminUser }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(params.data)}
        >
          <Trash2 className="h-4 w-4 ml-1" />
          حذف
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>ادمین‌ها</h1>
          <p className="text-sm text-muted-foreground">
            لیست ادمین‌های پنل که توسط سوپر ادمین مدیریت می‌شوند
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-1" />
              افزودن ادمین جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن ادمین جدید</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>انتخاب کاربر</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="کاربر را از لیست انتخاب کنید..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        کاربر جدیدی برای افزودن وجود ندارد
                      </div>
                    ) : (
                      availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex flex-col">
                            <span>{u.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {u.email} · {u.phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>سطح دسترسی</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                انصراف
              </Button>
              <Button onClick={createAdmin}>افزودن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">کل ادمین‌ها</span>
              <span className="text-2xl">{admins.length}</span>
            </div>
            <ShieldCheck className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">فعال</span>
              <span className="text-2xl">
                {admins.filter((a) => a.status === "فعال").length}
              </span>
            </div>
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">غیرفعال</span>
              <span className="text-2xl">
                {admins.filter((a) => a.status === "غیرفعال").length}
              </span>
            </div>
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست ادمین‌ها</span>
            <Badge variant="secondary">{admins.length} ادمین</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid rowData={admins} columnDefs={columns} />
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف ادمین</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف ادمین «{confirmDelete?.name}» مطمئن هستید؟ این عملیات
              قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) deleteAdmin(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
