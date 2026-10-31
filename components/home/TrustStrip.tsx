import { BoxIcon, ChatIcon, PhoneIcon, TagIcon } from "@/components/ui/icons";

export function TrustStrip({ guestCheckout }: { guestCheckout: boolean }) {
  const items = [
    { Icon: TagIcon, tone: "bg-primary-soft text-primary-strong", title: "ভ্যাটসহ স্পষ্ট দাম", body: "যা দেখবেন, তা-ই দেবেন। কোনো লুকানো চার্জ নেই।" },
    { Icon: ChatIcon, tone: "bg-navy-soft text-navy", title: "সেলারের সাথে সরাসরি চ্যাট", body: "দাম, সাইজ, ডেলিভারি নিয়ে সরাসরি কথা বলুন।" },
    { Icon: BoxIcon, tone: "bg-teal-soft text-teal", title: "MOQ অনুযায়ী পাইকারি অর্ডার", body: "সাইজ ও রং মিলিয়ে একবারেই অর্ডার।" },
    guestCheckout
      ? { Icon: PhoneIcon, tone: "bg-primary-soft text-primary-strong", title: "SMS কোডে অর্ডার কনফার্ম", body: "অ্যাকাউন্ট ছাড়াও অর্ডার করা যায়।" }
      : { Icon: PhoneIcon, tone: "bg-primary-soft text-primary-strong", title: "অ্যাপেও কেনাকাটা", body: "Google Play থেকে JBH অ্যাপ নিয়ে যেকোনো জায়গা থেকে অর্ডার।" },
  ];

  return (
    <section aria-label="কেন JBH" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {items.map(({ Icon, tone, title, body }) => (
        <div key={title} className="flex items-start gap-3.5 rounded-2xl border border-border bg-white p-4">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon size={22} />
          </span>
          <div>
            <p className="font-bold">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
