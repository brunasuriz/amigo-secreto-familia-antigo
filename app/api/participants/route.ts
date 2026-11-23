import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
 const {data,error}=await db().from("participants").select("id,name,photo_url,family_id,drawn").order("name");
 if(error)return NextResponse.json({error:"Não foi possível carregar participantes."},{status:500});
 return NextResponse.json(data);
}
