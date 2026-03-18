"use client";

import { useEffect, useMemo, useState } from "react";
import UserTable from "../../../components/UserTable";
import { getAdminUsers } from "../../../lib/adminApi";
import type { AppUser } from "../../../types";

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      setError("");

      try {
        const adminUsers = await getAdminUsers();
        setUsers(adminUsers);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [search, users]);

  const activeCount = users.filter((u) => !u.isSuspended).length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <p className="text-sm text-silver/60">
            {users.length} total &bull; {activeCount} active &bull; {suspendedCount} suspended
          </p>
        </div>

        {/* Summary chips */}
        <div className="hidden gap-2 sm:flex">
          <span className="rounded-xl border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan">
            {activeCount} Active
          </span>
          {suspendedCount > 0 && (
            <span className="rounded-xl border border-magenta/20 bg-magenta/10 px-3 py-1.5 text-xs font-semibold text-magenta">
              {suspendedCount} Suspended
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search users by name or email..."
        className="w-full rounded-xl border border-white/10 bg-onyx px-4 py-3 text-sm text-white placeholder-silver/40 transition focus:border-cyan focus:outline-none"
      />

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-sm text-silver/60">
          Loading users...
        </div>
      ) : (
        <UserTable users={filteredUsers} />
      )}
    </div>
  );
}
