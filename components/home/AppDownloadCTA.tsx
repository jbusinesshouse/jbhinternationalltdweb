import { Button } from "@/components/ui/Button";
import { LINKS } from "@/lib/constants";

export function AppDownloadCTA() {
  return (
    <section className="bg-primary py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white">
          Get the JBH Mobile App
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
          Order on the go, chat with sellers, and manage your business from
          anywhere. Download the app for the full experience.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            href={LINKS.playStore}
            variant="secondary"
            size="lg"
            className="bg-black hover:bg-gray-900"
          >
            Download on Google Play
          </Button>
          <Button
            href="/sign-up"
            variant="outline"
            size="lg"
            className="border-white text-white hover:bg-white/10"
          >
            Create Web Account
          </Button>
        </div>
      </div>
    </section>
  );
}
