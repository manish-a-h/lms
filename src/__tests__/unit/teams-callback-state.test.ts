import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.mock('@/generated/prisma/client', () => ({
    TokenPurpose: {
        session: 'session',
    },
}))

jest.mock('@/lib/auth', () => ({
    createSessionTokenId: () => 'session-id',
    hashPassword: jest.fn(async () => 'hashed-password'),
    hashToken: jest.fn(async () => 'hashed-refresh-token'),
    signAccessToken: jest.fn(async () => 'access-token'),
    signRefreshToken: jest.fn(async () => 'refresh-token'),
}))

jest.mock('@/lib/db', () => ({
    db: {
        $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
                user: {
                    findFirst: jest.fn(async () => ({
                        id: 'user-1',
                        email: 'person@example.com',
                        name: 'Person Example',
                        role: 'employee',
                        isActive: true,
                        nitteEmail: 'person@example.com',
                        department: 'Engineering',
                        designation: 'Engineer',
                        institution: 'Campus',
                        contactNo: '1234567890',
                    })),
                    update: jest.fn(async () => ({
                        id: 'user-1',
                        email: 'person@example.com',
                        name: 'Person Example',
                        role: 'employee',
                        isActive: true,
                    })),
                    create: jest.fn(),
                },
                leaveType: {
                    findMany: jest.fn(async () => []),
                },
                leaveBalance: {
                    createMany: jest.fn(),
                },
                activityLog: {
                    create: jest.fn(),
                },
            }

            return callback(tx)
        }),
        refreshToken: {
            create: jest.fn(async () => ({})),
        },
    },
}))

jest.mock('@/lib/session', () => ({
    accessTokenCookieOptions: () => ({ path: '/', httpOnly: true }),
    refreshTokenCookieOptions: () => ({ path: '/', httpOnly: true }),
}))

jest.mock('@/lib/teams-auth', () => {
    const actual = jest.requireActual('@/lib/teams-auth') as typeof import('@/lib/teams-auth')
    return {
        ...actual,
        clearTeamsStateCookie: jest.fn(),
        exchangeTeamsCodeForIdentity: jest.fn(async () => ({
            email: 'person@example.com',
            name: 'Person Example',
            tenantId: 'tenant-1',
            objectId: 'object-1',
            department: 'Engineering',
            jobTitle: 'Engineer',
        })),
        isAllowedTeamsEmail: jest.fn(() => true),
    }
})

describe('teams callback state verification', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    it('accepts a valid signed state even when the cookie is missing', async () => {
        const { encodeTeamsOAuthState } = await import('@/lib/teams-auth')
        const { GET } = await import('@/app/api/auth/teams/callback/route')

        const state = encodeTeamsOAuthState({ nonce: 'nonce-123' })
        const request = new NextRequest(`http://localhost:8000/api/auth/callback?code=abc&state=${encodeURIComponent(state)}`)

        const response = await GET(request)

        expect(response.headers.get('location')).toBe('http://localhost:8000/dashboard')
    })
})
