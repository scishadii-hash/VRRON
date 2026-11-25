interface Env {
  AI: Ai;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function extractReply(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const value = result as Record<string, unknown>;
  if (typeof value.response === "string") return value.response;
  if (typeof value.text === "string") return value.text;
  const choices = value.choices;
  if (Array.isArray(choices) && choices.length) {
    const first = choices[0] as Record<string, unknown>;
    const message = first.message as Record<string, unknown> | undefined;
    if (message && typeof message.content === "string") return message.content;
  }
  return "";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;
    while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: HEADERS });
    }

    if (path === "/health" && request.method === "GET") {
      return json({ status: "ok", service: "vrron-core", version: "0.2.0", timestamp: new Date().toISOString() });
    }

    if (path === "/assistants" && request.method === "GET") {
      return json({
        assistants: [{
          id: "general",
          name: { ar: "VRRON General", en: "VRRON General" },
          description: { ar: "المساعد العام لمنظومة VRRON", en: "VRRON general assistant" },
          accent: "violet"
        }]
      });
    }

    if (path === "/chat" && request.method === "POST") {
      let body: unknown;
      try { body = await request.json(); } catch { return json({ error: { code: "invalid_json", message: "أرسل JSON صحيح." } }, 400); }
      if (!body || typeof body !== "object") return json({ error: { code: "invalid_request", message: "بيانات الطلب غير صحيحة." } }, 400);
      const input = body as Record<string, unknown>;
      const rawMessages = input.messages;
      if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 30) {
        return json({ error: { code: "invalid_messages", message: "أرسل من 1 إلى 30 رسالة." } }, 400);
      }
      const messages: ChatMessage[] = [];
      for (const item of rawMessages) {
        if (!item || typeof item !== "object") return json({ error: { code: "invalid_message", message: "صيغة الرسالة غير صحيحة." } }, 400);
        const message = item as Record<string, unknown>;
        if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string" || !message.content.trim() || message.content.length > 8000) {
          return json({ error: { code: "invalid_message", message: "الرسالة فارغة أو طويلة أو بصيغة غير صحيحة." } }, 400);
        }
        messages.push({ role: message.role, content: message.content.trim() });
      }
      if (messages[messages.length - 1]?.role !== "user") return json({ error: { code: "last_message_must_be_user", message: "آخر رسالة لازم تكون من المستخدم." } }, 400);
      try {
        const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          messages: [
            { role: "system", content: "You are VRRON, a capable, friendly AI assistant. Reply in the same language as the user, usually Egyptian Arabic when they use it. Be accurate, useful, and clear. Do not claim to browse the internet or perform actions unless a tool actually did so." },
            ...messages
          ],
          chat_template_kwargs: { enable_thinking: false }
        });
        const reply = extractReply(result).trim();
        if (!reply) return json({ error: { code: "empty_ai_response", message: "الموديل رجّع ردًا فارغًا. جرّب مرة أخرى." } }, 502);
        return json({ assistantId: typeof input.assistantId === "string" ? input.assistantId : "general", reply, model: "@cf/google/gemma-4-26b-a4b-it" });
      } catch (error) {
        console.error("Workers AI request failed", error);
        return json({ error: { code: "ai_unavailable", message: "خدمة الذكاء الاصطناعي غير متاحة حاليًا. جرّب لاحقًا." } }, 503);
      }
    }

    if (path === "/health" || path === "/assistants" || path === "/chat") {
      return json({ error: { code: "method_not_allowed", message: "الطريقة غير مدعومة لهذا المسار." } }, 405);
    }
    return json({ error: { code: "not_found", message: "Route not found." } }, 404);
  }
};
