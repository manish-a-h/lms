"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { NotificationType } from "@/generated/prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCount();
    
    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  async function fetchCount() {
    try {
      const res = await fetch("/api/notifications?count=true");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch notification count", err);
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        fetchCount();
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-white/55"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 shrink-0 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-sm animate-in fade-in zoom-in">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border bg-white p-2 shadow-xl shadow-black/10 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b px-2 pb-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.some(n => !n.isRead) ? (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-blue-600 hover:text-blue-700">
                <Check className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            ) : null}
          </div>

          <div className="mt-2 max-h-[60vh] overflow-y-auto overflow-x-hidden flex flex-col gap-1 pr-1">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-muted-foreground gap-2">
                <MailOpen className="h-8 w-8 text-slate-200" />
                <p className="text-sm">You have no notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group relative flex flex-col gap-1 rounded-lg p-3 text-sm transition-colors hover:bg-slate-50 ${
                    !n.isRead ? "bg-blue-50/50 outline outline-1 outline-blue-100" : ""
                  }`}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${!n.isRead ? "text-slate-900" : "text-slate-700"}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                    {n.message}
                  </p>
                  {n.link && (
                    <Link
                      href={n.link}
                      className="mt-1 flex items-center text-xs font-medium text-blue-600 hover:underline w-fit"
                      onClick={() => setOpen(false)}
                    >
                      View details <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
