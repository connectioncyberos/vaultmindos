import { getCurrentUser } from "@/lib/auth/session";
import { getPaidCourses } from "@/lib/academy/queries";
import { getCouponsForAdmin, getGrantsForAdmin, getAllStudentsForAdmin } from "@/lib/scholarships/queries";
import { createCouponAction, toggleCouponActiveAction, grantScholarshipDirectAction } from "./actions";

/**
 * /admin/academy/bolsas — cupons de bolsa (autosserviço) e concessão
 * direta a um aluno específico. Só cursos pagos (`getPaidCourses`)
 * entram no dropdown — bolsa não faz sentido em curso já gratuito.
 */
export default async function AdminBolsasPage({
  searchParams,
}: {
  searchParams: { erro?: string; criado?: string; concedido?: string };
}) {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
        Só o admin pode gerenciar bolsas.
      </p>
    );
  }

  const [cursosPagos, cupons, concessoes, alunos] = await Promise.all([
    getPaidCourses(),
    getCouponsForAdmin(),
    getGrantsForAdmin(),
    getAllStudentsForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Bolsas</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Cupons de bolsa (o aluno digita o código na página do curso) e concessão direta a um aluno
          específico — os dois caminhos liberam 100% na hora ou reduzem o valor cobrado no Mercado
          Pago Checkout Pro.
        </p>
      </div>

      {searchParams?.erro && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">{searchParams.erro}</p>
      )}
      {searchParams?.criado === "1" && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Cupom criado.
        </p>
      )}
      {searchParams?.concedido === "1" && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Bolsa concedida.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-100">Novo cupom</h2>
        <form action={createCouponAction} className="flex flex-col gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Código</label>
              <input
                name="code"
                required
                placeholder="ex.: BOLSA100"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Curso (vazio = qualquer curso pago)</label>
              <select
                name="course_id"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="">Qualquer curso pago</option>
                {cursosPagos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Desconto (%)</label>
              <input
                name="discount_percent"
                type="number"
                min={1}
                max={100}
                required
                placeholder="100 ou 50"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Usos máximos (vazio = ilimitado)</label>
              <input
                name="max_redemptions"
                type="number"
                min={1}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Criar cupom
          </button>
        </form>

        {cupons.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Desconto</th>
                  <th className="px-4 py-3">Usos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {cupons.map((cupom) => (
                  <tr key={cupom.id} className="text-neutral-300">
                    <td className="px-4 py-3 font-mono text-neutral-100">{cupom.code}</td>
                    <td className="px-4 py-3 text-neutral-400">{cupom.courseTitle}</td>
                    <td className="px-4 py-3">{cupom.discount_percent}%</td>
                    <td className="px-4 py-3 text-neutral-400">
                      {cupom.redemption_count}
                      {cupom.max_redemptions ? ` / ${cupom.max_redemptions}` : " / ilimitado"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                          cupom.is_active
                            ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                            : "border-neutral-700 bg-neutral-900 text-neutral-500"
                        }`}
                      >
                        {cupom.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleCouponActiveAction}>
                        <input type="hidden" name="coupon_id" value={cupom.id} />
                        <input type="hidden" name="next_active" value={(!cupom.is_active).toString()} />
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-emerald-500"
                        >
                          {cupom.is_active ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-100">Concessão direta a um aluno</h2>
        <form
          action={grantScholarshipDirectAction}
          className="flex flex-col gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Aluno</label>
              <select
                name="student_id"
                required
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="">Selecione</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.fullName ?? `Usuário ${aluno.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Curso</label>
              <select
                name="course_id"
                required
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="">Selecione</option>
                {cursosPagos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Desconto (%)</label>
              <input
                name="discount_percent"
                type="number"
                min={1}
                max={100}
                required
                placeholder="100 ou 50"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            100% libera a matrícula na hora, sem passar pelo Mercado Pago. Menos que isso só autoriza o
            desconto — o aluno completa a compra pelo valor reduzido na página do curso.
          </p>
          <button
            type="submit"
            className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Conceder bolsa
          </button>
        </form>

        {concessoes.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Desconto</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {concessoes.map((grant) => (
                  <tr key={grant.id} className="text-neutral-300">
                    <td className="px-4 py-3">{grant.studentName}</td>
                    <td className="px-4 py-3 text-neutral-400">{grant.courseTitle}</td>
                    <td className="px-4 py-3">{grant.discount_percent}%</td>
                    <td className="px-4 py-3 text-neutral-400">
                      {grant.source === "COUPON" ? "Cupom" : "Concessão direta"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(grant.created_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
