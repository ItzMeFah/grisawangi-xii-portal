import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import roster from "../../../../data/private-students.json";

export const runtime = "edge";
type RecordItem = { id: string; nama: string; kelas: string; nisnAkhir: string; dobSalt: string; dobHash: string; iv: string; nisnCiphertext: string; tag: string };
const records = roster as RecordItem[];
const fromBase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const toBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));

async function hashBirthDate(date: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(date), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export async function POST(request: NextRequest) {
  let body: { id?: unknown; dob?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 }); }
  if (typeof body.id !== "string" || typeof body.dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.dob)) {
    return NextResponse.json({ error: "Isi tanggal lahir dengan benar." }, { status: 400 });
  }
  const student = records.find(item => item.id === body.id);
  if (!student) return NextResponse.json({ error: "Nama tidak ditemukan." }, { status: 404 });
  let actual: Uint8Array;
  try { actual = await hashBirthDate(body.dob, fromBase64(student.dobSalt)); }
  catch { return NextResponse.json({ error: "Verifikasi sedang bermasalah. Coba lagi nanti." }, { status: 503 }); }
  const expected = fromBase64(student.dobHash);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < Math.max(actual.length, expected.length); i++) diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
  if (diff !== 0) return NextResponse.json({ error: "Tanggal lahir belum cocok. Periksa lagi ya." }, { status: 401 });

  const secret = (env as unknown as { PRIVATE_ROSTER_KEY?: string }).PRIVATE_ROSTER_KEY;
  if (!secret) return NextResponse.json({ error: "Verifikasi sedang disiapkan. Coba beberapa saat lagi." }, { status: 503 });
  try {
    const key = await crypto.subtle.importKey("raw", fromBase64(secret), "AES-GCM", false, ["decrypt"]);
    const cipher = new Uint8Array([...fromBase64(student.nisnCiphertext), ...fromBase64(student.tag)]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(student.iv) }, key, cipher);
    const nisn = new TextDecoder().decode(plain);
    return NextResponse.json({ student: { id: student.id, nama: student.nama, kelas: student.kelas, nisn } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Verifikasi sedang bermasalah. Coba lagi nanti." }, { status: 503 });
  }
}
