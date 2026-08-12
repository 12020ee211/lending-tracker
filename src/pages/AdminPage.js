import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers, saveUsers } from "../services/github";
import { Card, Badge, Button, Select, Alert, Spinner, Modal, ConfirmDialog, EmptyState } from "../components/UI";
import { formatDateTime } from "../utils/format";

const ROLES = [
  { value: "viewer", label: "Viewer", desc: "Read-only access to all loans" },
  { value: "editor", label: "Editor", desc: "Can add and edit loans, no admin access" },
  { value: "admin", label: "Admin", desc: "Full loan management and user role control" },
  { value: "master_admin", label: "Master Admin", desc: "Unrestricted access, cannot be modified" },
];

const ROLE_COLORS = { master_admin: "violet", admin: "indigo", editor: "sky", viewer: "slate" };

function RoleSelect({ value, onChange, disabled }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-36">
      {ROLES.filter((r) => r.value !== "master_admin").map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </Select>
  );
}

export default function AdminPage() {
  const { currentUser, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [sha, setSha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // userId being saved
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRole, setPendingRole] = useState({}); // { userId: newRole }
  const [confirmToggle, setConfirmToggle] = useState(null); // { userId, name, active }
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { users: data, sha: s } = await getUsers();
      setUsers(data);
      setSha(s);
    } catch (e) {
      setError("Failed to load users: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!can("manage_users")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-lg font-semibold text-slate-900">Admin access required</h2>
        <p className="text-sm text-slate-500 mt-1">This page is only accessible to administrators.</p>
      </div>
    );
  }

  const handleRoleChange = (userId, newRole) => {
    setPendingRole((p) => ({ ...p, [userId]: newRole }));
  };

  const handleSaveRole = async (userId) => {
    const newRole = pendingRole[userId];
    if (!newRole) return;
    setSaving(userId);
    setError(""); setSuccess("");
    try {
      const { users: fresh, sha: freshSha } = await getUsers();
      const updated = fresh.map((u) => u.id === userId ? { ...u, role: newRole } : u);
      await saveUsers(updated, freshSha);
      setUsers(updated);
      setPendingRole((p) => { const n = { ...p }; delete n[userId]; return n; });
      setSuccess("Role updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError("Failed to update role: " + e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmToggle) return;
    const { userId, active } = confirmToggle;
    setSaving(userId);
    setError(""); setSuccess("");
    try {
      const { users: fresh, sha: freshSha } = await getUsers();
      const updated = fresh.map((u) => u.id === userId ? { ...u, active: !active } : u);
      await saveUsers(updated, freshSha);
      setUsers(updated);
      setSuccess(`User ${!active ? "activated" : "deactivated"} successfully.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError("Failed to update user: " + e.message);
    } finally {
      setSaving(null);
      setConfirmToggle(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const isSelf = (u) => u.id === currentUser.id;
  const isMasterAdmin = (u) => u.role === "master_admin";
  const canModify = (u) => !isMasterAdmin(u) && !isSelf(u);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    admins: users.filter((u) => ["admin", "master_admin"].includes(u.role)).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage user accounts and access roles</p>
      </div>

      {error && <Alert type="error" onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Registered users</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active accounts</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.admins}</p>
          <p className="text-xs text-slate-500 mt-0.5">Administrators</p>
        </Card>
      </div>

      {/* Role reference */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Role permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-start gap-2">
              <Badge color={ROLE_COLORS[r.value]}>{r.label}</Badge>
              <span className="text-xs text-slate-500 mt-0.5">{r.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* User list */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-semibold text-slate-900 flex-1">Users</h2>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" description="Registered users will appear here." />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((user) => {
              const editable = canModify(user);
              const currentRole = pendingRole[user.id] ?? user.role;
              const dirty = pendingRole[user.id] && pendingRole[user.id] !== user.role;

              return (
                <div key={user.id} className={`px-5 py-4 ${!user.active ? "opacity-60 bg-slate-50" : ""}`}>
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Avatar + info */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        {isSelf(user) && <span className="text-xs text-slate-400">(you)</span>}
                        {!user.active && <Badge color="rose">Deactivated</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Joined {formatDateTime(user.createdAt)}</p>
                    </div>

                    {/* Role control */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isMasterAdmin(user) ? (
                        <Badge color="violet">Master Admin</Badge>
                      ) : editable ? (
                        <>
                          <RoleSelect value={currentRole} onChange={(r) => handleRoleChange(user.id, r)} disabled={saving === user.id} />
                          {dirty && (
                            <Button size="sm" loading={saving === user.id} onClick={() => handleSaveRole(user.id)}>Save</Button>
                          )}
                        </>
                      ) : (
                        <Badge color={ROLE_COLORS[user.role]}>{ROLES.find((r) => r.value === user.role)?.label}</Badge>
                      )}
                    </div>

                    {/* Activate/Deactivate */}
                    {editable && (
                      <Button
                        variant={user.active ? "danger" : "success"}
                        size="sm"
                        loading={saving === user.id}
                        onClick={() => setConfirmToggle({ userId: user.id, name: user.name, active: user.active })}
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(confirmToggle)}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggleActive}
        title={confirmToggle?.active ? "Deactivate user" : "Activate user"}
        message={
          confirmToggle?.active
            ? `Deactivating ${confirmToggle?.name} will prevent them from signing in. You can reactivate them at any time.`
            : `This will allow ${confirmToggle?.name} to sign in again.`
        }
        confirmLabel={confirmToggle?.active ? "Deactivate" : "Activate"}
        variant={confirmToggle?.active ? "danger" : "success"}
      />
    </div>
  );
}
