import Link from "next/link";
import { getSeoOverview } from "@/lib/admin/queries";

/** /admin/seo — visao geral de SEO title/description por artigo. */
export default async function AdminSeoPage() {
  const artigos = await getSeoOverview();
  const semSeo = artigos.filter((a) => !a.seo_title || !a.seo_description);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-100">SEO</h1>
      <p className="text-base leading-relaxed text-neutral-400">
        {semSeo.length === 0
          ? "Todos os artigos têm SEO title e description preenchidos."
          : `${semSeo.length} artigo(s) sem SEO title/description completo.`}
      </p>

      {artigos.length === 0 ? (
        <p className="text-sm text-neutral-400">Nenhum artigo ainda.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2">Título</th>
              <th className="py-2">SEO title</th>
              <th className="py-2">SEO description</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {artigos.map((artigo) => {
              const completo = Boolean(artigo.seo_title && artigo.seo_description);
              return (
                <tr key={artigo.id} className="border-b border-neutral-900">
                  <td className="py-2 pr-2 text-neutral-100">{artigo.title}</td>
                  <td className="py-2 pr-2 text-neutral-400">
                    {artigo.seo_title ?? <span className="text-red-400">faltando</span>}
                  </td>
                  <td className="py-2 pr-2 text-neutral-400">
                    {artigo.seo_description ?? <span className="text-red-400">faltando</span>}
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/admin/artigos/${artigo.id}/editar`} className="text-neutral-300 underline">
                      {completo ? "Ver" : "Completar"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
