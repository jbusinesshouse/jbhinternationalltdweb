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

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const roomRes = await fetchChatRoom(roomId);
    setRoom(roomRes.data);
    const msgRes = await fetchChatMessages(roomId);
    setMessages(msgRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !text.trim()) return;
    await sendChatMessage(roomId, userId, text);
    setText("");
    load();
  };

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!room) return <p>Chat not found</p>;

  const otherId =
    room.buyer_id === userId ? room.seller_id : room.buyer_id;

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <PageHeader
        title={room.product?.name ?? "Chat"}
        description={`Room with seller/buyer`}
        action={
          <Button href="/messages" variant="outline" size="sm">
            Back
          </Button>
        }
      />
      {room.product && (
        <Card className="mb-4 flex items-center gap-3 py-3">
          <Link
            href={`/products/${room.product.id}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View product: {room.product.name}
          </Link>
        </Card>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-white p-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          const parsed = parseChatMessageContent(msg.message_text);
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-white"
                    : "bg-surface text-foreground"
                }`}
              >
                {parsed.kind === "product" ? (
                  <div>
                    <p>{parsed.product.introText}</p>
                    <Link
                      href={`/products/${parsed.product.productId}`}
                      className={`mt-2 block text-xs underline ${
                        isMine ? "text-white/90" : "text-primary"
                      }`}
                    >
                      {parsed.product.name} · BDT {parsed.product.price}
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
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-border px-4 py-2"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
