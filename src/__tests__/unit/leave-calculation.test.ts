import { describe, it, expect } from '@jest/globals'

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  holidays: Date[]
): number {
  let count = 0
  const current = new Date(startDate)
  const holidayStrings = holidays.map((h) => h.toDateString())

  while (current <= endDate) {
    if (!isWeekend(current) && !holidayStrings.includes(current.toDateString())) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

function hasLeaveOverlap(
  existingLeaves: Array<{ startDate: Date; endDate: Date }>,
  newStart: Date,
  newEnd: Date
): boolean {
  return existingLeaves.some(
    (leave) => newStart <= leave.endDate && newEnd >= leave.startDate
  )
}

function getRemainingBalance(
  totalBalance: number,
  usedDays: number,
  pendingDays: number
): number {
  return totalBalance - usedDays - pendingDays
}

describe('Leave Day Calculation', () => {
  it('counts weekdays between two dates', () => {
    expect(
      calculateLeaveDays(
        new Date('2026-04-06'),
        new Date('2026-04-10'),
        []
      )
    ).toBe(5)
  })

  it('excludes weekends', () => {
    expect(
      calculateLeaveDays(
        new Date('2026-04-06'),
        new Date('2026-04-13'),
        []
      )
    ).toBe(6)
  })

  it('excludes holidays', () => {
    const holidays = [new Date('2026-04-08')]
    expect(
      calculateLeaveDays(
        new Date('2026-04-06'),
        new Date('2026-04-10'),
        holidays
      )
    ).toBe(4)
  })

  it('returns 1 for a single weekday', () => {
    expect(
      calculateLeaveDays(
        new Date('2026-04-07'),
        new Date('2026-04-07'),
        []
      )
    ).toBe(1)
  })

  it('returns 0 for a weekend-only range', () => {
    expect(
      calculateLeaveDays(
        new Date('2026-04-11'),
        new Date('2026-04-12'),
        []
      )
    ).toBe(0)
  })
})

describe('Leave Overlap Detection', () => {
  const existing = [
    {
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-15'),
    },
  ]

  it('detects overlap when new leave is inside existing', () => {
    expect(
      hasLeaveOverlap(
        existing,
        new Date('2026-04-12'),
        new Date('2026-04-13')
      )
    ).toBe(true)
  })

  it('detects overlap when new leave starts before and ends during existing', () => {
    expect(
      hasLeaveOverlap(
        existing,
        new Date('2026-04-08'),
        new Date('2026-04-12')
      )
    ).toBe(true)
  })

  it('returns false for non-overlapping leave', () => {
    expect(
      hasLeaveOverlap(
        existing,
        new Date('2026-04-16'),
        new Date('2026-04-20')
      )
    ).toBe(false)
  })

  it('returns false for leave ending before existing starts', () => {
    expect(
      hasLeaveOverlap(
        existing,
        new Date('2026-04-05'),
        new Date('2026-04-09')
      )
    ).toBe(false)
  })
})

describe('Leave Balance Rules', () => {
  it('calculates remaining balance correctly', () => {
    expect(getRemainingBalance(12, 4, 2)).toBe(6)
  })

  it('returns 0 when fully used', () => {
    expect(getRemainingBalance(10, 10, 0)).toBe(0)
  })

  it('returns negative when over-used', () => {
    expect(getRemainingBalance(10, 11, 0)).toBe(-1)
  })
})