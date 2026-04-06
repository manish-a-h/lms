"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CancelLeaveButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    const confirmed = window.confirm("Cancel this pending leave request?");
    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/leave/${requestId}/cancel`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to cancel this request.");
      }

      toast.success("Leave request cancelled.");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to cancel this request.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={submitting}
      className="w-full sm:w-auto"
    >
      {submitting ? <Loader2 className="animate-spin" /> : <XCircle />}
      Cancel
    </Button>
  );
}
