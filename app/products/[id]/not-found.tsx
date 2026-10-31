import { Button } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">পণ্যটি পাওয়া যায়নি</h1>
      <p className="mt-2 max-w-md text-muted">
        পণ্যটি সরিয়ে ফেলা হয়েছে বা এখন আর পাওয়া যাচ্ছে না।
      </p>
      <div className="mt-8">
        <Button href="/products" size="lg">অন্য পণ্য দেখুন</Button>
      </div>
    </div>
  );
}
