import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";

type Props = {
  searchParams: Promise<{ orderId?: string; phone?: string }>;
};

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId?.trim();
  const phone = params.phone?.trim();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Order placed"
        description="Thanks — we’ve received your order."
      />
      <Card>
        {orderId ? (
          <p className="text-sm text-foreground">
            Order ID:{" "}
            <span className="font-mono font-semibold">{orderId}</span>
          </p>
        ) : (
          <p className="text-sm text-muted">
            Your order was submitted. Keep any confirmation SMS for reference.
          </p>
        )}
        {phone ? (
          <p className="mt-2 text-sm text-muted">
            Confirmed with phone ending in{" "}
            <span className="font-semibold text-foreground">
              {phone.slice(-4)}
            </span>
            .
          </p>
        ) : null}
        <p className="mt-4 text-sm text-muted">
          Want to track orders later? Create an account with the same phone
          number when you’re ready — no rush.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/products">Continue shopping</Button>
          <Button href="/sign-up" variant="outline">
            Create account
          </Button>
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-primary-strong self-center"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
