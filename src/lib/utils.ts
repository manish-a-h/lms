import { type DayTime } from "@/generated/prisma/client"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLocalDateInput(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function enumerateDatesInRange(startDate: Date, endDate: Date) {
  const dates: Date[] = []
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function calculateLeaveDays({
  startDate,
  endDate,
  dayTime,
  holidays = [],
}: {
  startDate: string | Date
  endDate: string | Date
  dayTime: DayTime | `${DayTime}`
  holidays?: Array<string | Date>
}) {
  const start = parseLocalDateInput(startDate)
  const end = parseLocalDateInput(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0
  }

  const holidayKeys = new Set(
    holidays.map((holiday) => formatDateKey(parseLocalDateInput(holiday)))
  )

  const workingDates = enumerateDatesInRange(start, end).filter((date) => {
    return !isWeekend(date) && !holidayKeys.has(formatDateKey(date))
  })

  if (workingDates.length === 0) {
    return 0
  }

  if (dayTime !== "full_day") {
    return formatDateKey(start) === formatDateKey(end) ? 0.5 : 0
  }

  return workingDates.length
}

export function formatDayTimeLabel(dayTime: DayTime | `${DayTime}`) {
  return dayTime
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
