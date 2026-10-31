import type { LegalDocument, LegalSection } from "@/lib/legalContent";

const TITLES_BN: Record<string, string> = {
  "Privacy Policy": "প্রাইভেসি পলিসি",
  "Terms & Conditions": "শর্তাবলী",
  "Terms and Conditions": "শর্তাবলী",
};

function Sections({ sections, prefix }: { sections: LegalSection[]; prefix: string }) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={`${prefix}-${section.title}`}>
          <h2 className="text-lg font-extrabold sm:text-xl">{section.title}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="mt-3 whitespace-pre-line leading-relaxed text-[#374151]">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

/** Bangla first (primary audience), English version below. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const titleBn = TITLES_BN[document.title] ?? document.title;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 rounded-[22px] border border-border bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{titleBn}</h1>
        <p className="mt-1 text-lg font-semibold text-muted">{document.title}</p>
        <p className="mt-4 text-sm text-muted">
          কার্যকর: {document.effectiveDate} · সর্বশেষ আপডেট: {document.lastUpdated}
        </p>
        <nav aria-label="ভাষা" className="mt-4 flex gap-2 text-sm font-bold">
          <a href="#bn" className="rounded-full bg-primary-soft px-4 py-1.5 text-moq">বাংলা</a>
          <a href="#en" className="rounded-full border border-border px-4 py-1.5 hover:border-primary">English</a>
        </nav>
      </header>

      <article id="bn" className="scroll-mt-40 rounded-[22px] border border-border bg-white p-6 sm:p-8">
        <Sections sections={document.sectionsBn} prefix="bn" />
      </article>

      <article id="en" className="mt-6 scroll-mt-40 rounded-[22px] border border-border bg-white p-6 sm:p-8">
        <p className="mb-6 text-xs font-bold uppercase tracking-[0.08em] text-muted">English version</p>
        <Sections sections={document.sectionsEn} prefix="en" />
      </article>
    </div>
  );
}
