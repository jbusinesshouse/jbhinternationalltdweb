import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { BRAND, LINKS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Download App",
  description: `Download the ${BRAND.name} mobile app for Android. Order, chat, and manage your business on the go.`,
};

const appFeatures = [
  "Browse and order wholesale products",
  "Chat directly with sellers",
  "Track orders and sales",
  "Manage your store (for wholesalers)",
  "Push notifications for updates",
];

export default function DownloadPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Get the {BRAND.shortName} App
            </h1>
            <p className="mt-4 text-lg text-muted">
              Take your B2B clothing business mobile. The full marketplace
              experience in your pocket — order, chat, and manage everything
              from anywhere.
            </p>

            <ul className="mt-8 space-y-3">
              {appFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href={LINKS.playStore} size="lg">
                Download on Google Play
              </Button>
              <Button href="/products" variant="outline" size="lg">
                Browse on Web
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="rounded-3xl border border-border bg-black p-8 text-center shadow-xl">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-4xl font-bold text-white">
                {BRAND.shortName}
              </div>
              <p className="mt-4 text-lg font-semibold text-white">
                {BRAND.name}
              </p>
              <p className="mt-1 text-sm text-gray-400">Android App</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
