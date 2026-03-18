import type { AppUser, TrustLevel } from "../types";

interface UserTableProps {
  users: AppUser[];
  onViewItems?: (id: string) => void;
}

function TrustBadge({ level }: { level: TrustLevel }) {
  const styles: Record<TrustLevel, string> = {
    trusted: "bg-cyan/15 text-cyan",
    verified: "bg-white/10 text-white",
    new: "bg-silver/10 text-silver",
  };
  const labels: Record<TrustLevel, string> = {
    trusted: "⭐ Trusted",
    verified: "✔ Verified",
    new: "👤 New",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function UserTable({
  users,
  onViewItems,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-silver/60">
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Trust Level</th>
            <th className="px-4 py-3 text-center font-semibold">Reports</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-white/5 transition hover:bg-white/5">
              {/* Name */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan/30 to-magenta/30 text-xs font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-medium text-white">{user.name}</span>
                </div>
              </td>

              {/* Email */}
              <td className="px-4 py-3 text-silver/70">{user.email}</td>

              {/* Trust */}
              <td className="px-4 py-3">
                <TrustBadge level={user.trustLevel} />
              </td>

              {/* Reports */}
              <td className="px-4 py-3 text-center font-semibold text-white">
                {user.itemsReported}
              </td>

              {/* Joined */}
              <td className="px-4 py-3 text-silver/70">{user.joinedAt}</td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    user.isSuspended
                      ? "bg-magenta/15 text-magenta"
                      : "bg-cyan/10 text-cyan"
                  }`}
                >
                  {user.isSuspended ? "Suspended" : "Active"}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                {onViewItems ? (
                  <button
                    onClick={() => onViewItems(user.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/80 transition hover:bg-white/10"
                  >
                    View Items
                  </button>
                ) : (
                  <span className="text-[11px] text-silver/45">Read only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
