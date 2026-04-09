"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileData = {
  name: string;
  email: string;
  nitteEmail: string;
  contactNo: string;
  panNo: string;
  pfUan: string;
  bankAcctNo: string;
  department: string;
  designation: string;
  institution: string;
  dob: string;
  dateOfJoin: string;
};

type ProfileEditFormProps = {
  initialData: ProfileData;
};

type FieldErrors = Record<string, string[] | undefined>;

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleChange(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: FieldErrors;
      } | null;

      if (!response.ok) {
        if (payload?.fieldErrors) {
          setFieldErrors(payload.fieldErrors);
        }
        throw new Error(payload?.error ?? "Unable to update profile.");
      }

      toast.success("Profile updated successfully.");
      router.push("/profile");
      router.refresh();
      // Skip finally block to prevent button re-enabling during navigation
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update profile.";
      toast.error(message);
    } 
    setSubmitting(false);
  }

  function FieldError({ field }: { field: string }) {
    const errors = fieldErrors[field];
    if (!errors?.length) return null;
    return (
      <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <section>
        <h2 className="editorial-title text-lg font-semibold text-foreground mb-4">
          Personal Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Full Name *
            </label>
            <Input
              id="profile-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              minLength={2}
              maxLength={120}
              aria-invalid={!!fieldErrors.name}
            />
            <FieldError field="name" />
          </div>

          <div>
            <label
              htmlFor="profile-dob"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Date of Birth
            </label>
            <Input
              id="profile-dob"
              type="date"
              value={form.dob}
              onChange={(e) => handleChange("dob", e.target.value)}
            />
            <FieldError field="dob" />
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section>
        <h2 className="editorial-title text-lg font-semibold text-foreground mb-4">
          Contact Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-email"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Email Address *
            </label>
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              aria-invalid={!!fieldErrors.email}
            />
            <FieldError field="email" />
          </div>

          <div>
            <label
              htmlFor="profile-nitte-email"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              NITTE Email
            </label>
            <Input
              id="profile-nitte-email"
              type="email"
              value={form.nitteEmail}
              onChange={(e) => handleChange("nitteEmail", e.target.value)}
              aria-invalid={!!fieldErrors.nitteEmail}
            />
            <FieldError field="nitteEmail" />
          </div>

          <div>
            <label
              htmlFor="profile-contact"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Contact Number
            </label>
            <Input
              id="profile-contact"
              type="tel"
              value={form.contactNo}
              onChange={(e) => handleChange("contactNo", e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              aria-invalid={!!fieldErrors.contactNo}
            />
            <FieldError field="contactNo" />
          </div>
        </div>
      </section>

      {/* Employment Information */}
      <section>
        <h2 className="editorial-title text-lg font-semibold text-foreground mb-4">
          Employment Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-department"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Department
            </label>
            <Input
              id="profile-department"
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="profile-designation"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Designation
            </label>
            <Input
              id="profile-designation"
              value={form.designation}
              onChange={(e) => handleChange("designation", e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="profile-institution"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Institution
            </label>
            <Input
              id="profile-institution"
              value={form.institution}
              onChange={(e) => handleChange("institution", e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="profile-date-of-join"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Date of Joining
            </label>
            <Input
              id="profile-date-of-join"
              type="date"
              value={form.dateOfJoin}
              onChange={(e) => handleChange("dateOfJoin", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Financial Details */}
      <section>
        <h2 className="editorial-title text-lg font-semibold text-foreground mb-4">
          Financial Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-pan"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              PAN Number
            </label>
            <Input
              id="profile-pan"
              value={form.panNo}
              onChange={(e) =>
                handleChange("panNo", e.target.value.toUpperCase())
              }
              placeholder="ABCDE1234F"
              maxLength={10}
              aria-invalid={!!fieldErrors.panNo}
            />
            <FieldError field="panNo" />
          </div>

          <div>
            <label
              htmlFor="profile-pfuan"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              PF UAN
            </label>
            <Input
              id="profile-pfuan"
              value={form.pfUan}
              onChange={(e) => handleChange("pfUan", e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="profile-bank"
              className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-1.5"
            >
              Bank Account Number
            </label>
            <Input
              id="profile-bank"
              value={form.bankAcctNo}
              onChange={(e) => handleChange("bankAcctNo", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/profile")}
          disabled={submitting}
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
          {submitting ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
