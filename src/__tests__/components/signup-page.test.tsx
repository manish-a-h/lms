/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'
import SignupPage from '@/app/(auth)/signup/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  }
})

jest.mock('@/components/auth/auth-transition-link', () => ({
  AuthTransitionLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useAuthPageTransition: () => {},
}))

describe('SignupPage', () => {
  it('renders Teams-only onboarding', async () => {
    render(<SignupPage />)

    const teamsLink = await screen.findByRole('link', { name: /continue with microsoft teams/i })
    expect(teamsLink).toBeInTheDocument()
    expect(teamsLink).toHaveAttribute('href', '/api/auth/teams/start?callbackUrl=%2Fdashboard')
    expect(screen.queryByLabelText(/full name/i)).toBeNull()
    expect(screen.queryByLabelText(/email address/i)).toBeNull()
    expect(screen.queryByLabelText(/^password/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /sign up/i })).toBeNull()
  })
})
