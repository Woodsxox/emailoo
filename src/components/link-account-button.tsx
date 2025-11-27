"use client";

import React from "react";
import { Button } from "./ui/button";
import { getAurinkoAuthUrl } from "@/lib/aurinko";

export default function LinkAccountButton() {
  return (
    <Button
      onClick={async () => {
        try {
          const authUrl = await getAurinkoAuthUrl("Google");
          console.log("Redirecting to:", authUrl);
          window.location.href = authUrl;
        } catch (error) {
          console.error("Error getting auth URL:", error);
          alert(
            error instanceof Error ? error.message : "Failed to get auth URL",
          );
        }
      }}
    >
      Link Account
    </Button>
  );
}
