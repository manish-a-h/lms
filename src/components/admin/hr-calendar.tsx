"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDayModal } from "./calendar-day-modal";
import { formatDateKey } from "@/lib/utils";

interface CalendarLeave {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  reason: string;
  dayTime: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    department: string | null;
    designation: string | null;
  };
}

interface CalendarHoliday {
  date: Date;
  name: string;
}

interface CalendarData {
  leaves: CalendarLeave[];
  holidays: CalendarHoliday[];
  activeUsersCount: number;
}

interface RawLeave extends Omit<CalendarLeave, "startDate" | "endDate"> {
  startDate: string;
  endDate: string;
}

interface RawHoliday extends Omit<CalendarHoliday, "date"> {
  date: string;
}

export function HrCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchCalendarData = async (date: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?year=${date.getFullYear()}&month=${date.getMonth() + 1}`);
      if (res.ok) {
        const json = await res.json() as { activeUsersCount: number, leaves: RawLeave[], holidays: RawHoliday[] };
        const mapped: CalendarData = {
          activeUsersCount: json.activeUsersCount,
          leaves: json.leaves.map((l) => ({
            ...l,
            startDate: new Date(l.startDate),
            endDate: new Date(l.endDate),
          })),
          holidays: json.holidays.map((h) => ({
            ...h,
            date: new Date(h.date),
          })),
        };
        setData(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startOffset }, (_, i) => i);

  const getDayInfo = (day: number) => {
    if (!data) return { leaves: [] as CalendarLeave[], holiday: null as CalendarHoliday | null };
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const localDateKey = formatDateKey(targetDate);

    const holiday = data.holidays.find(
      (h) => formatDateKey(h.date) === localDateKey
    ) ?? null;

    const targetTime = targetDate.getTime();

    const intersectingLeaves = data.leaves.filter((l) => {
      const start = new Date(
        l.startDate.getFullYear(),
        l.startDate.getMonth(),
        l.startDate.getDate()
      ).getTime();
      const end = new Date(
        l.endDate.getFullYear(),
        l.endDate.getMonth(),
        l.endDate.getDate()
      ).getTime();
      return targetTime >= start && targetTime <= end;
    });

    return { leaves: intersectingLeaves, holiday };
  };

  const getSelectedDayInfo = () => {
    if (!selectedDate || !data) return { leaves: [] as CalendarLeave[], holiday: null as CalendarHoliday | null };
    return getDayInfo(selectedDate.getDate());
  };

  return (
    <div className="rounded-3xl border bg-white shadow-xl shadow-blue-900/5 overflow-hidden flex flex-col">
      <div className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Team Roster</h2>
            <p className="text-sm text-slate-500 font-medium">Manage daily presence & approvals</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white px-2 py-1 rounded-full border shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-600">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-bold text-slate-700 min-w-[120px] text-center tracking-wide">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-600">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b bg-slate-50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="bg-white min-h-[500px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="border-r border-b bg-slate-50/30 p-2 last:border-r-0" />
          ))}
          {days.map((day) => {
            const { leaves, holiday } = getDayInfo(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            const pending = leaves.filter((l) => l.status === "pending");
            const approved = leaves.filter((l) => l.status === "approved");

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`border-r border-b p-2 last:border-r-0 hover:bg-slate-50 transition-colors cursor-pointer group relative flex flex-col gap-1 ${
                  isToday ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${
                    isToday ? "bg-blue-600 text-white shadow-md" : "text-slate-700 group-hover:text-blue-600"
                  }`}>
                    {day}
                  </span>
                  {holiday && (
                    <span className="text-[10px] items-center font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 truncate max-w-[80px]">
                      🌟 {holiday.name}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex-1 flex flex-col gap-1">
                  {pending.length > 0 && (
                    <div className="bg-amber-100/80 border border-amber-200 text-amber-800 rounded px-2 py-1 flex items-center justify-between shadow-sm">
                      <span className="text-[10px] font-bold tracking-wide">{pending.length} pending</span>
                      <div className="flex -space-x-1">
                        {pending.slice(0, 3).map((l, i) => (
                          <div key={i} className="h-4 w-4 rounded-full bg-amber-300 border border-amber-100 text-[8px] font-bold flex items-center justify-center">
                            {l.user.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {approved.length > 0 && (
                    <div className="bg-slate-100 text-slate-600 rounded px-2 py-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold">{approved.length} absent</span>
                      <div className="flex -space-x-1">
                        {approved.slice(0, 3).map((l, i) => (
                          <div key={i} className="h-4 w-4 rounded-full bg-slate-300 border border-white text-[8px] font-bold flex items-center justify-center text-slate-700">
                            {l.user.name.charAt(0)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CalendarDayModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        leaves={getSelectedDayInfo().leaves}
        holiday={getSelectedDayInfo().holiday}
        activeUsersCount={data?.activeUsersCount || 0}
        onLeaveUpdated={() => fetchCalendarData(currentDate)}
      />
    </div>
  );
}