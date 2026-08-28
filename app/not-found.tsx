import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-foreground">Page Not Found</h2>
      <p className="mt-2 text-muted">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="mt-8 flex gap-4">
        <Button href="/">Go Home</Button>
        <Button href="/products" variant="outline">
          Browse Products
        </Button>
      </div>
    </div>
  );
}
