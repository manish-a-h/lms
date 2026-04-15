import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const getSessionMock = jest.fn()
const getCalendarDataMock = jest.fn(async () => ({
  leaves: [],
  holidays: [],
  activeUsersCount: 10,
}))

jest.mock('@/lib/session', () => ({
  getSession: (...args: unknown[]) => getSessionMock(...args),
}))

jest.mock('@/lib/data/admin', () => ({
  getCalendarData: (...args: unknown[]) => getCalendarDataMock(...args),
}))

describe('admin calendar access', () => {
  beforeEach(() => {
    getSessionMock.mockReset()
    getCalendarDataMock.mockClear()
  })

  it('allows managers to fetch calendar data', async () => {
    getSessionMock.mockResolvedValue({ sub: 'mgr-1', role: 'manager' })
    const { GET } = await import('@/app/api/admin/calendar/route')

    const request = new NextRequest('http://localhost:8000/api/admin/calendar?year=2026&month=4')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.activeUsersCount).toBe(10)
  })

  it('allows hr admins to fetch calendar data', async () => {
    getSessionMock.mockResolvedValue({ sub: 'hr-1', role: 'hr_admin' })
    const { GET } = await import('@/app/api/admin/calendar/route')

    const request = new NextRequest('http://localhost:8000/api/admin/calendar?year=2026&month=4')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})
