import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-primary-strong">৪০৪</p>
      <h1 className="mt-4 text-2xl font-extrabold">পেজটি খুঁজে পাওয়া যায়নি</h1>
      <p className="mt-2 max-w-md text-muted">
        আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা লিংকটি ভুল। হোমে ফিরে গিয়ে পণ্য খুঁজে দেখুন।
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" size="lg">হোমে ফিরুন</Button>
        <Button href="/products" variant="outline" size="lg">পণ্য দেখুন</Button>
      </div>
    </div>
  );
}
