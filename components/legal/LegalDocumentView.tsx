import type { LegalDocument } from "@/lib/legalContent";

export function LegalDocumentView({
  document,
}: {
  document: LegalDocument;
}) {
  return (
    <div className="bg-surface min-h-screen">
      <div className="border-b border-border bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold">{document.title}</h1>
          <p className="mt-4 text-sm text-gray-300">
            Effective: {document.effectiveDate} · Last updated:{" "}
            {document.lastUpdated}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {document.sectionsEn.map((section) => (
            <section key={`en-${section.title}`}>
              <h2 className="text-xl font-bold text-foreground">
                {section.title}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mt-3 leading-relaxed text-muted whitespace-pre-line"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <hr className="my-12 border-border" />

        <div className="space-y-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            বাংলা
          </p>
          {document.sectionsBn.map((section) => (
            <section key={`bn-${section.title}`}>
              <h2 className="text-xl font-bold text-foreground">
                {section.title}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mt-3 leading-relaxed text-muted whitespace-pre-line"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
