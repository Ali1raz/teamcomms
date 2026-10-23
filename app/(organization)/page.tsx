import type { Metadata } from "next";
import Companies from "@/components/general/companies";
import { FaqsSection } from "@/components/general/faqs-section";
import Footer from "@/components/general/footer";
import Hero from "@/components/general/hero";
import Navbar from "@/components/general/navbar";
import { SITE } from "@/lib/app/site";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative px-4 py-6 mx-auto w-full overflow-hidden">
        <Navbar />

        <div className="flex flex-col gap-24 mt-32 mx-auto w-full">
          <div className="flex flex-col gap-12">
            <Hero />

            <FaqsSection />

            <Companies />
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}
