import { NextRequest, NextResponse } from "next/server";
import roster from "../../../../data/private-students.json";

export const runtime = "edge";
type RecordItem = { id: string; nama: string; kelas: string; nisnAkhir: string; dobIv?: string };
const records = roster as RecordItem[];

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLocaleLowerCase("id-ID");
  if (q.length < 2) return NextResponse.json({ students: [] });
  const students = records
    .filter(student => Boolean(student.dobIv) && student.nama.toLocaleLowerCase("id-ID").includes(q))
    .slice(0, 8)
    .map(({ id, nama, kelas, nisnAkhir }) => ({ id, nama, kelas, nisnAkhir }));
  return NextResponse.json({ students }, { headers: { "Cache-Control": "private, no-store" } });
}
