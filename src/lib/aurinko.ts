"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export const getAurinkoAuthUrl = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Validate environment variables
  const clientId = process.env.AURINKO_CLIENT_ID;
  const returnUrl = process.env.NEXT_PUBLIC_URL;

  if (!clientId) {
    throw new Error("AURINKO_CLIENT_ID environment variable is not set");
  }

  if (!returnUrl) {
    throw new Error("NEXT_PUBLIC_URL environment variable is not set");
  }

  // Aurinko API uses camelCase parameter names
  const params = new URLSearchParams({
    clientId: clientId,
    returnUrl: `${returnUrl}/api/aurinko/callback`,
    responseType: "code",
    scope: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    serviceType: serviceType,
  });

  // Correct endpoint is /v1/auth/authorize (not /oauth2/authorize)
  const authUrl = `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

  console.log(
    "Generated Aurinko auth URL:",
    authUrl.replace(/clientId=[^&]+/, "clientId=***"),
  );

  return authUrl;
};

export const exchangeCodeForAccessToken = async (code: string) => {
  try {
    const response = await axios.post(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      {},
      {
        auth: {
          username: process.env.AURINKO_CLIENT_ID!,
          password: process.env.AURINKO_CLIENT_SECRET!,
        },
      },
    );
    return response.data as {
      accountId: number;
      userId: string;
      userSession: string;
      accessToken: string;
      refreshToken: string;
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error exchanging code for access token:",
        error.response?.data,
      );
    } else {
      console.error("Error exchanging code for access token:", error);
    }
    throw error;
  }
};

export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get("https://api.aurinko.io/v1/account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data as { email: string; name: string };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching account details:", error.response?.data);
    } else {
      console.error("Unexpected error fetching account details:", error);
    }
    throw error;
  }
};
