import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const status = params.get("status");
    const code = params.get("code");
    const error = params.get("error");

    // Check for OAuth errors first
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.json(
        { message: "OAuth error occurred", error },
        { status: 400 },
      );
    }

    // Check status parameter (Aurinko may send this)
    if (status && status !== "success") {
      console.error("Failed to link account, status:", status);
      return NextResponse.json(
        { message: "Failed to link account", status },
        { status: 400 },
      );
    }

    // Get the code to exchange for the access token
    if (!code) {
      return NextResponse.json(
        { message: "No code provided" },
        { status: 400 },
      );
    }

    console.log("OAuth callback received:", { userId, code, status });

    // Exchange the code for an access token with Aurinko
    const token = await exchangeCodeForAccessToken(code);

    if (!token) {
      return NextResponse.json(
        { message: "Failed to exchange code for access token" },
        { status: 400 },
      );
    }

    // Get the account details
    const accountDetails = await getAccountDetails(token.accessToken);

    // Store the token and account details in the database
    await prisma.account.upsert({
      where: { id: token.accountId.toString() },
      update: { accessToken: token.accessToken },
      create: {
        id: token.accountId.toString(),
        userId: userId,
        accessToken: token.accessToken,
        emailAddress: accountDetails.email,
        name: accountDetails.name,
      },
    });

    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      {
        message: "Callback error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
