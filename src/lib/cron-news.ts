import { runAutoNewsIngest } from "@/lib/news-auto.server";

export const CRON_NEWS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Cron-Secret",
};

export async function handleCronNewsRequest(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;

  // Se CRON_SECRET está configurado, exige validação (para chamadas manuais/externas)
  // Se não está configurado, permite — o cron do Vercel chama diretamente sem secret
  if (expected) {
    const url = new URL(request.url);
    const provided =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      url.searchParams.get("secret");

    if (provided !== expected) {
      return Response.json(
        { error: "Não autorizado" },
        { status: 401, headers: CRON_NEWS_CORS },
      );
    }
  }

  try {
    const result = await runAutoNewsIngest();
    return Response.json({ ok: true, ...result }, { headers: CRON_NEWS_CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro";
    return Response.json(
      { ok: false, error: message },
      { status: 500, headers: CRON_NEWS_CORS },
    );
  }
}
