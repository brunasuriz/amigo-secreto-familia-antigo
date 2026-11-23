 "use client";
import { useEffect, useState } from "react";

type Person = { id: string; name: string; photo_url: string | null; family_id: string | null; drawn: boolean };
export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [name, setName] = useState("");
  const [result, setResult] = useState<{name:string;photo_url:string|null}|null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/participants");
    if (r.ok) setPeople(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function draw() {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/draw", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({participantId:selected.id, name}) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Não foi possível realizar o sorteio.");
      setResult(data.result);
      load();
    } catch(e) { setError(e instanceof Error ? e.message : "Ocorreu um erro."); }
    finally { setBusy(false); }
  }

  return <main className="page">
    <header className="hero">
      <div className="ornament">✦  ✧  ✦</div>
      <p className="eyebrow">FIM DE ANO EM FAMÍLIA</p>
      <h1>Amigo Secreto</h1>
      <p className="intro">Um presente, uma surpresa e um motivo a mais para estarmos juntos.</p>
      <div className="garland">✳　✦　❋　✦　✳</div>
    </header>

    {!result ? <section className="panel">
      <h2>Quem vai fazer o sorteio?</h2>
      <p className="muted">Toque na sua foto ou no seu nome para continuar.</p>
      {people.length === 0 ? <p className="empty">O sorteio ainda não está disponível. Peça ao administrador para cadastrar os participantes.</p> :
        <div className="people">
          {people.map(p => <button key={p.id} className={`person ${selected?.id===p.id?"chosen":""} ${p.drawn?"done":""}`} onClick={()=>{setSelected(p);setName("");setError("");}}>
            <span className="avatar">{p.photo_url ? <img src={p.photo_url} alt="" /> : <span>{p.name.slice(0,1).toUpperCase()}</span>}</span>
            <span className="person-name">{p.name}</span>
            <span className="person-state">{p.drawn ? "Sorteio realizado" : selected?.id===p.id ? "Selecionado" : "Toque para selecionar"}</span>
          </button>)}
        </div>}
      {selected && <div className="verify">
        <h3>Você é {selected.name}?</h3>
        <label htmlFor="confirm-name">Para confirmar, digite seu primeiro nome:</label>
        <input id="confirm-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu primeiro nome" autoComplete="off" />
        <button className="primary" disabled={busy || !name.trim()} onClick={draw}>{busy ? "Preparando..." : "Sortear meu amigo secreto"}</button>
        {error && <p className="error">{error}</p>}
      </div>}
    </section> : <section className="panel reveal">
      <p className="eyebrow">SEU AMIGO SECRETO É</p>
      <div className="result-avatar">{result.photo_url ? <img src={result.photo_url} alt="" /> : result.name.slice(0,1).toUpperCase()}</div>
      <h2 className="result-name">{result.name}</h2>
      <p className="muted">Guarde essa informação em segredo!</p>
      <div className="notice">Este resultado é individual. Não compartilhe a tela e feche esta página quando terminar.</div>
      <button className="secondary" onClick={()=>{setResult(null);setSelected(null);setName("");}}>Fechar resultado</button>
    </section>}
    <footer>Feito para celebrar juntos <span>♥</span></footer>
    <p className="admin-link"><a href="/admin">Acesso do administrador</a></p>
  </main>;
}
