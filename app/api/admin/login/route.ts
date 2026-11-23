import { NextResponse } from "next/server";
import { makeAdminToken, adminCookieName } from "@/lib/session";
export async function POST(req:Request) {
 const {password}=await req.json();
 if(!process.env.ADMIN_PASSWORD || password!==process.env.ADMIN_PASSWORD)return NextResponse.json({error:"Senha incorreta."},{status:401});
 const res=NextResponse.json({ok:true});
 res.cookies.set(adminCookieName,makeAdminToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:60*60*12});
 return res;
}
