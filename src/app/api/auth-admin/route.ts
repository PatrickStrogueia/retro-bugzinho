import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { senha } = await request.json();

    if (!senha || typeof senha !== "string") {
      return Response.json({ error: "Senha não informada" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD não está configurado nas variáveis de ambiente.");
      return Response.json({ error: "Servidor não configurado" }, { status: 500 });
    }

    const senhaBuffer = Buffer.from(senha);
    const adminBuffer = Buffer.from(adminPassword);

    // Compara em tempo constante para evitar timing attacks
    const authorized =
      senhaBuffer.length === adminBuffer.length &&
      timingSafeEqual(senhaBuffer, adminBuffer);

    if (!authorized) {
      return Response.json({ error: "Senha incorreta" }, { status: 401 });
    }

    return Response.json({ authorized: true });
  } catch {
    return Response.json({ error: "Requisição inválida" }, { status: 400 });
  }
}
