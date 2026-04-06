"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLeaveRequestSchema } from "@/lib/schemas/leave";
import { calculateLeaveDays, formatDayTimeLabel } from "@/lib/utils";

type LeaveTypeOption = {
  id: string;
  name: string;
  maxDaysPerYear: number;
  description: string | null;
};

type LeaveBalanceCard = {
  id: string;
  name: string;
  total: number;
  used: number;
  pending: number;
  remaining: number;
  description?: string | null;
};

type LeaveApplyWizardProps = {
  leaveTypes: LeaveTypeOption[];
  holidays: Array<{ id: string; name: string; date: Date | string }>;
  balanceCards: LeaveBalanceCard[];
};

const steps = [
  "Leave type",
  "Date range",
  "Coverage details",
  "Review & submit",
];

const initialState = {
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  dayTime: "full_day" as const,
  dutyIncharge: "",
  reason: "",
  confirmation: false,
};

export function LeaveApplyWizard({
  leaveTypes,
  holidays,
  balanceCards,
}: LeaveApplyWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedType = leaveTypes.find((leaveType) => leaveType.id === formData.leaveTypeId);
  const selectedBalance = balanceCards.find((balance) => balance.id === formData.leaveTypeId);
  const holidayDates = holidays.map((holiday) => holiday.date);

  const calculatedDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) {
      return 0;
    }

    return calculateLeaveDays({
      startDate: formData.startDate,
      endDate: formData.endDate,
      dayTime: formData.dayTime,
      holidays: holidayDates,
    });
  }, [formData.dayTime, formData.endDate, formData.startDate, holidayDates]);

  const projectedRemaining = Math.max(
    (selectedBalance?.remaining ?? selectedType?.maxDaysPerYear ?? 0) - calculatedDays,
    0
  );
  const selectedDayTimeLabel = formData.dayTime
    ? formatDayTimeLabel(formData.dayTime)
    : "";

  function applyFieldErrors() {
    const result = createLeaveRequestSchema.safeParse(formData);

    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const flattened = result.error.flatten().fieldErrors;
    const nextErrors = Object.fromEntries(
      Object.entries(flattened)
        .filter(([, messages]) => messages && messages.length > 0)
        .map(([field, messages]) => [field, messages?.[0] ?? "Invalid value"])
    );

    setFieldErrors(nextErrors);
    return false;
  }

  function validateCurrentStep() {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.leaveTypeId) {
        nextErrors.leaveTypeId = "Please select a leave type.";
      }
    }

    if (step === 1) {
      if (!formData.startDate) {
        nextErrors.startDate = "Please select a start date.";
      }

      if (!formData.endDate) {
        nextErrors.endDate = "Please select an end date.";
      }

      if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
        nextErrors.endDate = "End date must be on or after the start date.";
      }

      if (
        formData.dayTime !== "full_day" &&
        formData.startDate &&
        formData.endDate &&
        formData.startDate !== formData.endDate
      ) {
        nextErrors.dayTime = "Half-day requests must start and end on the same day.";
      }

      if (!nextErrors.startDate && !nextErrors.endDate && calculatedDays <= 0) {
        nextErrors.endDate = "Please choose working days only for your leave request.";
      }
    }

    if (step === 2) {
      if (formData.dutyIncharge.trim().length < 2) {
        nextErrors.dutyIncharge = "Duty incharge must be at least 2 characters.";
      }

      if (formData.reason.trim().length < 10) {
        nextErrors.reason = "Please provide a short reason for your leave.";
      }
    }

    if (step === 3 && !formData.confirmation) {
      nextErrors.confirmation = "Please confirm that the leave details are correct.";
    }

    const fieldsToResetByStep: Array<Array<keyof typeof formData>> = [
      ["leaveTypeId", "dayTime"],
      ["startDate", "endDate"],
      ["dutyIncharge", "reason"],
      ["confirmation"],
    ];

    setFieldErrors((currentErrors) => {
      const nextState = { ...currentErrors };
      for (const field of fieldsToResetByStep[step] ?? []) {
        delete nextState[field];
      }

      return {
        ...nextState,
        ...nextErrors,
      };
    });

    return Object.keys(nextErrors).length === 0;
  }

  function goToNextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = createLeaveRequestSchema.safeParse(formData);
    if (!result.success) {
      applyFieldErrors();
      toast.error("Please review the leave form and fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit your leave request.");
      }

      toast.success("Leave request submitted successfully.");
      router.push("/leave");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your leave request.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((label, index) => {
          const active = index === step;
          const complete = index < step;

          return (
            <li
              key={label}
              className={`rounded-xl border px-4 py-3 text-sm ${
                active
                  ? "border-[#2E75B6] bg-[#2E75B6]/5"
                  : complete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-border bg-background"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {index + 1}
              </p>
              <p className="mt-1 font-medium text-foreground">{label}</p>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Choose a leave type</h2>
              <p className="text-sm text-muted-foreground">
                Start with the leave category and whether this is a full-day or half-day request.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="leave-type">
                  Leave type
                </label>
                <Select
                  value={formData.leaveTypeId}
                  onValueChange={(value) =>
                    setFormData((current) => ({ ...current, leaveTypeId: value ?? "" }))
                  }
                >
                  <SelectTrigger id="leave-type" className="w-full">
                    <SelectValue placeholder="Select a leave type">
                      {selectedType?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((leaveType) => (
                      <SelectItem key={leaveType.id} value={leaveType.id}>
                        {leaveType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.leaveTypeId ? (
                  <p className="text-xs text-red-600">{fieldErrors.leaveTypeId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="day-time">
                  Day time
                </label>
                <Select
                  value={formData.dayTime}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      dayTime: (value ?? "full_day") as typeof formData.dayTime,
                    }))
                  }
                >
                  <SelectTrigger id="day-time" className="w-full">
                    <SelectValue placeholder="Select a day time">
                      {selectedDayTimeLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["full_day", "forenoon", "afternoon"] as const).map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatDayTimeLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedType ? (
              <div className="rounded-xl border border-[#BDD7EE] bg-[#F8FBFF] p-4">
                <p className="text-sm font-semibold text-foreground">{selectedType.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedType.description ?? "No additional policy notes for this leave type yet."}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Policy allowance</p>
                    <p className="font-semibold text-foreground">
                      {selectedBalance?.total ?? selectedType.maxDaysPerYear} days/year
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Used so far</p>
                    <p className="font-semibold text-foreground">{selectedBalance?.used ?? 0} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending requests</p>
                    <p className="font-semibold text-foreground">{selectedBalance?.pending ?? 0} days</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pick your dates</h2>
              <p className="text-sm text-muted-foreground">
                Weekends and company holidays are excluded automatically from the leave duration.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="start-date">
                  Start date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, startDate: event.target.value }))
                  }
                />
                {fieldErrors.startDate ? (
                  <p className="text-xs text-red-600">{fieldErrors.startDate}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="end-date">
                  End date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, endDate: event.target.value }))
                  }
                />
                {fieldErrors.endDate ? (
                  <p className="text-xs text-red-600">{fieldErrors.endDate}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Working days</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{calculatedDays || "—"}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining after apply</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{projectedRemaining}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Holiday exclusions</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {holidays.length} holiday entries are considered in the calculation preview.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Coverage and handover</h2>
              <p className="text-sm text-muted-foreground">
                Share who will cover the work and add enough context for your manager to approve quickly.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="duty-incharge">
                Duty incharge
              </label>
              <Input
                id="duty-incharge"
                value={formData.dutyIncharge}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, dutyIncharge: event.target.value }))
                }
                placeholder="Example: Priya Nair"
              />
              {fieldErrors.dutyIncharge ? (
                <p className="text-xs text-red-600">{fieldErrors.dutyIncharge}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="leave-reason">
                Reason
              </label>
              <Textarea
                id="leave-reason"
                value={formData.reason}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, reason: event.target.value }))
                }
                rows={5}
                placeholder="Briefly describe the reason for your leave request."
              />
              {fieldErrors.reason ? (
                <p className="text-xs text-red-600">{fieldErrors.reason}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Review and confirm</h2>
              <p className="text-sm text-muted-foreground">
                Check the summary below, then confirm before submitting for approval.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Leave type</p>
                <p className="mt-1 font-semibold text-foreground">{selectedType?.name ?? "—"}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                <p className="mt-1 font-semibold text-foreground">{calculatedDays} day(s)</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Dates</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formData.startDate || "—"} to {formData.endDate || "—"}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Duty incharge</p>
                <p className="mt-1 font-semibold text-foreground">{formData.dutyIncharge || "—"}</p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border bg-[#F8FBFF] p-4 text-sm">
              <input
                type="checkbox"
                checked={formData.confirmation}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    confirmation: event.target.checked,
                  }))
                }
                className="mt-1"
              />
              <span>
                I confirm the leave details are accurate and I have coordinated with my duty incharge.
              </span>
            </label>
            {fieldErrors.confirmation ? (
              <p className="text-xs text-red-600">{fieldErrors.confirmation}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Preview excludes weekends and holidays automatically.
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((currentStep) => Math.max(currentStep - 1, 0))}
            disabled={step === 0 || submitting}
          >
            <ChevronLeft />
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button type="button" onClick={goToNextStep} disabled={submitting}>
              <ChevronRight />
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? <ClipboardCheck className="animate-pulse" /> : <Send />}
              Submit request
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
