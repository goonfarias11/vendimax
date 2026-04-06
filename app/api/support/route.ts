import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { authRateLimit } from "@/lib/rateLimit";

const supportFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().trim().email("Email invalido").max(200),
  subject: z.string().trim().min(3, "El asunto es muy corto").max(140),
  message: z.string().trim().min(10, "El mensaje es muy corto").max(3000),
});

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const result = supportFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Datos invalidos",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const rateLimit = await authRateLimit(`support:${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Proba nuevamente en unos minutos." },
        { status: 429 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "El servicio de correo no esta configurado." },
        { status: 503 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = result.data;
    const supportEmail = process.env.SUPPORT_EMAIL || "soportevendimax@gmail.com";

    const safeName = escapeHtml(data.name);
    const safeEmail = escapeHtml(data.email);
    const safeSubject = escapeHtml(data.subject);
    const safeMessageHtml = escapeHtml(data.message).replace(/\n/g, "<br />");

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "VendiMax <onboarding@resend.dev>",
      to: supportEmail,
      replyTo: data.email,
      subject: `[Soporte] ${data.subject}`,
      html: `
        <h2>Nueva consulta de soporte</h2>
        <p><strong>Nombre:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Asunto:</strong> ${safeSubject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${safeMessageHtml}</p>
      `,
      text: `Nueva consulta de soporte\n\nNombre: ${data.name}\nEmail: ${data.email}\nAsunto: ${data.subject}\n\nMensaje:\n${data.message}`,
    });

    if (error) {
      console.error("[POST /api/support] Error enviando email:", error);
      return NextResponse.json(
        { error: "No se pudo enviar tu consulta. Intenta nuevamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Consulta enviada correctamente. Te responderemos pronto.",
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Error desconocido";
    console.error("[POST /api/support]", error);
    return NextResponse.json(
      { error: "Error interno al procesar la consulta.", details },
      { status: 500 }
    );
  }
}
