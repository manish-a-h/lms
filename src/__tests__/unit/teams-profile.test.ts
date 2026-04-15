import { describe, expect, it } from '@jest/globals'
import { buildTeamsProfileDefaults } from '@/lib/teams-auth'

describe('buildTeamsProfileDefaults', () => {
    it('maps microsoft profile details into LMS user fields', () => {
        const profile = buildTeamsProfileDefaults({
            email: 'person@example.com',
            name: 'Person Example',
            department: 'Engineering',
            jobTitle: 'Software Engineer',
            contactNo: '+91 9000000000',
            officeLocation: 'Bengaluru',
        })

        expect(profile).toEqual({
            name: 'Person Example',
            email: 'person@example.com',
            department: 'Engineering',
            designation: 'Software Engineer',
            institution: 'Bengaluru',
            contactNo: '+91 9000000000',
        })
    })

    it('normalizes guest teams emails back to the real external address', () => {
        const profile = buildTeamsProfileDefaults({
            email: 'sujalmh9_gmail.com#ext#@sujalmh9gmail.onmicrosoft.com',
            name: 'Sujal',
        })

        expect(profile.email).toBe('sujalmh9@gmail.com')
    })
})
