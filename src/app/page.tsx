import LinkAccountButton from "@/components/link-account-button";
import { Button } from "@/components/ui/button";
import React from "react";

export default async function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <LinkAccountButton />
    </div>
  );
}
