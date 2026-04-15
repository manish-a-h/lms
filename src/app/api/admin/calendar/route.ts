import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCalendarData } from "@/lib/data/admin";

export async function GET(request: NextRequest) {
    try {
        const sessionUser = await getSession(request);
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!["hr_admin", "manager"].includes(sessionUser.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const yearStr = searchParams.get("year");
        const monthStr = searchParams.get("month");

        if (!yearStr || !monthStr) {
            return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
        }

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
            return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
        }

        const data = await getCalendarData(year, month);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Calendar API Error:", error);
        return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
    }
}
