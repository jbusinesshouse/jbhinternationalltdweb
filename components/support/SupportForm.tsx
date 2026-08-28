"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";

export function SupportForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setSubmitting(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("support_requests")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
      });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    alert("Support request submitted. Our team will contact you soon.");
    router.push("/profile");
  };

  return (
    <div>
      <PageHeader
        title="Support"
        description="Contact our support team"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              required
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
