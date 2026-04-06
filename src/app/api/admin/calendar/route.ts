import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { getCalendarData } from "@/lib/data/admin";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization") || request.headers.get("cookie");
        // Just a fast pass verifying admin bounds using cookie parse here, or relies on Next.js setup
        // the verifyAccessToken needs the raw JWT:
        const tokenMatch = authHeader?.match(/access_token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const sessionUser = await verifyAccessToken(token).catch(() => null);
        if (!sessionUser || sessionUser.role !== "hr_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const yearStr = searchParams.get("year");
        const monthStr = searchParams.get("month");

        if (!yearStr || !monthStr) {
            return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
        }

        const data = await getCalendarData(parseInt(yearStr), parseInt(monthStr));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Calendar API Error:", error);
        return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
    }
}
