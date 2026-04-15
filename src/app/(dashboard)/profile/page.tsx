import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Pencil,
  Shield,
} from "lucide-react";
import { verifyAccessToken } from "@/lib/auth";
import { getFullProfile } from "@/lib/data/profile";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { formatRoleLabel } from "@/lib/utils";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/60">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const sessionUser = await verifyAccessToken(token).catch(() => null);
  if (!sessionUser) {
    redirect("/login");
  }

  const profile = await getFullProfile(sessionUser.sub);
  if (!profile) {
    redirect("/login");
  }

  const joinDate = profile.dateOfJoin
    ? new Date(profile.dateOfJoin).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const dobStr = profile.dob
    ? new Date(profile.dob).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="atelier-panel-muted flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="eyebrow-label">Profile</p>
          <h1 className="editorial-title text-3xl font-bold text-foreground">
            My Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal and professional details.
          </p>
        </div>

        <Link
          href="/profile/edit"
          id="edit-profile-btn"
          className="inline-flex items-center gap-2 rounded-md bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-18px_rgba(0,74,198,0.45)]"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      {/* Avatar Summary Card */}
      <div className="atelier-panel p-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <ProfileAvatar
          name={profile.name}
          avatarUrl={profile.avatarUrl}
          size="lg"
        />
        <div className="text-center sm:text-left">
          <h2 className="editorial-title text-2xl font-bold text-foreground">
            {profile.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.designation ?? "No designation set"} •{" "}
            {profile.department ?? "No department set"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {formatRoleLabel(profile.role)}
            </span>
            {profile.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="atelier-panel p-6">
          <h3 className="editorial-title text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </h3>
          <div className="divide-y divide-border/40">
            <InfoRow icon={User} label="Full Name" value={profile.name} />
            <InfoRow icon={Calendar} label="Date of Birth" value={dobStr} />
          </div>
        </div>

        {/* Contact Details */}
        <div className="atelier-panel p-6">
          <h3 className="editorial-title text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-primary" />
            Contact Details
          </h3>
          <div className="divide-y divide-border/40">
            <InfoRow icon={Mail} label="Email Address" value={profile.email} />
            <InfoRow
              icon={Phone}
              label="Contact Number"
              value={profile.contactNo}
            />
          </div>
        </div>

        {/* Employment Information */}
        <div className="atelier-panel p-6">
          <h3 className="editorial-title text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-primary" />
            Employment Information
          </h3>
          <div className="divide-y divide-border/40">
            <InfoRow
              icon={Building2}
              label="Department"
              value={profile.department}
            />
            <InfoRow
              icon={Briefcase}
              label="Designation"
              value={profile.designation}
            />
            <InfoRow
              icon={Building2}
              label="Institution"
              value={profile.institution}
            />
            <InfoRow
              icon={Calendar}
              label="Date of Joining"
              value={joinDate}
            />
          </div>
        </div>

        {/* Financial Details */}
        <div className="atelier-panel p-6">
          <h3 className="editorial-title text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-primary" />
            Financial Details
          </h3>
          <div className="divide-y divide-border/40">
            <InfoRow icon={FileText} label="PAN Number" value={profile.panNo} />
            <InfoRow icon={FileText} label="PF UAN" value={profile.pfUan} />
            <InfoRow
              icon={CreditCard}
              label="Bank Account Number"
              value={profile.bankAcctNo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
