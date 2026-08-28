import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${BRAND.name} — Bangladesh's B2B clothing marketplace connecting wholesalers with retailers.`,
};

const sections = [
  {
    title: "Who We Are",
    content: `${BRAND.name} is a B2B marketplace designed to connect clothing wholesalers with retailers in a simple, efficient, and reliable way.`,
  },
  {
    title: "What We Do",
    content:
      "Our platform enables wholesalers to showcase their clothing products while allowing retailers to discover, compare, and purchase items directly from trusted suppliers.",
  },
  {
    title: "Who It's For",
    content:
      "This platform is built for clothing wholesalers and retail businesses looking to streamline sourcing, reduce manual communication, and manage orders more effectively.",
  },
  {
    title: "Our Goal",
    content:
      "Our goal is to simplify the wholesale-to-retail process by providing a transparent, digital-first platform that saves time and helps businesses grow.",
  },
  {
    title: "Our Commitment",
    content:
      "We are committed to improving the experience for both wholesalers and retailers by continuously enhancing performance, security, and usability.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="border-b border-border bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">About {BRAND.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            {BRAND.tagline}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-foreground">
                {section.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-2 text-muted">
            Browse products for free or create an account to start ordering.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button href="/products">Browse Products</Button>
            <Button href="/sign-up" variant="outline">
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
