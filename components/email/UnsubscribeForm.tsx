"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
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
        { method: "POST", body: {}, auth: false }
      );
      setStatus("done");
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status === 400
          ? "এই আনসাবস্ক্রাইব লিংকটি সঠিক নয় বা অসম্পূর্ণ।"
          : "কিছু একটা সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।"
      );
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-[22px] border border-border bg-white p-7 sm:p-9">
        {status === "done" ? (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-soft text-teal">
              <CheckIcon size={28} strokeWidth={2.4} />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">আনসাবস্ক্রাইব হয়েছে</h1>
            <p className="mt-3 leading-relaxed text-muted">
              <span className="break-all font-semibold text-foreground">{email}</span> আর JBH International
              Limited-এর এই ইমেইলগুলো পাবে না। অর্ডার ও অ্যাকাউন্টের বার্তা আগের মতোই আসবে।
            </p>
            <div className="mt-7">
              <Button href="/" variant="outline">হোমে ফিরুন</Button>
            </div>
          </>
        ) : !validLink ? (
          <>
            <h1 className="text-2xl font-extrabold">লিংকটি সঠিক নয়</h1>
            <p className="mt-3 leading-relaxed text-muted">
              এই আনসাবস্ক্রাইব লিংকটি সঠিক নয় বা অসম্পূর্ণ। আমাদের যেকোনো ইমেইলের উত্তরে জানালে আমরা নিজেই আপনাকে সরিয়ে দেব।
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">এই ইমেইলগুলো বন্ধ করবেন?</h1>
            <p className="mt-3 leading-relaxed text-muted">
              <span className="break-all font-semibold text-foreground">{email}</span> আর JBH International
              Limited-এর এই ইমেইলগুলো পাবে না। অর্ডার ও অ্যাকাউন্টের বার্তা আগের মতোই আসবে।
            </p>
            {status === "error" && (
              <p role="alert" className="mt-4 rounded-xl bg-[#FEECEC] px-4 py-3 text-sm font-semibold text-[#B42318]">
                {message}
              </p>
            )}
            <div className="mt-7">
              <Button onClick={confirm} disabled={status === "loading"} size="lg">
                {status === "loading" ? "অপেক্ষা করুন…" : "হ্যাঁ, বন্ধ করুন"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
