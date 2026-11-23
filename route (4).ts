import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/session";

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await db().from("participants")
    .select("id,name,photo_url,family_id,drawn").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  const { data, error } = await db().from("participants")
    .insert({ name: b.name.trim(), photo_url: b.photo_url || null, family_id: b.family_id || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const b = await req.json();
  if (!b.id || !b.name?.trim()) return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });

  const { count, error: countError } = await db().from("draws")
    .select("giver_id", { count: "exact", head: true });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const { data: current, error: currentError } = await db().from("participants")
    .select("family_id").eq("id", b.id).single();
  if (currentError) return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 });

  if ((count || 0) > 0 && (b.family_id || null) !== current.family_id) {
    return NextResponse.json({ error: "Para alterar o núcleo familiar depois de gerar o sorteio, primeiro reinicie os resultados." }, { status: 400 });
  }

  const { data, error } = await db().from("participants")
    .update({ name: b.name.trim(), photo_url: b.photo_url || null, family_id: b.family_id || null })
    .eq("id", b.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID ausente." }, { status: 400 });

  const { count, error: countError } = await db().from("draws")
    .select("giver_id", { count: "exact", head: true });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count || 0) > 0) {
    return NextResponse.json({ error: "Para excluir participantes depois de gerar o sorteio, primeiro reinicie os resultados." }, { status: 400 });
  }

  const { error } = await db().from("participants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
