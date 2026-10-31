"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  fetchChatMessages,
  fetchChatRoom,
  parseChatMessageContent,
  sendChatMessage,
} from "@/lib/chat";
import { supabase } from "@/lib/supabase/browser";

export function ChatThread({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const roomLoadedRef = useRef(false);

  const load = async () => {
    // Local session (no network round trip) — the API verifies the token anyway.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [roomRes, msgRes] = await Promise.all([
      roomLoadedRef.current ? Promise.resolve(null) : fetchChatRoom(roomId),
      fetchChatMessages(roomId),
    ]);
    if (roomRes) {
      setRoom(roomRes.data);
      roomLoadedRef.current = true;
    }
    // Keep the same array when nothing changed so the 5s poll does not re-scroll the chat.
    setMessages((prev) => {
      const next = msgRes.data;
      return prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id
        ? prev
        : next;
    });
    setLoading(false);
  };

  useEffect(() => {
    roomLoadedRef.current = false;
    load();
    // Realtime on chat_messages is blocked by the BFF-only RLS lockdown; poll the API.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !text.trim()) return;
    await sendChatMessage(roomId, text);
    setText("");
    load();
  };

  if (loading) return <p className="text-muted">লোড হচ্ছে...</p>;
  if (!room)
    return (
      <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
        <p className="text-lg font-bold">চ্যাটটি পাওয়া যায়নি</p>
        <div className="mt-4"><Button href="/messages" variant="outline">মেসেজে ফিরুন</Button></div>
      </div>
    );

  const otherId =
    room.buyer_id === userId ? room.seller_id : room.buyer_id;

  return (
    <div className="flex h-[calc(100dvh-15rem)] min-h-[440px] flex-col">
      <PageHeader
        title={room.product?.name ?? "চ্যাট"}
        description="সেলার ও ক্রেতার মধ্যে সরাসরি চ্যাট"
        action={
          <Button href="/messages" variant="outline" size="sm">
            ফিরে যান
          </Button>
        }
      />
      {room.product && (
        <Card className="mb-4 flex items-center gap-3 py-3">
          <Link
            href={`/products/${room.product.id}`}
            className="text-sm font-semibold text-primary-strong hover:underline"
          >
            পণ্য দেখুন: {room.product.name}
          </Link>
        </Card>
      )}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-white p-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          const parsed = parseChatMessageContent(msg.message_text);
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  isMine
                    ? "rounded-br-md bg-primary text-primary-ink"
                    : "rounded-bl-md bg-surface text-foreground"
                }`}
              >
                {parsed.kind === "product" ? (
                  <div>
                    <p>{parsed.product.introText}</p>
                    <Link
                      href={`/products/${parsed.product.productId}`}
                      className={`mt-2 block text-xs underline ${
                        isMine ? "text-primary-ink" : "text-primary-strong"
                      }`}
                    >
                      {parsed.product.name} · ৳{Number(parsed.product.price).toLocaleString("bn-BD")}
                    </Link>
                  </div>
                ) : (
                  parsed.text
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="মেসেজ লিখুন..."
          aria-label="মেসেজ"
          className="flex-1 rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
        />
        <Button type="submit" size="lg">পাঠান</Button>
      </form>
    </div>
  );
}
