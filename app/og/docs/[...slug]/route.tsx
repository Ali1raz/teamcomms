import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { appName } from "@/lib/shared";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "80px",
        background: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, opacity: 0.6 }}>
        {appName}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
          {page.data.title}
        </div>
        {page.data.description ? (
          <div style={{ fontSize: 32, opacity: 0.7 }}>
            {page.data.description}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", fontSize: 24, opacity: 0.5 }}>
        {page.url}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageImage(page).segments,
  }));
}
