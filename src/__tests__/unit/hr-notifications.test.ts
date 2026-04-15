import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockFindMany = jest.fn(async () => [
    { id: 'hr-1', email: 'sujalmh9@gmail.com', name: 'Sujal HR', role: 'hr_admin' },
    { id: 'hr-2', email: 'hr2@example.com', name: 'HR Two', role: 'hr_admin' },
])

const mockCreate = jest.fn(async (args: unknown) => args)
const mockTransaction = jest.fn(async (operations: unknown[]) => Promise.all(operations))

jest.mock('@/lib/db', () => ({
    db: {
        user: {
            findMany: mockFindMany,
        },
        notification: {
            create: mockCreate,
        },
        $transaction: mockTransaction,
    },
}))

describe('HR notifications', () => {
    const originalWebhook = process.env.TEAMS_HR_WEBHOOK_URL
    const fetchMock = jest.fn(async () => ({ ok: true }))

    beforeEach(() => {
        process.env.TEAMS_HR_WEBHOOK_URL = 'https://example.test/teams-webhook'
        mockFindMany.mockClear()
        mockCreate.mockClear()
        mockTransaction.mockClear()
        global.fetch = fetchMock as unknown as typeof fetch
        fetchMock.mockClear()
    })

    afterEach(() => {
        process.env.TEAMS_HR_WEBHOOK_URL = originalWebhook
    })

    it('sends leave submission alerts to HR admins and Teams', async () => {
        const { notifyLeaveSubmitted } = await import('@/lib/notifications')

        await notifyLeaveSubmitted({
            employeeId: 'emp-1',
            managerId: 'mgr-1',
            employeeName: 'Employee One',
            leaveType: 'Casual Leave',
            startDate: '14 Apr 2026',
            endDate: '15 Apr 2026',
        })

        expect(mockFindMany).toHaveBeenCalled()
        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.test/teams-webhook',
            expect.objectContaining({ method: 'POST' })
        )
    })
})
