"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred. Please check your environment variables are configured correctly."}
      </p>
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="text-sm text-muted-foreground mb-4">
          Error digest: {error.digest}
        </p>
      )}
      <div className="flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
