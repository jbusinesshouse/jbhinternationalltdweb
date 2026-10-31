"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/PageElements";
import { fetchUserChatRooms, getMessagePreviewText } from "@/lib/chat";
import { supabase } from "@/lib/supabase/browser";

export function MessagesInbox() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await fetchUserChatRooms();
      setRooms(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader title="মেসেজ" description="ক্রেতা ও সেলারদের সাথে চ্যাট" />
      {loading ? (
        <p className="text-muted">লোড হচ্ছে...</p>
      ) : rooms.length === 0 ? (
        <EmptyState
          title="এখনো কোনো মেসেজ নেই"
          description="কোনো পণ্যের পেজ থেকে সেলারকে মেসেজ দিয়ে কথা শুরু করুন।"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rooms.map((room) => {
            const other =
              room.buyer_id === userId ? room.seller : room.buyer;
            return (
              <Link key={room.id} href={`/messages/${room.id}`}>
                <Card className="flex items-center gap-3 transition-colors hover:border-primary">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-soft">
                    {other?.avatar_url ? (
                      <Image
                        src={other.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-bold text-primary-strong">
                        {(other?.store_name ?? "?").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {other?.store_name ?? "চ্যাট"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {room.product?.name}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {getMessagePreviewText(room.last_message)}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
