import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-semibold text-primary">
            B2B Clothing Marketplace
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Wholesale to Retail,{" "}
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-300">
            {BRAND.description} Browse thousands of wholesale clothing products
            — no login required.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/products" size="lg">
              Browse Products
            </Button>
            <Button href="/sign-up" variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Join Free
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: "1000+", label: "Products" },
            { value: "B2B", label: "Wholesale Focus" },
            { value: "BD", label: "Bangladesh Wide" },
            { value: "24/7", label: "Always Open" },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-2xl font-bold text-primary sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
