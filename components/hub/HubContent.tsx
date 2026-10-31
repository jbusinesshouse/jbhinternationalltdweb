import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { LINKS } from "@/lib/constants";

export function HubContent({ profile }: { profile: UserProfile }) {
  const isSeller = profile.store_type === "wholesale";

  if (!isSeller) {
    return (
      <div>
        <PageHeader
          title="Hub"
          description="Guides and quick links for retailers"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { href: "/orders", label: "My Orders", desc: "Track your purchases" },
            { href: "/support", label: "Support", desc: "Get help from our team" },
            { href: "/about", label: "About", desc: "Learn about JBH" },
            {
              href: LINKS.privacyPolicy,
              label: "Privacy Policy",
              desc: "How we handle data",
            },
            {
              href: LINKS.termsAndConditions,
              label: "Terms",
              desc: "Platform terms",
            },
          ].map((item) => (
            <Card key={item.label}>
              <Link href={item.href}>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Seller Hub"
        description="Sales tools and quick links for wholesale sellers"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-semibold">Selling tips</p>
          <p className="mt-2 text-sm text-muted">
            Upload products, manage sales orders, and use featured or ad
            promotions when you want more visibility.
          </p>
        </Card>
        <Card>
          <p className="font-semibold">Stay in-app</p>
          <p className="mt-2 text-sm text-muted">
            Keep orders and chat on the platform. Contact support if you need
            help with an account or listing issue.
          </p>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Button href="/sales">View Sales Orders</Button>
        <Button href="/product-upload" variant="outline">
          Upload Product
        </Button>
        <Button href="/featured-request" variant="outline">
          Store Promotion
        </Button>
        <Button href="/advertise-product" variant="outline">
          Advertise Product
        </Button>
        <Button href="/orders" variant="outline">
          My Orders
        </Button>
        <Button href="/support" variant="outline">
          Support
        </Button>
        <Button href={LINKS.privacyPolicy} variant="outline">
          Privacy Policy
        </Button>
        <Button href={LINKS.termsAndConditions} variant="outline">
          Terms & Conditions
        </Button>
      </div>
    </div>
  );
}
