import { NextResponse } from "next/server";
import { nombreOuvertes } from "@/lib/ouvertes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compteur des décisions ouvertes — alimente le badge de l'icône PWA (session exigée par le middleware). */
export async function GET() {
  return NextResponse.json({ ouvertes: await nombreOuvertes() });
}
