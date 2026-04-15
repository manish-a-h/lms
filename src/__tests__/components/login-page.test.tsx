/** @jest-environment jsdom */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import LoginPage from '@/app/(auth)/login/page'

let callbackUrlValue: string | null = null
let authErrorValue: string | null = null

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'callbackUrl') return callbackUrlValue
      if (key === 'authError') return authErrorValue
      return null
    },
  }),
}))

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode
      href: string
      scroll?: boolean
      [key: string]: unknown
    }) => (
      <a href={href}>
        {children}
      </a>
    ),
  }
})

jest.mock('@/components/auth/auth-transition-link', () => ({
  AuthTransitionLink: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
    scroll?: boolean
    [key: string]: unknown
  }) => (
    <a href={href}>
      {children}
    </a>
  ),
  useAuthPageTransition: () => {},
}))

describe('LoginPage', () => {
  beforeEach(() => {
    callbackUrlValue = null
    authErrorValue = null
  })

  it('renders teams-only sign in UI', async () => {
    render(<LoginPage />)

    expect(await screen.findByRole('link', { name: /continue with microsoft teams/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/email address/i)).toBeNull()
    expect(screen.queryByLabelText(/^password/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull()
  })

  it('renders a teams sign-in link', async () => {
    render(<LoginPage />)

    const teamsLink = await screen.findByRole('link', { name: /continue with microsoft teams/i })
    expect(teamsLink).toBeInTheDocument()
    expect(teamsLink).toHaveAttribute('href', '/api/auth/teams/start?callbackUrl=%2Fdashboard')
  })

  it('sanitizes nested auth callback urls for teams sign-in', async () => {
    callbackUrlValue = '/api/auth/callback?code=very-long-code&state=very-long-state'

    render(<LoginPage />)

    const teamsLink = await screen.findByRole('link', { name: /continue with microsoft teams/i })
    expect(teamsLink).toHaveAttribute('href', '/api/auth/teams/start?callbackUrl=%2Fdashboard')
  })

  it('does not show password recovery or local account actions', async () => {
    render(<LoginPage />)

    expect(await screen.findByRole('link', { name: /continue with microsoft teams/i })).toBeInTheDocument()
    expect(screen.queryByText(/forgot password/i)).toBeNull()
    expect(screen.queryByText(/^sign up$/i)).toBeNull()
  })
})