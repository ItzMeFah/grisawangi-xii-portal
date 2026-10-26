"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, Bell, CalendarDays, Check, ChevronRight,
  CircleUserRound, ClipboardList, Clock3, CreditCard, Home as House, Megaphone,
  Menu, PartyPopper, ShieldCheck, Utensils, Vote, Wallet, X,
} from "lucide-react";
import students from "../data/students.json";

type Student = { nama: string; kelas: string };
type EventItem = { time: string; title: string; note: string };
type FeatureKey = "voting" | "payment" | "menu" | "rundown";
type PortalData = {
  announcement: string;
  invoiceTotal: number;
  invoiceLines: { name: string; amount: number }[];
  concepts: { name: string; desc: string }[];
  menus: string[];
  events: EventItem[];
  dueDates: string[];
  gates: Record<FeatureKey, { open: boolean; date: string }>;
  votes: Record<string, number>;
  choices: Record<string, number>;
  paid: Record<string, number>;
  menusByStudent: Record<string, { menu: number; allergies: string[]; note: string }>;
};

const KEY = "grissawangi-xii-portal-demo-v1";
const DEFAULT: PortalData = {
  announcement: "Selamat datang di ruang persiapan angkatan. Pilih konsep, cek tagihan, dan simpan kebutuhan konsumsi kamu.",
  invoiceTotal: 300000,
  invoiceLines: [
    { name: "Patungan biaya rekaman & drone", amount: 100000 },
    { name: "Operasional foto & acara", amount: 100000 },
    { name: "Konsumsi & kebutuhan kegiatan", amount: 100000 },
  ],
  concepts: [
    { name: "After the Bell", desc: "Momen santai, cahaya sore, dan cerita di lingkungan sekolah." },
    { name: "Satu Frame, Banyak Cerita", desc: "Editorial yang merayakan karakter dan jurusan kita." },
    { name: "The Last Chapter", desc: "Penutup sinematik untuk bab sekolah yang penuh kenangan." },
  ],
  menus: ["Nasi ayam panggang · sayur · buah", "Nasi telur bumbu · tumis sayur · buah", "Vegetarian · nasi · tempe · sayur · buah"],
  events: [
    { time: "06.00–07.00", title: "Registrasi & pembagian kaos", note: "Cek peserta, pembagian kaos untuk 100 pelunas pertama. Dress code: kaos sekolah." },
    { time: "07.00–08.00", title: "Jalan sehat & bakti sosial", note: "Berkumpul dan mulai bersama dari sekolah." },
    { time: "08.00–09.00", title: "Perjalanan & persiapan lokasi", note: "Pastikan perlengkapan dan kelompok sudah lengkap." },
    { time: "09.00–12.00", title: "Shoot konten 1–4 & foto angkatan", note: "Sesi foto dilakukan bergantian per kelompok." },
    { time: "12.00–13.00", title: "ISHOMA", note: "Istirahat, ibadah, makan." },
    { time: "13.00–14.00", title: "Kembali ke sekolah & persiapan", note: "Peserta kembali ke sekolah pukul 13.00." },
    { time: "14.00–15.00", title: "Shoot konten 5", note: "Pengambilan konten lanjutan di sekolah." },
    { time: "15.00–16.00", title: "Pelepasan merpati", note: "Prosesi bersama di area kegiatan." },
    { time: "16.00–18.00", title: "ISHOMA & waktu jeda", note: "Persiapan untuk sesi malam." },
    { time: "18.00–18.30", title: "Kumpul kembali", note: "Presensi dan pengecekan peserta." },
    { time: "18.30–19.00", title: "Renungan angkatan", note: "Sesi refleksi bersama." },
    { time: "19.00–20.00", title: "Shoot transisi suasana pagi", note: "Konten transisi penutup." },
    { time: "20.00–21.00", title: "Hiburan", note: "Satu jam hiburan dan kebersamaan." },
    { time: "21.00–22.00", title: "Clear up & pulang", note: "Bersihkan area sebelum pembubaran." },
  ],
  dueDates: ["2026-11-10", "2026-11-17", "2026-11-24"],
  gates: {
    voting: { open: true, date: "2026-11-10" },
    payment: { open: true, date: "2026-11-10" },
    menu: { open: true, date: "2026-11-10" },
    rundown: { open: true, date: "2026-11-10" },
  },
  votes: { "0": 68, "1": 104, "2": 53 }, choices: {}, paid: {}, menusByStudent: {},
};
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const studentRows = students as Student[];
const allergens = ["Susu", "Telur", "Ikan", "Udang/kerang", "Kacang", "Kedelai", "Gluten", "Wijen"];

function usePortalData() {
  const [data, setData] = useState<PortalData>(DEFAULT);
  const [student, setStudent] = useState<Student | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) setData({ ...DEFAULT, ...JSON.parse(stored) });
      const savedStudent = localStorage.getItem(`${KEY}:student`);
      if (savedStudent) setStudent(JSON.parse(savedStudent));
    } catch { /* start with editable sample data */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, ready]);
  useEffect(() => {
    if (!ready) return;
    if (student) localStorage.setItem(`${KEY}:student`, JSON.stringify(student));
    else localStorage.removeItem(`${KEY}:student`);
  }, [student, ready]);
  return { data, setData, student, setStudent, ready };
}

