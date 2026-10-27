import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import roster from "../../../../data/private-students.json";

export const runtime = "edge";
type RecordItem = { id: string; nama: string; kelas: string; nisnAkhir: string; dobIv?: string; dobCiphertext?: string; dobTag?: string; iv: string; nisnCiphertext: string; tag: string };
const records = roster as RecordItem[];
const fromBase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

export async function POST(request: NextRequest) {
  let body: { id?: unknown; dob?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 }); }
  if (typeof body.id !== "string" || typeof body.dob !== "string" || !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(body.dob)) {
    return NextResponse.json({ error: "Pilih bulan dan tanggal lahir dengan benar." }, { status: 400 });
  }
  const [month, day] = body.dob.split("-").map(Number);
  if (day > new Date(2000, month, 0).getDate()) return NextResponse.json({ error: "Tanggal tersebut tidak ada di bulan pilihan." }, { status: 400 });
  const student = records.find(item => item.id === body.id);
  if (!student) return NextResponse.json({ error: "Nama tidak ditemukan." }, { status: 404 });
  const secret = (env as unknown as { PRIVATE_ROSTER_KEY?: string }).PRIVATE_ROSTER_KEY;
  if (!secret) return NextResponse.json({ error: "Verifikasi sedang disiapkan. Coba beberapa saat lagi." }, { status: 503 });
  try {
    const key = await crypto.subtle.importKey("raw", fromBase64(secret), "AES-GCM", false, ["decrypt"]);
    if (student.dobIv && student.dobCiphertext && student.dobTag) {
      const encryptedDob = new Uint8Array([...fromBase64(student.dobCiphertext), ...fromBase64(student.dobTag)]);
      const plainDob = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(student.dobIv) }, key, encryptedDob);
      if (new TextDecoder().decode(plainDob) !== body.dob) return NextResponse.json({ error: "Tanggal lahir belum cocok. Periksa lagi ya." }, { status: 401 });
    } else {
      return NextResponse.json({ error: "Akun ini belum aktif untuk verifikasi. Hubungi panitia." }, { status: 409 });
    }

    const cipher = new Uint8Array([...fromBase64(student.nisnCiphertext), ...fromBase64(student.tag)]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(student.iv) }, key, cipher);
    const nisn = new TextDecoder().decode(plain);
    return NextResponse.json({ student: { id: student.id, nama: student.nama, kelas: student.kelas, nisn } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Verifikasi sedang bermasalah. Coba lagi nanti." }, { status: 503 });
  }
}
