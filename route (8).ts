import { NextResponse } from "next/server";
import { db } from "@/lib/db";
function norm(s:string){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLocaleLowerCase("pt-BR");}
export async function POST(req:Request){
 const {participantId,name}=await req.json();
 if(!participantId||!name?.trim())return NextResponse.json({error:"Selecione seu perfil e informe seu nome."},{status:400});
 const s=db();
 const {data:p,error}=await s.from("participants").select("id,name,drawn").eq("id",participantId).single();
 if(error||!p||norm(p.name.split(/\s+/)[0])!==norm(name))return NextResponse.json({error:"O nome não confere com o perfil selecionado."},{status:401});
 if(p.drawn)return NextResponse.json({error:"Este participante já realizou o sorteio."},{status:409});
 const {data:d,error:de}=await s.from("draws").select("receiver_id").eq("giver_id",participantId).single();
 if(de||!d)return NextResponse.json({error:"O sorteio ainda não foi liberado pelo administrador."},{status:409});
 const {data:receiver,error:re}=await s.from("participants").select("name,photo_url").eq("id",d.receiver_id).single();
 if(re||!receiver)return NextResponse.json({error:"Não foi possível carregar o resultado."},{status:500});
 const {error:updateError}=await s.from("participants").update({drawn:true}).eq("id",participantId).eq("drawn",false);
 if(updateError)return NextResponse.json({error:"Não foi possível registrar a conclusão."},{status:500});
 return NextResponse.json({result:receiver});
}
