import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserCertificates } from "@/lib/academy/queries";

/** Lista de certificados emitidos automaticamente ao concluir um curso (Fase 1). */
export default async function CertificadosPage() {
  const user = (await getCurrentUser())!;
  const certificates = await getUserCertificates(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/academy" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Academy
        </Link>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Certificados</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Emitidos automaticamente ao concluir 100% das aulas de um curso.
        </p>
      </div>

      {certificates.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Você ainda não concluiu nenhum curso. Continue suas trilhas para emitir seu primeiro certificado.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {certificates.map((cert) => (
            <li
              key={cert.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 p-4"
            >
              <div>
                <p className="font-semibold text-neutral-100">{cert.course.title}</p>
                <p className="text-xs text-neutral-500">
                  Emitido em {new Date(cert.issued_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <code className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-emerald-400">
                {cert.code}
              </code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
