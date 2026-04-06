"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ManagerApprovalActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [submittingAction, setSubmittingAction] = useState<"approved" | "rejected" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [comment, setComment] = useState("");

  async function submitDecision(action: "approved" | "rejected") {
    if (action === "rejected" && !comment.trim()) {
      toast.error("Please provide a comment before rejecting the request.");
      return;
    }

    setSubmittingAction(action);

    try {
      const response = await fetch(`/api/leave/approvals/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update this leave request.");
      }

      toast.success(
        action === "approved" ? "Leave request approved." : "Leave request rejected."
      );
      setRejectOpen(false);
      setComment("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update this leave request.";
      toast.error(message);
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button
        type="button"
        size="sm"
        onClick={() => submitDecision("approved")}
        disabled={submittingAction !== null}
      >
        {submittingAction === "approved" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
        Approve
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRejectOpen(true)}
        disabled={submittingAction !== null}
      >
        <XCircle />
        Reject
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject leave request</DialogTitle>
            <DialogDescription>
              Add a short explanation so the employee knows what needs attention.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor={`reject-comment-${requestId}`} className="text-sm font-medium">
              Rejection comment
            </label>
            <Textarea
              id={`reject-comment-${requestId}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Example: Please resubmit with an updated duty incharge."
              rows={4}
            />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquareWarning className="h-3.5 w-3.5" />
              A comment is required when rejecting a request.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Keep pending
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => submitDecision("rejected")}
              disabled={submittingAction !== null}
            >
              {submittingAction === "rejected" ? <Loader2 className="animate-spin" /> : <XCircle />}
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