export default function Portal({ page }: { page: "home" | "event" | "profile" | "admin" }) {
  const path = usePathname();
  const { data, setData, student, setStudent, ready } = usePortalData();
  const [loginName, setLoginName] = useState("");
  const [nisn, setNisn] = useState("");
  const [toast, setToast] = useState("");
  const [adminTab, setAdminTab] = useState("Ringkasan");
  const [activeSlide, setActiveSlide] = useState(0);
  const [search, setSearch] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState(data.announcement);
  const [menuDraft, setMenuDraft] = useState(data.menus.join("\n"));
  const [eventDraft, setEventDraft] = useState(data.events);
  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("100000");
  const isAdmin = page === "admin";
  const studentKey = student?.nama ?? "demo";
  const paidAmount = data.paid[studentKey] ?? 0;
  const menuRecord = data.menusByStudent[studentKey] ?? { menu: 0, allergies: [], note: "" };
  const totalVotes = Object.values(data.votes).reduce((sum, v) => sum + v, 0);
  const estimatedRevenue = studentRows.length * data.invoiceTotal;
  const collected = Object.values(data.paid).reduce((sum, v) => sum + v, 0);
  const filteredStudents = useMemo(() => studentRows.filter(s => `${s.nama} ${s.kelas}`.toLowerCase().includes(search.toLowerCase())), [search]);

  useEffect(() => { const timer = setInterval(() => setActiveSlide(x => (x + 1) % 3), 4200); return () => clearInterval(timer); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => { setNewAnnouncement(data.announcement); setMenuDraft(data.menus.join("\n")); setEventDraft(data.events); }, [data]);

  if (!ready) return <main className="loading"><span className="brand-mark">G</span><p>Menyiapkan ruang angkatan…</p></main>;
  if (!student && !isAdmin) return <Login name={loginName} setName={setLoginName} nisn={nisn} setNisn={setNisn} onSubmit={() => {
    const found = studentRows.find(s => s.nama.toLowerCase() === loginName.trim().toLowerCase());
    if (!found) return setToast("Pilih nama yang tersedia dari daftar.");
    if (!/^\d{10}$/.test(nisn)) return setToast("NISN harus berisi 10 angka.");
    setStudent(found); setToast(`Hai, ${found.nama.split(" ")[0]}!`);
  }} />;

  const toggleGate = (key: FeatureKey) => setData(d => ({ ...d, gates: { ...d.gates, [key]: { ...d.gates[key], open: !d.gates[key].open } } }));
  const savePayment = (amount = 100000) => {
    if (!student) return;
    if (!amount || amount < 1) return setToast("Masukkan nominal yang benar.");
    setData(d => ({ ...d, paid: { ...d.paid, [studentKey]: Math.min(d.invoiceTotal, (d.paid[studentKey] ?? 0) + amount) } }));
    setToast("Simulasi cicilan tercatat di perangkat ini.");
  };
  const saveFood = (menu: number, allergies: string[], note: string) => {
    if (!student) return;
    setData(d => ({ ...d, menusByStudent: { ...d.menusByStudent, [studentKey]: { menu, allergies, note } } }));
    setToast("Pilihan konsumsi tersimpan di perangkat ini.");
  };
  const chooseVote = (idx: number) => {
    if (!student) return;
    setData(d => {
      const old = d.choices[studentKey]; const votes = { ...d.votes };
      if (old !== undefined) votes[String(old)] = Math.max(0, (votes[String(old)] ?? 1) - 1);
      votes[String(idx)] = (votes[String(idx)] ?? 0) + 1;
      return { ...d, votes, choices: { ...d.choices, [studentKey]: idx } };
    });
    setToast("Suara kamu tersimpan di perangkat ini.");
  };

  return <div className="site-shell">
    <header className="topbar">
      <Link href="/" className="wordmark"><span className="brand-mark">G</span><span><b>GRISAWANGI</b><small>SMK PGRI 1 Giri Banyuwangi</small></span></Link>
      <div className="top-actions">
        {!isAdmin && <Link className="announcement-mini" href="/event"><Bell size={16}/><span>Info angkatan</span></Link>}
        {!isAdmin && <Link href="/profile" className="user-pill"><span className="avatar">{student?.nama.slice(0,1)}</span><span className="user-desktop">{student?.nama.split(" ")[0]}</span></Link>}
        <Link aria-label="Keluar" title="Keluar" className="icon-button exit" href="/" onClick={e => { e.preventDefault(); setStudent(null); setToast("Kamu sudah keluar."); }}><ArrowDownRight size={19}/></Link>
      </div>
    </header>
    {isAdmin ? <Admin data={data} setData={setData} tab={adminTab} setTab={setAdminTab} search={search} setSearch={setSearch} students={filteredStudents} totalVotes={totalVotes} revenue={estimatedRevenue} collected={collected} paymentName={paymentName} setPaymentName={setPaymentName} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} announcement={newAnnouncement} setAnnouncement={setNewAnnouncement} menuDraft={menuDraft} setMenuDraft={setMenuDraft} eventDraft={eventDraft} setEventDraft={setEventDraft} toggleGate={toggleGate} toast={setToast} /> : <main className="main-content">
      {page === "home" && <Home data={data} paid={paidAmount} totalVotes={totalVotes} slide={activeSlide} vote={student ? data.choices[studentKey] : undefined} chooseVote={chooseVote} />}
      {page === "event" && <Event data={data} setData={setData} student={student} paid={paidAmount} savePayment={savePayment} menuRecord={menuRecord} saveFood={saveFood} toast={setToast} />}
      {page === "profile" && <Profile student={student} paid={paidAmount} data={data} setStudent={setStudent} />}
    </main>}
    {!isAdmin && <nav className="bottom-nav" aria-label="Navigasi siswa">
      <Link href="/" className={path === "/" ? "selected" : ""}><House/><span>Beranda</span></Link>
      <Link href="/event" className={path.startsWith("/event") ? "selected" : ""}><CalendarDays/><span>Event</span></Link>
      <Link href="/profile" className={path.startsWith("/profile") ? "selected" : ""}><CircleUserRound/><span>Profile</span></Link>
    </nav>}
    <footer className="site-footer"><span>GRISAWANGI · XII</span><Link href="/admin"><ShieldCheck size={14}/> Backoffice panitia</Link></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

function Login({ name, setName, nisn, setNisn, onSubmit }: { name: string; setName: (v: string) => void; nisn: string; setNisn: (v: string) => void; onSubmit: () => void }) {
  return <main className="login-page"><div className="login-visual"><Link href="/" className="wordmark light"><span className="brand-mark">G</span><span><b>GRISAWANGI</b><small>SMK PGRI 1 Giri Banyuwangi</small></span></Link><div className="login-copy"><span className="eyebrow">RUANG ANGKATAN XII</span><h1>Satu angkatan.<br/><em>Banyak cerita.</em></h1><p>Voting konsep, persiapan event, dan kabar terbaru angkatan—semua dalam satu ruang.</p><div className="float-cards"><span>✳ foto angkatan</span><span>↗ jalan sehat</span><span>♥ cerita kita</span></div></div><div className="login-orbit"/><span className="login-school">BANYUWANGI · 2026</span></div>
    <section className="login-form-wrap"><form className="login-card" onSubmit={e => { e.preventDefault(); onSubmit(); }}><div className="avatar large">XII</div><span className="eyebrow violet">PORTAL SISWA</span><h2>Masuk, yuk.</h2><p className="muted">Gunakan data diri untuk masuk ke ruang kelasmu.</p><label>Nama lengkap<select required value={name} onChange={e => setName(e.target.value)}><option value="">Pilih nama kamu</option>{studentRows.map((s,i) => <option key={`${s.nama}-${i}`} value={s.nama}>{s.nama} · {s.kelas}</option>)}</select></label><label>NISN<input required inputMode="numeric" maxLength={10} value={nisn} onChange={e => setNisn(e.target.value.replace(/\D/g,""))} placeholder="Masukkan 10 digit NISN"/></label><div className="notice"><ShieldCheck size={17}/><span>Mode pratinjau: NISN belum dicocokkan dengan sistem sekolah. Jangan gunakan NISN asli di situs demo ini.</span></div><button className="button primary wide" type="submit">Masuk ke portal <ArrowRight size={17}/></button><small className="login-caption">Data siswa mengikuti roster XII yang tersedia.</small></form></section>
  </main>;
}

function Home({ data, paid, totalVotes, slide, vote, chooseVote }: { data: PortalData; paid: number; totalVotes: number; slide: number; vote?: number; chooseVote: (i:number)=>void }) {
  const headlines = ["Satu angkatan, banyak cerita.", "Bikin momen terakhir jadi berarti.", "Semua suara punya tempat."];
  return <>
    <div className="notice-banner"><Megaphone size={17}/><span><b>Info terbaru</b>{data.announcement}</span><ArrowRight size={16}/></div>
    <section className="welcome-row"><div><span className="eyebrow">FOTO ANGKATAN · KELAS XII</span><h1>Hai, teman <span>GRISAWANGI.</span></h1><p>Ini ruang kita buat merancang momen yang bakal diingat.</p></div><div className="day-chip"><CalendarDays size={17}/><span>Persiapan angkatan<strong>2026</strong></span></div></section>
    <section className="feature-hero"><div className="hero-copy"><span className="hero-kicker"><PartyPopper size={15}/> THE LAST CHAPTER</span><h2 key={slide}>{headlines[slide]}</h2><p>Yuk ikut urun suara dan pastikan semua detail acara kita siap bersama.</p><Link href="/event" className="button cream">Lihat persiapan <ArrowRight size={16}/></Link><div className="hero-dots">{headlines.map((_,i)=><button key={i} aria-label={`Slide ${i+1}`} className={slide===i?"active":""}/>)}</div></div><div className="hero-art" aria-hidden="true"><div className="sun"/><div className="arc arc-one"/><div className="arc arc-two"/><span className="sparkle s1">✳</span><span className="sparkle s2">✦</span><div className="art-caption">XII<br/><small>CLASS OF<br/>2026</small></div></div></section>
    <div className="stats-row"><Link href="/event#invoice" className="stat-card"><span className="stat-icon lilac"><Wallet/></span><small>Tagihan kamu</small><strong>{rupiah(Math.max(0,data.invoiceTotal-paid))}</strong><span className="stat-foot">Sisa dari {rupiah(data.invoiceTotal)} <ArrowRight size={13}/></span></Link><Link href="/event#voting" className="stat-card"><span className="stat-icon peach"><Vote/></span><small>Suara masuk</small><strong>{totalVotes} <i>suara</i></strong><span className="stat-foot">Ikut menentukan konsep <ArrowRight size={13}/></span></Link><Link href="/event#rundown" className="stat-card"><span className="stat-icon mint"><Clock3/></span><small>Hari acara</small><strong>06.00 <i>WIB</i></strong><span className="stat-foot">Cek jadwal lengkap <ArrowRight size={13}/></span></Link></div>
    <section className="section-block" id="voting"><div className="section-heading"><div><span className="eyebrow">PILIHAN TEMAN-TEMAN</span><h2>Konsep foto angkatan</h2></div><Link href="/event#voting" className="text-link">Semua konsep <ChevronRight size={17}/></Link></div><div className="concept-grid">{data.concepts.map((c,i)=><article className={`concept-card concept-${i}`} key={i}><div className="concept-cover"><span className="concept-letter">0{i+1}</span><span className="cover-symbol">{["✳","◒","✦"][i%3]}</span><span className="cover-tag">KONSEP {String.fromCharCode(65+i)}</span></div><div className="concept-body"><h3>{c.name}</h3><p>{c.desc}</p><div className="vote-line"><div className="vote-meter"><i style={{width:`${Math.min(100,(data.votes[String(i)]||0)/Math.max(1,totalVotes)*100)}%`}}/></div><span>{data.votes[String(i)]||0}</span></div><button className={`button vote-button ${vote===i?"chosen":""}`} onClick={()=>chooseVote(i)}>{vote===i?<><Check size={15}/> Pilihanmu</>:<>Pilih konsep <ArrowRight size={15}/></>}</button></div></article>)}</div></section>
    <section className="home-bottom"><div className="quote-card"><span className="eyebrow">CATATAN PANITIA</span><p>“Yang bikin angkatan berkesan bukan cuma acaranya, tapi karena kita jalanin bareng-bareng.”</p><small>— Panitia Foto Angkatan XII</small></div><Link href="/event" className="event-teaser"><span className="eyebrow">NEXT UP</span><b>Hari kegiatan</b><strong>Registrasi mulai 06.00</strong><span>Dress code: kaos sekolah <ArrowRight size={16}/></span><div className="teaser-spark">✳</div></Link></section>
  </>;
}

function FeatureLock({ open, date }: { open: boolean; date: string }) {
  return !open ? <div className="feature-lock"><span className="lock-icon">◷</span><b>Coming soon..</b><span>{date ? `Akan Terbuka pada ${new Date(date+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit",year:"numeric"})}` : "Jadwal akan segera menyusul!"}</span></div> : null;
}

function Event({ data, setData, student, paid, savePayment, menuRecord, saveFood, toast }: { data: PortalData; setData: React.Dispatch<React.SetStateAction<PortalData>>; student: Student|null; paid: number; savePayment: (amount:number)=>void; menuRecord: {menu:number;allergies:string[];note:string}; saveFood: (menu:number,allergies:string[],note:string)=>void; toast:(s:string)=>void }) {
  const [selectedMenu,setSelectedMenu]=useState(menuRecord.menu); const [selectedAllergies,setSelectedAllergies]=useState<string[]>(menuRecord.allergies); const [allergyNote,setAllergyNote]=useState(menuRecord.note); const [amount,setAmount]=useState("100000");
  const studentKey=student?.nama??"demo"; const [idea,setIdea]=useState("");
  const chooseVote=(idx:number)=>setData(d=>{const old=d.choices[studentKey];const votes={...d.votes};if(old!==undefined)votes[String(old)]=Math.max(0,(votes[String(old)]??1)-1);votes[String(idx)]=(votes[String(idx)]??0)+1;return{...d,votes,choices:{...d.choices,[studentKey]:idx}}});
  return <><section className="page-intro"><span className="eyebrow">JADWAL & PERSIAPAN</span><h1>Event kita.</h1><p>Semua yang perlu kamu tahu sebelum hari kegiatan.</p></section><div className="event-tabs"><a href="#rundown"><Clock3/>Rundown</a><a href="#invoice"><CreditCard/>Pembayaran</a><a href="#consumption"><Utensils/>Konsumsi</a></div>
    <section id="rundown" className="event-panel"><div className="panel-title"><span className="panel-icon lilac"><CalendarDays/></span><div><span className="eyebrow">HARI KEGIATAN</span><h2>Rundown acara</h2></div><span className="live-dot">JADWAL</span></div><FeatureLock open={data.gates.rundown.open} date={data.gates.rundown.date}/>{data.gates.rundown.open&&<div className="schedule">{data.events.map((ev,i)=><div className="schedule-row" key={i}><time>{ev.time}</time><i className="timeline-dot"/><div><b>{ev.title}</b><p>{ev.note}</p></div></div>)}</div>}</section>
    <section id="invoice" className="event-panel billing-panel"><div className="panel-title"><span className="panel-icon peach"><Wallet/></span><div><span className="eyebrow">IURAN FOTO ANGKATAN</span><h2>Tagihan & cicilan</h2></div><span className="bill-total">{rupiah(data.invoiceTotal)}</span></div><FeatureLock open={data.gates.payment.open} date={data.gates.payment.date}/>{data.gates.payment.open&&<><p className="helper-text">Cicilan fleksibel, total tagihan {rupiah(data.invoiceTotal)} per siswa.</p><div className="invoice-lines">{data.invoiceLines.map((line,i)=><div key={i}><span>{line.name}</span><b>{rupiah(line.amount)}</b></div>)}<div className="free-shirt"><span>Kaos merchandise untuk 100 pelunas pertama</span><b>GRATIS</b></div></div><div className="installment-dates">{data.dueDates.map((date,i)=><div key={i}><span><b>0{i+1}</b> Cicilan {i+1}</span><small>{date?new Date(`${date}T00:00:00`).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"Jadwal segera menyusul"}</small></div>)}</div><div className="progress-wrap"><div><span>Sudah tercatat</span><b>{rupiah(paid)} <small>/ {rupiah(data.invoiceTotal)}</small></b></div><div className="progress-bar"><i style={{width:`${Math.min(100,paid/Math.max(1,data.invoiceTotal)*100)}%`}}/></div></div><div className="installment-actions"><select value={amount} onChange={e=>setAmount(e.target.value)}><option value="50000">Rp50.000</option><option value="100000">Rp100.000</option><option value="150000">Rp150.000</option><option value={String(data.invoiceTotal)}>{rupiah(data.invoiceTotal)} · lunas</option></select><button className="button primary" onClick={()=>savePayment(Number(amount))}>Catat pembayaran simulasi <ArrowRight size={16}/></button></div><div className="notice"><Wallet size={17}/><span>Simulasi saja. Pembayaran belum terhubung ke transfer atau payment gateway.</span></div></>}</section>
    <section id="consumption" className="event-panel"><div className="panel-title"><span className="panel-icon mint"><Utensils/></span><div><span className="eyebrow">PILIHAN KONSUMSI</span><h2>Menu kamu</h2></div><span className="live-dot">BISA DIUBAH</span></div><FeatureLock open={data.gates.menu.open} date={data.gates.menu.date}/>{data.gates.menu.open&&<><p className="helper-text">Pilih satu menu. Tandai alergi yang perlu panitia ketahui.</p><div className="menu-choices">{data.menus.map((m,i)=><label className={`menu-choice ${selectedMenu===i?"picked":""}`} key={i}><input type="radio" name="menu" checked={selectedMenu===i} onChange={()=>setSelectedMenu(i)}/><span className="menu-number">0{i+1}</span><span><b>{m.split(" · ")[0]}</b><small>{m}</small></span><i>{selectedMenu===i?<Check/>:null}</i></label>)}</div><div className="allergy-box"><b>Alergi atau pantangan</b><div className="allergy-grid">{allergens.map(a=><label key={a}><input type="checkbox" checked={selectedAllergies.includes(a)} onChange={e=>setSelectedAllergies(xs=>e.target.checked?[...xs,a]:xs.filter(x=>x!==a))}/>{a}</label>)}</div><input value={allergyNote} onChange={e=>setAllergyNote(e.target.value)} placeholder="Catatan tambahan (opsional)"/></div><button className="button primary" onClick={()=>saveFood(selectedMenu,selectedAllergies,allergyNote)}>Simpan pilihan <Check size={16}/></button></>}</section>
    <section id="voting" className="event-panel"><div className="panel-title"><span className="panel-icon violet"><Vote/></span><div><span className="eyebrow">SUARA ANGKATAN</span><h2>Voting konsep</h2></div><span className="live-dot">{Object.values(data.votes).reduce((a,b)=>a+b,0)} SUARA</span></div><FeatureLock open={data.gates.voting.open} date={data.gates.voting.date}/>{data.gates.voting.open&&<div className="event-votes">{data.concepts.map((c,i)=><button key={i} className={data.choices[studentKey]===i?"selected":""} onClick={()=>{chooseVote(i);toast("Suara tersimpan di perangkat ini.")}}><span>0{i+1}</span><b>{c.name}</b><small>{data.votes[String(i)]||0} suara</small><ArrowRight size={16}/></button>)}</div>}</section>
  </>;
}

function Profile({ student, paid, data, setStudent }: {student:Student|null;paid:number;data:PortalData;setStudent:(s:Student|null)=>void}) {
  const initials=student?.nama.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()??"XII";
  return <><section className="page-intro"><span className="eyebrow">AKUN SISWA</span><h1>Profile.</h1><p>Informasi keikutsertaan kamu di persiapan angkatan.</p></section><section className="profile-hero"><div className="profile-avatar">{initials}</div><div><span className="eyebrow">PESERTA FOTO ANGKATAN</span><h2>{student?.nama}</h2><p>{student?.kelas} · SMK PGRI 1 Giri Banyuwangi</p></div><span className="verified-tag"><Check size={14}/> Terdaftar</span></section><div className="profile-grid"><div className="profile-box"><span className="eyebrow">PROGRES IURAN</span><strong>{rupiah(paid)}</strong><span className="helper-text">dari total tagihan Rp300.000</span><div className="progress-bar"><i style={{width:`${Math.min(100,paid/300000*100)}%`}}/></div><Link href="/event#invoice" className="text-link">Lihat tagihan <ArrowRight size={15}/></Link></div><div className="profile-box"><span className="eyebrow">PILIHAN KONSUMSI</span><strong className="profile-menu">{data.menus[data.menusByStudent[student?.nama??"demo"]?.menu??0]?.split(" · ")[0]}</strong><span className="helper-text">{(data.menusByStudent[student?.nama??"demo"]?.allergies??[]).length?`Catatan alergi: ${data.menusByStudent[student?.nama??"demo"]?.allergies.join(", ")}`:"Belum ada alergi yang dicatat"}</span><Link href="/event#consumption" className="text-link">Ubah pilihan <ArrowRight size={15}/></Link></div></div><div className="profile-security"><ShieldCheck/><span><b>Data profil</b><small>NISN tidak disimpan pada perangkat dalam mode pratinjau.</small></span></div><Link href="/admin" className="admin-link"><ShieldCheck size={17}/> Akses backoffice panitia <ArrowRight size={15}/></Link><button className="button line signout" onClick={()=>setStudent(null)}>Keluar dari akun <ArrowDownRight size={16}/></button></>;
}

function Admin(props: {
  data:PortalData;setData:React.Dispatch<React.SetStateAction<PortalData>>;tab:string;setTab:(s:string)=>void;search:string;setSearch:(s:string)=>void;students:Student[];totalVotes:number;revenue:number;collected:number;paymentName:string;setPaymentName:(s:string)=>void;paymentAmount:string;setPaymentAmount:(s:string)=>void;announcement:string;setAnnouncement:(s:string)=>void;menuDraft:string;setMenuDraft:(s:string)=>void;eventDraft:EventItem[];setEventDraft:(s:EventItem[])=>void;toggleGate:(k:FeatureKey)=>void;toast:(s:string)=>void;
}) {
  const tabs=["Ringkasan","Pembayaran","Rundown","Voting","Konsumsi","Tagihan","Pengumuman"];
  const keys:FeatureKey[]=["payment","rundown","voting","menu"];
  const names:Record<FeatureKey,string>={payment:"Pembayaran",rundown:"Rundown",voting:"Voting",menu:"Konsumsi"};
  const keyStudent=props.paymentName;
  const saveAdminPayment=()=>{
    const matched=studentRows.find(s=>s.nama.toLowerCase()===keyStudent.toLowerCase());
    if(!matched)return props.toast("Pilih siswa dari hasil pencarian.");
    props.setData(d=>({...d,paid:{...d.paid,[matched.nama]:Math.min(300000,(d.paid[matched.nama]??0)+Number(props.paymentAmount))}}));
    props.toast("Catatan pembayaran diperbarui di perangkat ini.");
  };
  const renderControl = () => {
    switch(props.tab){
      case "Ringkasan": return <><div className="admin-welcome"><span className="eyebrow">BACKOFFICE · PANITIA</span><h1>Ringkasan angkatan</h1><p>Pantau persiapan XII dalam satu dashboard.</p><span className="preview-chip">PRATINJAU LOKAL</span></div><div className="admin-metrics"><Metric icon={<CircleUserRound/>} label="Siswa di roster" value={String(studentRows.length)} foot="Nama dari data XII"/><Metric icon={<Wallet/>} label="Tercatat di perangkat" value={rupiah(props.collected)} foot="Simulasi pembayaran"/><Metric icon={<CreditCard/>} label="Target tagihan" value={rupiah(props.revenue)} foot="Rp300.000 × siswa"/><Metric icon={<Vote/>} label="Total suara" value={String(props.totalVotes)} foot="Hasil contoh voting"/></div><div className="admin-columns"><div className="admin-card"><div className="admin-card-head"><h2>Akses halaman siswa</h2><span>ON/OFF</span></div>{keys.map(k=><div className="gate-row" key={k}><span><b>{names[k]}</b><small>{props.data.gates[k].open?"Terbuka untuk siswa":`Terjadwal · ${props.data.gates[k].date}`}</small></span><input className="gate-date" aria-label={`Tanggal buka ${names[k]}`} type="date" value={props.data.gates[k].date} onChange={e=>props.setData(d=>({...d,gates:{...d.gates,[k]:{...d.gates[k],date:e.target.value}}}))}/><button className={`toggle ${props.data.gates[k].open?"on":""}`} onClick={()=>props.toggleGate(k)} aria-label={`Ubah akses ${names[k]}`}><i/></button></div>)}</div><div className="admin-card announcement-card"><div className="admin-card-head"><h2><Megaphone/> Pengumuman terbaru</h2></div><p>{props.data.announcement}</p><button className="button secondary" onClick={()=>props.setTab("Pengumuman")}>Kelola pengumuman <ArrowRight size={15}/></button></div></div></>;
      case "Pembayaran": return <><AdminHeading eyebrow="KEUANGAN" title="Pembayaran siswa" sub="Catat cicilan dan pantau progres setiap siswa."/><div className="admin-metrics compact"><Metric icon={<Wallet/>} label="Dana tercatat" value={rupiah(props.collected)} foot="Di perangkat ini"/><Metric icon={<ClipboardList/>} label="Tagihan penuh" value={rupiah(props.revenue)} foot="Proyeksi 300 ribu/siswa"/></div><div className="admin-card"><div className="admin-card-head"><h2>Tambah catatan pembayaran</h2><span className="demo-tag">SIMULASI</span></div><div className="admin-payment-form"><label>Cari nama siswa<input list="student-list" value={props.paymentName} onChange={e=>props.setPaymentName(e.target.value)} placeholder="Ketik nama siswa"/><datalist id="student-list">{studentRows.map((s,i)=><option key={i} value={s.nama}>{s.kelas}</option>)}</datalist></label><label>Nominal<select value={props.paymentAmount} onChange={e=>props.setPaymentAmount(e.target.value)}><option value="50000">Rp50.000</option><option value="100000">Rp100.000</option><option value="150000">Rp150.000</option><option value="300000">Rp300.000 · lunas</option></select></label><button className="button primary" onClick={saveAdminPayment}>Simpan pembayaran <Check size={16}/></button></div></div><div className="admin-card"><div className="admin-card-head"><h2>Daftar siswa</h2><span>{props.students.length} ditemukan</span></div><input className="search-input" value={props.search} onChange={e=>props.setSearch(e.target.value)} placeholder="Cari nama atau kelas…"/><div className="student-table">{props.students.slice(0,40).map((s,i)=><div className="student-row" key={i}><span className="mini-avatar">{s.nama.slice(0,1)}</span><span><b>{s.nama}</b><small>{s.kelas}</small></span><span className={`payment-badge ${(props.data.paid[s.nama]??0)>=300000?"paid":""}`}>{rupiah(props.data.paid[s.nama]??0)}</span></div>)}</div></div></>;
      case "Rundown": return <><AdminHeading eyebrow="HARI KEGIATAN" title="Atur rundown" sub="Edit jadwal yang tampil di halaman Event siswa."/><div className="admin-card"><div className="admin-card-head"><h2>Jadwal kegiatan</h2><button className="button secondary" onClick={()=>props.setEventDraft([...props.eventDraft,{time:"22.00–22.30",title:"Agenda baru",note:""}])}>+ Tambah agenda</button></div>{props.eventDraft.map((ev,i)=><div className="admin-event-row" key={i}><input aria-label="Waktu" value={ev.time} onChange={e=>props.setEventDraft(props.eventDraft.map((x,n)=>n===i?{...x,time:e.target.value}:x))}/><input aria-label="Agenda" value={ev.title} onChange={e=>props.setEventDraft(props.eventDraft.map((x,n)=>n===i?{...x,title:e.target.value}:x))}/><input aria-label="Keterangan" value={ev.note} placeholder="Keterangan singkat" onChange={e=>props.setEventDraft(props.eventDraft.map((x,n)=>n===i?{...x,note:e.target.value}:x))}/><button aria-label="Hapus agenda" className="icon-button danger" onClick={()=>props.setEventDraft(props.eventDraft.filter((_,n)=>n!==i))}><X/></button></div>)}<button className="button primary" onClick={()=>{props.setData(d=>({...d,events:props.eventDraft}));props.toast("Rundown tersimpan di perangkat ini.")}}>Simpan perubahan <Check size={16}/></button></div></>;
      case "Voting": return <><AdminHeading eyebrow="FORUM SISWA" title="Kelola voting" sub="Edit nama konsep dan buka atau tutup voting."/><div className="admin-card">{props.data.concepts.map((c,i)=><div className="concept-editor" key={i}><span className="mini-avatar">0{i+1}</span><div><input value={c.name} onChange={e=>props.setData(d=>({...d,concepts:d.concepts.map((x,n)=>n===i?{...x,name:e.target.value}:x)}))}/><textarea value={c.desc} onChange={e=>props.setData(d=>({...d,concepts:d.concepts.map((x,n)=>n===i?{...x,desc:e.target.value}:x)}))}/></div><b>{props.data.votes[String(i)]??0} suara</b></div>)}<div className="admin-gate-inline"><span><b>Voting siswa</b><small>{props.data.gates.voting.open?"Sedang dibuka":"Sedang ditutup"}</small></span><button className={`toggle ${props.data.gates.voting.open?"on":""}`} onClick={()=>props.toggleGate("voting")}><i/></button></div></div></>;
      case "Konsumsi": return <><AdminHeading eyebrow="PILIHAN MENU" title="Kelola konsumsi" sub="Sesuaikan pilihan menu dan periode pengisian."/><div className="admin-card"><label className="form-label">Daftar menu · satu menu per baris<textarea className="big-textarea" value={props.menuDraft} onChange={e=>props.setMenuDraft(e.target.value)}/></label><button className="button primary" onClick={()=>{props.setData(d=>({...d,menus:props.menuDraft.split("\n").map(s=>s.trim()).filter(Boolean)}));props.toast("Menu tersimpan di perangkat ini.")}}>Simpan menu <Check size={16}/></button><div className="admin-gate-inline"><span><b>Form konsumsi siswa</b><small>{props.data.gates.menu.open?"Sedang dibuka":"Sedang ditutup"}</small></span><button className={`toggle ${props.data.gates.menu.open?"on":""}`} onClick={()=>props.toggleGate("menu")}><i/></button></div><p className="admin-note">Pilihan menu dan catatan alergi bersifat contoh sampai penyimpanan bersama diaktifkan.</p></div></>;
      case "Tagihan": return <><AdminHeading eyebrow="IURAN FOTO ANGKATAN" title="Atur tagihan" sub="Kelola nominal invoice dan tenggat cicilan."/><div className="admin-card"><div className="invoice-summary"><label>Total per siswa<input type="number" min="0" step="1000" value={props.data.invoiceTotal} onChange={e=>props.setData(d=>({...d,invoiceTotal:Number(e.target.value)}))}/></label><small>Total invoice bisa diubah panitia.</small></div><div className="admin-card-head invoice-breakdown-title"><h2>Komponen tagihan</h2><button className="button secondary" onClick={()=>props.setData(d=>({...d,invoiceLines:[...d.invoiceLines,{name:"Komponen baru",amount:0}]}))}>+ Tambah komponen</button></div>{props.data.invoiceLines.map((line,i)=><div className="invoice-edit-row" key={i}><input aria-label="Nama komponen" value={line.name} onChange={e=>props.setData(d=>({...d,invoiceLines:d.invoiceLines.map((x,n)=>n===i?{...x,name:e.target.value}:x)}))}/><input aria-label="Nominal komponen" type="number" min="0" value={line.amount} onChange={e=>props.setData(d=>({...d,invoiceLines:d.invoiceLines.map((x,n)=>n===i?{...x,amount:Number(e.target.value)}:x)}))}/><button className="icon-button danger" aria-label="Hapus komponen" onClick={()=>props.setData(d=>({...d,invoiceLines:d.invoiceLines.filter((_,n)=>n!==i)}))}><X/></button></div>) }<div className="due-grid">{props.data.dueDates.map((dt,i)=><label key={i}>Cicilan {i+1}<input type="date" value={dt} onChange={e=>props.setData(d=>({...d,dueDates:d.dueDates.map((x,n)=>n===i?e.target.value:x)}))}/></label>)}</div><div className="admin-gate-inline"><span><b>Invoice siswa</b><small>{props.data.gates.payment.open?"Bisa dibuka":"Ditutup sementara"}</small></span><button className={`toggle ${props.data.gates.payment.open?"on":""}`} onClick={()=>props.toggleGate("payment")}><i/></button></div></div></>;
      default: return <><AdminHeading eyebrow="KABAR XII" title="Pengumuman angkatan" sub="Pesan ini tampil di beranda setiap siswa."/><div className="admin-card"><label className="form-label">Isi pengumuman<textarea className="big-textarea" value={props.announcement} onChange={e=>props.setAnnouncement(e.target.value)}/></label><button className="button primary" onClick={()=>{props.setData(d=>({...d,announcement:props.announcement}));props.toast("Pengumuman diperbarui di perangkat ini.")}}>Terbitkan pengumuman <Megaphone size={16}/></button><p className="admin-note">Mode demo lokal: pengumuman belum terkirim ke perangkat siswa lain.</p></div></>;
    }
  };
  return <main className="admin-layout"><aside className="admin-sidebar"><div className="admin-brand"><span className="brand-mark">G</span><span><b>GRISAWANGI</b><small>PANITIA · XII</small></span></div><span className="admin-nav-title">BACKOFFICE</span>{tabs.map(t=><button key={t} className={props.tab===t?"active":""} onClick={()=>props.setTab(t)}>{t==="Ringkasan"?<House/>:t==="Pembayaran"?<Wallet/>:t==="Rundown"?<CalendarDays/>:t==="Voting"?<Vote/>:t==="Konsumsi"?<Utensils/>:t==="Tagihan"?<CreditCard/>:<Megaphone/>}{t}</button>)}<div className="admin-sidebar-foot"><span className="live-dot">DEMO LOKAL</span><small>Data tersimpan di browser ini saja.</small><Link href="/">Kembali ke portal siswa <ArrowRight size={14}/></Link></div></aside><section className="admin-content">{renderControl()}</section><nav className="admin-mobile-nav">{tabs.slice(0,5).map(t=><button key={t} className={props.tab===t?"active":""} onClick={()=>props.setTab(t)}>{t==="Ringkasan"?<House/>:t==="Pembayaran"?<Wallet/>:t==="Rundown"?<CalendarDays/>:t==="Voting"?<Vote/>:<Utensils/>}<span>{t}</span></button>)}</nav></main>;
}

function Metric({icon,label,value,foot}:{icon:React.ReactNode;label:string;value:string;foot:string}){return <div className="admin-metric"><span className="metric-icon">{icon}</span><small>{label}</small><b>{value}</b><span>{foot}</span></div>}
function AdminHeading({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){return <div className="admin-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{sub}</p></div>}
