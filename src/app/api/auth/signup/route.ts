import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { error: "Self sign up is disabled. Use Microsoft Teams to access this portal." },
        { status: 403 }
    );
}
