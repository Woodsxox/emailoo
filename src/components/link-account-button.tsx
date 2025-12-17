"use client";

import { Button } from "./ui/button";

export default function LinkAccountButton() {
  const handleClick = async () => {
    try {
      const res = await fetch("/api/aurinko/auth");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get auth URL");
      }

      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Link account error:", error);
      alert("Failed to link account. Please try again.");
    }
  };

  return <Button onClick={handleClick}>Link Account</Button>;
}
