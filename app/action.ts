import "server-only";
import { env } from "@/lib/env";
import { transporter } from "@/lib/nodemailer";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const styles = {
  container:
    "max-width: 500px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;",
  header: "font-size: 16px; color: #333; margin-bottom: 10px;",
  paragraph: "font-size: 14px; margin-bottom: 20px;",
  link: "text-decoration: none; background-color: #007bff; color: #fff; padding: 8px 16px; border-radius: 4px;",
};

export async function SendEmail({
  to,
  subject,
  meta,
}: {
  to: string;
  subject: string;
  meta: {
    description: string;
    link?: string;
  };
}) {
  if (process.env.NODE_ENV !== "production") {
    // Log full email payload for debugging in development
    console.log("[DEV EMAIL]", { to, subject, meta });
    return { success: true };
  }

  const mailOptions = {
    from: env.NODEMAILER_USER,
    to,
    subject,
    html: `
      <div style="${styles.container}">
        <h1 style="${styles.header}">${escapeHtml(subject)}</h1>
        <p style="${styles.paragraph}">${escapeHtml(meta.description)}</p>
        ${
          meta.link
            ? `<a href="${escapeHtml(meta.link)}" style="${styles.link}">Click here</a>`
            : ""
        }
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch {
    return { success: false };
  }
}
