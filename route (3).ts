import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione uma foto." }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Use uma imagem JPG, PNG ou WEBP." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "A foto deve ter no máximo 5 MB." }, { status: 400 });
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await db().storage
    .from("participant-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: "Não foi possível enviar a foto. Verifique se o bucket participant-photos foi criado no Supabase." }, { status: 500 });
  }

  const { data } = db().storage.from("participant-photos").getPublicUrl(path);
  return NextResponse.json({ photo_url: data.publicUrl });
}
