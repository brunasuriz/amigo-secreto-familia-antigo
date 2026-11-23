import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/session";
export async function POST(){if(!await isAdmin())return NextResponse.json({error:"Não autorizado."},{status:401});const s=db();const {error}=await s.from("draws").delete().neq("giver_id","00000000-0000-0000-0000-000000000000");if(error)return NextResponse.json({error:error.message},{status:500});const {error:e}=await s.from("participants").update({drawn:false}).neq("id","00000000-0000-0000-0000-000000000000");if(e)return NextResponse.json({error:e.message},{status:500});return NextResponse.json({message:"Resultados reiniciados."});}
