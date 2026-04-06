import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
};

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-white/40 shadow-[0_18px_30px_-18px_rgba(0,74,198,0.45)]",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white bg-[linear-gradient(135deg,#004ac6,#2b6ff0)] shadow-[0_18px_30px_-18px_rgba(0,74,198,0.55)] ring-2 ring-white/30",
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
