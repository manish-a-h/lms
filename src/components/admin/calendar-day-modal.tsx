import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Umbrella, Calendar } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface UserInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  department: string | null;
  designation: string | null;
}

interface LeaveRequest {
  id: string;
  user: UserInfo;
  status: string;
  reason: string;
  dayTime: string;
}

interface CalendarDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  leaves: LeaveRequest[];
  holiday: { name: string } | null;
  activeUsersCount: number;
  onLeaveUpdated: () => void;
}

export function CalendarDayModal({
  isOpen,
  onClose,
  date,
  leaves,
  holiday,
  activeUsersCount,
  onLeaveUpdated,
}: CalendarDayModalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const pendingLeaves = leaves.filter((l) => l.status === "pending");

  const presentCount = activeUsersCount - approvedLeaves.length;

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments: `Actioned from Admin Calendar` }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Leave request ${action}d successfully`);
      onLeaveUpdated();
    } catch {
      toast.error(`Could not ${action} leave request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg bg-white/70 backdrop-blur-3xl border-white/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="h-6 w-6 text-blue-600" />
            {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </DialogTitle>
          <DialogDescription>
            {holiday ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 mt-2">
                🌟 Holiday: {holiday.name}
              </span>
            ) : (
              <span className="text-muted-foreground mt-2 inline-block">
                {presentCount} employees present • {approvedLeaves.length} absent
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {pendingLeaves.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending Approvals ({pendingLeaves.length})
              </h3>
              <div className="grid gap-3">
                {pendingLeaves.map((leave) => (
                  <div key={leave.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 overflow-hidden relative border border-white">
                        {leave.user.avatarUrl ? (
                          <Image src={leave.user.avatarUrl} alt={leave.user.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-500">
                            {leave.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-slate-900">{leave.user.name}</p>
                        <p className="text-xs text-slate-500">{leave.user.designation || "Employee"}</p>
                        <p className="text-xs mt-1 text-slate-700 font-medium">Reason: {leave.reason} ({leave.dayTime.replace("_", " ")})</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                        disabled={processingId === leave.id}
                        onClick={() => handleAction(leave.id, "approve")}
                      >
                        {processingId === leave.id ? "..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        disabled={processingId === leave.id}
                        onClick={() => handleAction(leave.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Umbrella className="h-4 w-4" /> Absent Employees ({approvedLeaves.length})
            </h3>
            {approvedLeaves.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No one is scheduled to be absent today.</p>
            ) : (
              <div className="grid gap-2">
                {approvedLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 overflow-hidden relative border border-white">
                      {leave.user.avatarUrl ? (
                        <Image src={leave.user.avatarUrl} alt={leave.user.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-500">
                          {leave.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 leading-none">{leave.user.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{leave.dayTime.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
