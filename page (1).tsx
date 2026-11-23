"use client";
import { useEffect, useState, type FormEvent } from "react";

type Person = { id: string; name: string; photo_url: string | null; family_id: string | null; drawn: boolean };
type Family = { id: string; name: string };

export default function Admin() {
  const [logged, setLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [personName, setPersonName] = useState("");
  const [photo, setPhoto] = useState("");
  const [family, setFamily] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editingFamily, setEditingFamily] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [p, f] = await Promise.all([fetch("/api/admin/participants"), fetch("/api/admin/families")]);
    if (p.ok) { setPeople(await p.json()); setLogged(true); }
    if (f.ok) setFamilies(await f.json());
  }

  async function login() {
    const r = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (r.ok) { setLogged(true); setMsg(""); await load(); }
    else setMsg("Senha administrativa incorreta.");
  }

  useEffect(() => { load(); }, []);

  async function uploadPhoto(file?: File) {
    if (!file) return photo;
    const form = new FormData();
    form.append("photo", file);
    const r = await fetch("/api/admin/upload-photo", { method: "POST", body: form });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Não foi possível enviar a foto.");
    return d.photo_url as string;
  }

  function resetPersonForm() {
    setEditingPerson(null); setPersonName(""); setPhoto(""); setFamily("");
    const input = document.getElementById("person-photo") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function savePerson(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const input = document.getElementById("person-photo") as HTMLInputElement | null;
      const uploaded = await uploadPhoto(input?.files?.[0]);
      const body = { name: personName, photo_url: uploaded || null, family_id: family || null };
      const r = await fetch("/api/admin/participants", {
        method: editingPerson ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPerson ? { ...body, id: editingPerson } : body)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível salvar o participante.");
      setMsg(editingPerson ? "Participante atualizado." : "Participante adicionado.");
      resetPersonForm(); await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally { setBusy(false); }
  }

  async function saveFamily(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch("/api/admin/families", {
      method: editingFamily ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingFamily ? { id: editingFamily, name: familyName } : { name: familyName })
    });
    const d = await r.json();
    setMsg(r.ok ? (editingFamily ? "Núcleo atualizado." : "Núcleo criado.") : d.error);
    if (r.ok) { setFamilyName(""); setEditingFamily(null); await load(); }
  }

  function editPerson(p: Person) {
    setEditingPerson(p.id); setPersonName(p.name); setPhoto(p.photo_url || ""); setFamily(p.family_id || "");
    const input = document.getElementById("person-photo") as HTMLInputElement | null;
    if (input) input.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removePerson(id: string) {
    if (!confirm("Excluir este participante?")) return;
    const r = await fetch("/api/admin/participants?id=" + id, { method: "DELETE" });
    const d = await r.json(); setMsg(r.ok ? "Participante excluído." : d.error); await load();
  }

  async function removeFamily(id: string) {
    if (!confirm("Excluir este núcleo? Os participantes vinculados ficarão sem núcleo familiar.")) return;
    const r = await fetch("/api/admin/families?id=" + id, { method: "DELETE" });
    const d = await r.json(); setMsg(r.ok ? "Núcleo excluído." : d.error); await load();
  }

  async function generate() {
    if (!confirm("Gerar o sorteio definitivo? Esta ação cria todos os pares e não deve ser repetida.")) return;
    const r = await fetch("/api/admin/generate", { method: "POST" });
    const d = await r.json(); setMsg(r.ok ? d.message : d.error); await load();
  }

  async function reset() {
    if (!confirm("ATENÇÃO: apagar todos os resultados e permitir novo sorteio?")) return;
    const r = await fetch("/api/admin/reset", { method: "POST" });
    const d = await r.json(); setMsg(r.ok ? d.message : d.error); await load();
  }

  const hasDraw = people.some(p => p.drawn);

  return <main className="page admin-page">
    <header className="hero compact">
      <p className="eyebrow">ÁREA RESTRITA</p><h1>Organização do sorteio</h1>
      <p className="intro">Painel administrativo da família</p>
    </header>

    {!logged ? <section className="panel narrow">
      <h2>Entrar como administrador</h2><label>Senha administrativa</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="primary" onClick={login}>Entrar</button>
      {msg && <p className="error">{msg}</p>}
    </section> : <section className="panel admin-panel">
      <div className="admin-top"><h2>Participantes</h2>
        <span className="counter">{people.filter(p => p.drawn).length} de {people.length} já sortearam</span>
      </div>
      <div className="progress"><span style={{ width: people.length ? `${people.filter(p => p.drawn).length / people.length * 100}%` : "0%" }} /></div>

      <div className="admin-grid">
        <div>
          <h3>{editingPerson ? "Editar participante" : "Adicionar participante"}</h3>
          <form onSubmit={savePerson}>
            <label>Nome completo</label>
            <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Ex.: Maria Silva" required />
            <label>Foto (opcional)</label>
            <input id="person-photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <p className="hint">Envie uma imagem JPG, PNG ou WEBP de até 5 MB.</p>
            {editingPerson && photo && <div className="photo-preview"><img src={photo} alt="Foto atual" /><span>Foto atual. Se não enviar outra, será mantida.</span></div>}
            <label>Núcleo familiar</label>
            <select value={family} onChange={e => setFamily(e.target.value)}>
              <option value="">Sem núcleo definido</option>
              {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <div className="form-actions">
              <button className="primary" disabled={!personName.trim() || busy}>{busy ? "Salvando..." : editingPerson ? "Salvar alterações" : "Adicionar"}</button>
              {editingPerson && <button type="button" className="secondary" onClick={resetPersonForm}>Cancelar</button>}
            </div>
          </form>
        </div>

        <div>
          <h3>{editingFamily ? "Editar núcleo familiar" : "Criar núcleo familiar"}</h3>
          <form onSubmit={saveFamily}>
            <label>Nome do núcleo</label>
            <input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="Ex.: Família Silva" required />
            <div className="form-actions">
              <button className="secondary">{editingFamily ? "Salvar núcleo" : "Criar núcleo"}</button>
              {editingFamily && <button type="button" className="secondary" onClick={() => { setEditingFamily(null); setFamilyName(""); }}>Cancelar</button>}
            </div>
          </form>
          <p className="hint">Você pode renomear ou excluir núcleos na lista abaixo.</p>
        </div>
      </div>

      <h3>Lista de participantes</h3>
      <div className="admin-list">{people.map(p => <div className="admin-person" key={p.id}>
        <span className="mini-avatar">{p.photo_url ? <img src={p.photo_url} alt="" /> : p.name[0]}</span>
        <span className="admin-person-name">{p.name}<small>{families.find(f => f.id === p.family_id)?.name || "Sem núcleo"}</small></span>
        <span className={p.drawn ? "status done-status" : "status"}>{p.drawn ? "Concluído" : "Pendente"}</span>
        <button className="secondary small-action" onClick={() => editPerson(p)}>Editar</button>
        <button className="remove" onClick={() => removePerson(p.id)} aria-label={"Excluir " + p.name} disabled={hasDraw}>×</button>
      </div>)}</div>

      <h3>Núcleos familiares</h3>
      <div className="admin-list">{families.map(f => <div className="admin-person" key={f.id}>
        <span className="mini-avatar">⌂</span>
        <span className="admin-person-name">{f.name}<small>{people.filter(p => p.family_id === f.id).length} participante(s)</small></span>
        <button className="secondary small-action" onClick={() => { setEditingFamily(f.id); setFamilyName(f.name); }}>Editar</button>
        <button className="remove" onClick={() => removeFamily(f.id)} aria-label={"Excluir " + f.name} disabled={hasDraw}>×</button>
      </div>)}</div>

      <div className="actions"><button className="primary" onClick={generate}>Gerar sorteio</button>
        <button className="secondary" onClick={reset}>Reiniciar resultados</button></div>
      <p className="hint">O painel mostra somente quem já realizou o sorteio. Os nomes dos pares não são exibidos aqui.</p>
      {hasDraw && <p className="hint">Como o sorteio já foi gerado, alterações de núcleo e exclusões ficam bloqueadas para preservar os pares. Para reorganizar os participantes, primeiro reinicie os resultados.</p>}
      {msg && <p className="message">{msg}</p>}
    </section>}
    <p className="admin-link"><a href="/">Voltar ao sorteio</a></p>
  </main>;
}
