import { NextResponse } from "next/server";
import { getAurinkoAuthUrl } from "@/lib/aurinko";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authUrl = await getAurinkoAuthUrl("Google");
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Auth URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 },
    );
  }
}
