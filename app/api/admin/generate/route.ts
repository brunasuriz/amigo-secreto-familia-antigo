import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/session";

function shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function assign(ids:string[], families:Record<string,string|null>):string[]|null {
 const receivers=shuffle([...ids]);
 const order=[...ids].sort((a,b)=>Number(families[a]!==null)-Number(families[b]!==null));
 const result:string[]=[];
 function backtrack(i:number,used:Set<string>):boolean {
  if(i===order.length)return true;
  const giver=order[i];
  const options=shuffle(receivers.filter(r=>r!==giver&&!used.has(r)&&!(families[giver]&&families[giver]===families[r])));
  for(const receiver of options){result[i]=receiver;used.add(receiver);if(backtrack(i+1,used))return true;used.delete(receiver);}
  return false;
 }
 if(!backtrack(0,new Set())) return null;\n const byGiver = new Map(order.map((giver,i)=>[giver,result[i]]));\n return ids.map(id=>byGiver.get(id)!);
}
export async function POST(){
 if(!await isAdmin())return NextResponse.json({error:"Não autorizado."},{status:401});
 const supabase=db();
 const {data:people,error}=await supabase.from("participants").select("id,family_id");
 if(error)return NextResponse.json({error:error.message},{status:500});
 if(!people||people.length<3)return NextResponse.json({error:"Cadastre pelo menos 3 participantes para realizar um sorteio sem auto-sorteio e sem pares do mesmo núcleo."},{status:400});
 const {count}=await supabase.from("draws").select("*",{count:"exact",head:true});
 if((count||0)>0)return NextResponse.json({error:"O sorteio já foi gerado. Use 'Reiniciar resultados' antes de gerar novamente."},{status:409});
 const fam=Object.fromEntries(people.map(p=>[p.id,p.family_id])) as Record<string,string|null>;
 const assignment=assign(people.map(p=>p.id),fam);
 if(!assignment)return NextResponse.json({error:"Não existe uma combinação válida com os núcleos cadastrados. Revise os grupos familiares ou permita exceções."},{status:422});
 const rows=people.map((p,i)=>({giver_id:p.id,receiver_id:assignment[i]}));
 const {error:insertError}=await supabase.from("draws").insert(rows);
 if(insertError)return NextResponse.json({error:"Falha ao gravar o sorteio. Verifique se já existe um sorteio."},{status:500});
 return NextResponse.json({message:"Sorteio gerado. Os resultados serão revelados individualmente."});
}
