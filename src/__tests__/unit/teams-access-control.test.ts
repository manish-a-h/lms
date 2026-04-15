import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockCount = jest.fn(async () => 0)
const mockFindUnique = jest.fn(async () => null)

jest.mock('@/lib/db', () => ({
  db: {
    approvedEmail: {
      count: mockCount,
      findUnique: mockFindUnique,
    },
  },
}))

describe('Teams approved email access', () => {
  const originalDomains = process.env.TEAMS_ALLOWED_DOMAINS

  beforeEach(() => {
    process.env.TEAMS_ALLOWED_DOMAINS = ''
    mockCount.mockClear()
    mockFindUnique.mockClear()
  })

  afterEach(() => {
    process.env.TEAMS_ALLOWED_DOMAINS = originalDomains
  })

  it('allows a user only when their email is present in the approved list', async () => {
    mockCount.mockResolvedValueOnce(2)
    mockFindUnique.mockResolvedValueOnce({
      email: 'manager@example.com',
      role: 'manager',
      isActive: true,
    })

    const { getApprovedTeamsSignIn } = await import('@/lib/teams-auth')
    const result = await getApprovedTeamsSignIn('manager@example.com')

    expect(result).toEqual({ allowed: true, role: 'manager' })
  })

  it('rejects sign-in when approved emails exist but the address is not listed', async () => {
    mockCount.mockResolvedValueOnce(1)
    mockFindUnique.mockResolvedValueOnce(null)

    const { getApprovedTeamsSignIn } = await import('@/lib/teams-auth')
    const result = await getApprovedTeamsSignIn('blocked@example.com')

    expect(result).toEqual({ allowed: false, role: null })
  })
})
