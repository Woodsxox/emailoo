import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // ✅ Safe Clerk auth
    let userId: string | null = null;

    try {
      const authData = await auth();
      userId = authData.userId;
    } catch (e) {
      console.error("Auth error in callback:", e);
    }

    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const params = req.nextUrl.searchParams;
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL("/mail?error=oauth_failed", req.url),
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/mail?error=no_code", req.url));
    }

    // ✅ Exchange code for token
    const token = await exchangeCodeForAccessToken(code);

    if (!token) {
      return NextResponse.redirect(
        new URL("/mail?error=token_exchange_failed", req.url),
      );
    }

    // ✅ Fetch account details
    const accountDetails = await getAccountDetails(token.accessToken);

    // ✅ Store / update account
    await prisma.account.upsert({
      where: { id: token.accountId.toString() },
      update: {
        accessToken: token.accessToken,
      },
      create: {
        id: token.accountId.toString(),
        userId,
        accessToken: token.accessToken,
        emailAddress: accountDetails.email,
        name: accountDetails.name,
      },
    });

    // ✅ Always redirect after OAuth
    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      new URL("/mail?error=callback_failed", req.url),
    );
  }
}
