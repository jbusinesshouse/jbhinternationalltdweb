"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, apiRequest } from "@/lib/api";

type Status = "idle" | "loading" | "done" | "error";

export function UnsubscribeForm({ email, token }: { email: string; token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const validLink = Boolean(email && token);

  async function confirm() {
    setStatus("loading");
    try {
      await apiRequest(
        `/email/unsubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`,
        { method: "POST", body: {} }
      );
      setStatus("done");
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status === 400
          ? "This unsubscribe link is invalid or incomplete."
          : "Something went wrong. Please try again in a moment."
      );
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {status === "done" ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">You&apos;re unsubscribed</h1>
          <p className="mt-3 text-muted">
            {email} will no longer receive these emails from JBH International
            Limited. Order and account messages are not affected.
          </p>
          <div className="mt-8">
            <Button href="/" variant="outline">
              Back to home
            </Button>
          </div>
        </>
      ) : !validLink ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">Link not valid</h1>
          <p className="mt-3 text-muted">
            This unsubscribe link is invalid or incomplete. Reply to any of our emails
            and we&apos;ll remove you manually.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">
            Unsubscribe from these emails?
          </h1>
          <p className="mt-3 text-muted">
            <span className="font-medium text-foreground">{email}</span> will stop
            receiving these emails from JBH International Limited. Order and account
            messages are not affected.
          </p>
          {status === "error" && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {message}
            </p>
          )}
          <div className="mt-8">
            <Button onClick={confirm} disabled={status === "loading"} size="lg">
              {status === "loading" ? "Unsubscribing…" : "Confirm unsubscribe"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
