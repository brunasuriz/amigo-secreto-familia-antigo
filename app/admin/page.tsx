 "use client";
import { useEffect, useState } from "react";
type Person = {id:string;name:string;photo_url:string|null;family_id:string|null;drawn:boolean};
type Family = {id:string;name:string};
export default function Admin() {
 const [logged,setLogged]=useState(false), [password,setPassword]=useState("");
 const [people,setPeople]=useState<Person[]>([]), [families,setFamilies]=useState<Family[]>([]);
 const [personName,setPersonName]=useState(""), [photo,setPhoto]=useState(""), [family,setFamily]=useState("");
 const [familyName,setFamilyName]=useState(""), [msg,setMsg]=useState(""), [busy,setBusy]=useState(false);
 async function load(){const [p,f]=await Promise.all([fetch("/api/admin/participants"),fetch("/api/admin/families")]); if(p.ok){setPeople(await p.json());setLogged(true);} if(f.ok)setFamilies(await f.json());}
 async function login(){const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})}); if(r.ok){setLogged(true);setMsg("");load();}else setMsg("Senha administrativa incorreta.");}
 useEffect(()=>{load();},[]);
 async function addPerson(){setBusy(true);const r=await fetch("/api/admin/participants",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:personName,photo_url:photo||null,family_id:family||null})});const d=await r.json();setMsg(r.ok?"Participante adicionado.":d.error);if(r.ok){setPersonName("");setPhoto("");load();}setBusy(false);}
 async function addFamily(){const r=await fetch("/api/admin/families",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:familyName})});const d=await r.json();setMsg(r.ok?"Núcleo familiar criado.":d.error);if(r.ok){setFamilyName("");load();}}
 async function removePerson(id:string){if(!confirm("Remover este participante?"))return;const r=await fetch("/api/admin/participants?id="+id,{method:"DELETE"});const d=await r.json();setMsg(r.ok?"Participante removido.":d.error);load();}
 async function generate(){if(!confirm("Gerar o sorteio definitivo? Esta ação cria todos os pares e não deve ser repetida."))return;const r=await fetch("/api/admin/generate",{method:"POST"});const d=await r.json();setMsg(r.ok?d.message:d.error);load();}
 async function reset(){if(!confirm("ATENÇÃO: apagar todos os resultados e permitir novo sorteio?"))return;const r=await fetch("/api/admin/reset",{method:"POST"});const d=await r.json();setMsg(r.ok?d.message:d.error);load();}
 return <main className="page admin-page"><header className="hero compact"><p className="eyebrow">ÁREA RESTRITA</p><h1>Organização do sorteio</h1><p className="intro">Painel administrativo da família</p></header>
 {!logged?<section className="panel narrow"><h2>Entrar como administrador</h2><label>Senha administrativa</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><button className="primary" onClick={login}>Entrar</button>{msg&&<p className="error">{msg}</p>}</section>:
 <section className="panel admin-panel">
 <div className="admin-top"><h2>Participantes</h2><span className="counter">{people.filter(p=>p.drawn).length} de {people.length} já sortearam</span></div>
 <div className="progress"><span style={{width:people.length?`${people.filter(p=>p.drawn).length/people.length*100}%`:"0%"}} /></div>
 <div className="admin-grid">
 <div><h3>Adicionar participante</h3><label>Nome completo</label><input value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Ex.: Maria Silva"/><label>Link da foto (opcional)</label><input value={photo} onChange={e=>setPhoto(e.target.value)} placeholder="https://..."/><label>Núcleo familiar</label><select value={family} onChange={e=>setFamily(e.target.value)}><option value="">Sem núcleo definido</option>{families.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><button className="primary" disabled={!personName.trim()||busy} onClick={addPerson}>Adicionar</button></div>
 <div><h3>Criar núcleo familiar</h3><label>Nome do núcleo</label><input value={familyName} onChange={e=>setFamilyName(e.target.value)} placeholder="Ex.: Família Silva"/><button className="secondary" disabled={!familyName.trim()} onClick={addFamily}>Criar núcleo</button><p className="hint">Depois, associe cada participante ao núcleo ao cadastrá-lo. Para alterar um vínculo, remova e cadastre novamente.</p></div>
 </div>
 <h3>Lista de participantes</h3><div className="admin-list">{people.map(p=><div className="admin-person" key={p.id}><span className="mini-avatar">{p.photo_url?<img src={p.photo_url} alt=""/>:p.name[0]}</span><span className="admin-person-name">{p.name}<small>{families.find(f=>f.id===p.family_id)?.name||"Sem núcleo"}</small></span><span className={p.drawn?"status done-status":"status"}>{p.drawn?"Concluído":"Pendente"}</span><button className="remove" onClick={()=>removePerson(p.id)} aria-label={"Remover "+p.name}>×</button></div>)}</div>
 <div className="actions"><button className="primary" onClick={generate}>Gerar sorteio</button><button className="secondary" onClick={reset}>Reiniciar resultados</button></div>
 <p className="hint">O painel mostra somente quem já realizou o sorteio. Os nomes dos pares não são exibidos aqui.</p>
 {msg&&<p className="message">{msg}</p>}
 </section>}
 <p className="admin-link"><a href="/">Voltar ao sorteio</a></p></main>;
}
