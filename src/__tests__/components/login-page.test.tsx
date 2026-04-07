/** @jest-environment jsdom */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'
import LoginPage from '@/app/(auth)/login/page'

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
    default: ({
      children,
      href,
      scroll: _scroll,
      ...props
    }: {
      children: React.ReactNode
      href: string
      scroll?: boolean
      [key: string]: unknown
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }
})

jest.mock('@/components/auth/auth-transition-link', () => ({
  AuthTransitionLink: ({
    children,
    href,
    scroll: _scroll,
    ...props
  }: {
    children: React.ReactNode
    href: string
    scroll?: boolean
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useAuthPageTransition: () => {},
}))

describe('LoginPage', () => {
  it('renders email, password, and sign in button', async () => {
    render(<LoginPage />)

    expect(await screen.findByLabelText(/email address/i)).not.toBeNull()
    expect(screen.getByLabelText(/^password/i)).not.toBeNull()
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeNull()
  })

  it('toggles password visibility', async () => {
    render(<LoginPage />)

    const passwordInput = (await screen.findByLabelText(/^password/i)) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    expect(passwordInput.type).toBe('password')

    fireEvent.click(toggleButton)

    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: /hide password/i })).not.toBeNull()
  })
})