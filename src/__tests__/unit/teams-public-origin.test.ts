import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getAppOrigin, getTeamsRedirectUri } from "@/lib/teams-auth";

const MANAGED = [
    "APP_URL",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "TEAMS_REDIRECT_URI",
    "VERCEL",
    "VERCEL_URL",
    "NODE_ENV",
] as const;

describe("Teams public URL / Vercel", () => {
    let snapshot: NodeJS.ProcessEnv;

    beforeAll(() => {
        snapshot = { ...process.env };
    });

    beforeEach(() => {
        for (const key of MANAGED) {
            delete process.env[key];
        }
        process.env.NODE_ENV = "test";
    });

    afterEach(() => {
        for (const key of MANAGED) {
            const value = snapshot[key];
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    });

    it("uses localhost APP_URL when not on Vercel/production rules", () => {
        process.env.APP_URL = "http://localhost:8000";
        const request = new Request("https://ignore.example/foo");
        expect(getAppOrigin(request)).toBe("http://localhost:8000");
    });

    it("ignores loopback APP_URL when VERCEL=1 and uses VERCEL_URL", () => {
        process.env.VERCEL = "1";
        process.env.VERCEL_URL = "lms-preview.vercel.app";
        process.env.APP_URL = "http://localhost:8000";
        const request = new Request("https://lms-preview.vercel.app/api/auth/teams/start");
        expect(getAppOrigin(request)).toBe("https://lms-preview.vercel.app");
    });

    it("ignores loopback TEAMS_REDIRECT_URI when VERCEL=1", () => {
        process.env.VERCEL = "1";
        process.env.VERCEL_URL = "lms-prod.vercel.app";
        process.env.TEAMS_REDIRECT_URI = "http://localhost:8000/api/auth/callback";
        const request = new Request("https://lms-prod.vercel.app/api/x");
        expect(getTeamsRedirectUri(request)).toBe("https://lms-prod.vercel.app/api/auth/callback");
    });
});
