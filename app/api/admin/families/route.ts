import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/session";
export async function GET(){if(!await isAdmin())return NextResponse.json({error:"Não autorizado."},{status:401});const {data,error}=await db().from("families").select("id,name").order("name");if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json(data);}
export async function POST(req:Request){if(!await isAdmin())return NextResponse.json({error:"Não autorizado."},{status:401});const {name}=await req.json();if(!name?.trim())return NextResponse.json({error:"Informe o nome do núcleo."},{status:400});const {data,error}=await db().from("families").insert({name:name.trim()}).select().single();if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json(data);}
