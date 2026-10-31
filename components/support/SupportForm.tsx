"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { apiRequest } from "@/lib/api";

export function SupportForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("সব ঘর পূরণ করুন।");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/support", {
        method: "POST",
        auth: true,
        body: { subject: subject.trim(), message: message.trim() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "অনুরোধ পাঠানো যায়নি।");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    alert("আপনার অনুরোধ পাঠানো হয়েছে। আমাদের টিম শিগগিরই যোগাযোগ করবে।");
    router.push("/profile");
  };

  return (
    <div>
      <PageHeader
        title="সাহায্য"
        description="অ্যাকাউন্ট, অর্ডার বা পণ্য নিয়ে সমস্যা হলে আমাদের জানান"
      />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="rounded-xl bg-[#FEECEC] px-4 py-3 text-sm font-semibold text-[#B42318]">
              {error}
            </p>
          )}
          <div>
            <label className="text-sm font-bold">বিষয়</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold">বিস্তারিত</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
              required
            />
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
