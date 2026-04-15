import { formatRoleLabel } from "@/lib/utils";
import {
  addApprovedEmailAction,
  toggleApprovedEmailStatusAction,
  updateApprovedEmailRoleAction,
  updateUserRoleAction,
} from "@/app/(dashboard)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccessManagementPanelProps = {
  approvedEmails: Array<{
    id: string;
    email: string;
    role: "employee" | "manager" | "hr_admin";
    isActive: boolean;
    createdAt: Date;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: "employee" | "manager" | "hr_admin";
    department: string | null;
    designation: string | null;
    isActive: boolean;
    createdAt: Date;
  }>;
};

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_admin", label: "HR Admin" },
] as const;

export function AccessManagementPanel({ approvedEmails, users }: AccessManagementPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="eyebrow-label">Teams access control</p>
          <h2 className="text-xl font-semibold text-foreground">Approved email list</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the email address first, choose the role, and only approved addresses will be able to finish Microsoft Teams sign-in.
          </p>
        </div>

        <form action={addApprovedEmailAction} className="mb-6 grid gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1.6fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="approved-email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <Input id="approved-email" name="email" type="email" required placeholder="person@company.com" />
          </div>

          <div className="space-y-2">
            <label htmlFor="approved-role" className="text-sm font-medium text-foreground">
              Role
            </label>
            <select
              id="approved-role"
              name="role"
              defaultValue="employee"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#2E75B6]/30"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="md:self-end">
            Add email
          </Button>
        </form>

        <div className="space-y-3">
          {approvedEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved emails yet. Add one now to start restricting Teams login.
            </p>
          ) : (
            approvedEmails.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{entry.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added on {new Date(entry.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${entry.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                    {entry.isActive ? "Allowed" : "Blocked"}
                  </span>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <form action={updateApprovedEmailRoleAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="email" value={entry.email} />
                    <div className="w-full sm:max-w-44">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Access role</label>
                      <select
                        name="role"
                        defaultValue={entry.role}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#2E75B6]/30"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" variant="outline">
                      Save role
                    </Button>
                  </form>

                  <form action={toggleApprovedEmailStatusAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="isActive" value={entry.isActive ? "false" : "true"} />
                    <Button type="submit" variant={entry.isActive ? "destructive" : "secondary"}>
                      {entry.isActive ? "Block login" : "Allow login"}
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="eyebrow-label">Role management</p>
          <h2 className="text-xl font-semibold text-foreground">Current users</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Change roles here for employees, managers, and HR admins. Saving a role also keeps the Teams allow-list in sync.
          </p>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users available yet.</p>
          ) : (
            users.map((user) => (
              <form key={user.id} action={updateUserRoleAction} className="rounded-xl border border-slate-200 p-4">
                <input type="hidden" name="id" value={user.id} />

                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email} • {formatRoleLabel(user.role)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.department ?? "No department"} • {user.designation ?? "No designation"}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full sm:max-w-44">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#2E75B6]/30"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" variant="outline">
                    Update user
                  </Button>
                </div>
              </form>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
