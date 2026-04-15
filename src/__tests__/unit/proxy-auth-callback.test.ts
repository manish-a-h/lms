import { describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
    verifyAccessToken: jest.fn(),
}))

describe('proxy auth callback handling', () => {
    it('allows the Teams auth callback route without redirecting to login', async () => {
        const { proxy } = await import('@/proxy')

        const request = new NextRequest('http://localhost:8000/api/auth/callback?code=abc&state=xyz')
        const response = await proxy(request)

        expect(response.headers.get('location')).toBeNull()
    })
})
