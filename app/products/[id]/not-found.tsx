import { Button } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">Product Not Found</h1>
      <p className="mt-2 text-muted">
        This product may have been removed or is no longer available.
      </p>
      <div className="mt-8">
        <Button href="/products">Browse Products</Button>
      </div>
    </div>
  );
}
