import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { verifyAccessToken } from "@/lib/auth";
import { getFullProfile } from "@/lib/data/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function ProfileEditPage() {
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

  const initialData = {
    name: profile.name ?? "",
    email: profile.email ?? "",
    nitteEmail: profile.nitteEmail ?? "",
    contactNo: profile.contactNo ?? "",
    panNo: profile.panNo ?? "",
    pfUan: profile.pfUan ?? "",
    bankAcctNo: profile.bankAcctNo ?? "",
    department: profile.department ?? "",
    designation: profile.designation ?? "",
    institution: profile.institution ?? "",
    dob: formatDateForInput(profile.dob),
    dateOfJoin: formatDateForInput(profile.dateOfJoin),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="atelier-panel-muted flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            size="md"
          />
          <div>
            <p className="eyebrow-label">Profile</p>
            <h1 className="editorial-title text-2xl font-bold text-foreground">
              Edit Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Update your personal and professional details.
            </p>
          </div>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-md bg-white/75 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      {/* Edit Form */}
      <div className="atelier-panel p-6">
        <ProfileEditForm initialData={initialData} />
      </div>
    </div>
  );
}
