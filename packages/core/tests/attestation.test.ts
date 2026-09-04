import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { pdfAttestation } from "../src/documents/attestation";
import { COMMUNES } from "../src/communes";

test("l'attestation PDF se génère, contient les mentions et est déterministe", async () => {
  const d = { familleId: "f", famille: "Famille Témoin A", email: "t@x.y", periode: "2026-09", commune: COMMUNES["villiers-sur-marne"]!, lignes: [{ date: "2026-09-07", enfant: "Lina", prestation: "Pause méridienne (repas)", montant: 428 }], total: 428, paye: 428, etat: "payee" as const, genereLe: "2026-10-05T10:00:00.000Z" };
  const a = await pdfAttestation(d), b = await pdfAttestation(d);
  assert.ok(a.length > 1000);
  const lu = await PDFDocument.load(a);
  assert.equal(lu.getTitle(), "Attestation de paiement 2026-09");
  assert.equal(lu.getPageCount(), 1);
  assert.equal(Buffer.compare(Buffer.from(a), Buffer.from(b)), 0);
});
