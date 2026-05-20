import { NextResponse } from "next/server";

/**
 * Meta / Instagram webhooks land here in Phase 2 (subscribe to fields, verify challenge, etc.).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: true, message: "Webhook endpoint (placeholder)" });
}

export async function POST() {
  return NextResponse.json({ ok: true, received: true });
}
