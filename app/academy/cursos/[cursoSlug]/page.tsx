import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCourseBySlug,
  getCourseWithContent,
  getEnrollment,
  getUserProgressForLessons,
  getCertificateForCourse,
  hasCompletedNivelamento,
} from "@/lib/academy/queries";
import { reconcilePayment } from "@/lib/payments/grant";
import { getActiveGrant } from "@/lib/scholarships/queries";
import { enrollAction, createCheckoutAction, redeemScholarshipCouponAction } from "../../actions";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Detalhe do curso: módulos/aulas, matrícula, progresso e checkout (cursos pagos). */
export default async function CursoPage({
  params,
  searchParams,
}: {
  params: { cursoSlug: string };
  searchParams: { payment_id?: string; checkout?: string; checkout_error?: string; bolsa_aplicada?: string };
}) {
  const user = (await getCurrentUser())!;

  const course = await getCourseBySlug(params.cursoSlug);
  if (!course || !course.is_active) notFound();

  // Retorno do checkout (Mercado Pago acrescenta `payment_id` na URL de
  // sucesso automaticamente) — reconcilia AQUI, antes de buscar a
  // matrícula abaixo, pra já refletir o pagamento recém-aprovado nesta
  // mesma renderização. `reconcilePayment` reconsulta o status real na
  // API do Mercado Pago, nunca confia só no retorno da URL.
  let paymentJustReconciled: string | null = null;
  if (searchParams?.payment_id) {
    try {
      const result = await reconcilePayment(searchParams.payment_id);
      paymentJustReconciled = result.status;
    } catch (err) {
      console.error("Erro ao confirmar pagamento no retorno do checkout:", err);
    }
  }

  const [content, enrollment, certificate, nivelamentoOk] = await Promise.all([
    getCourseWithContent(course.id),
    getEnrollment(user.id, course.id),
    getCertificateForCourse(user.id, course.id),
    course.sector_id ? hasCompletedNivelamento(user.id) : Promise.resolve(true),
  ]);
  if (!content) notFound();

  const isPaidCourse = !!course.price_cents && course.price_cents > 0;
  // Gate real do Nivelamento (Fase 2 — blueprint seção 14): só se aplica
  // a cursos de setor (trilha de especialização); Nivelamento em si e
  // cursos de teste (sector_id null) não exigem pré-requisito.
  const requiresNivelamento = !!course.sector_id && !nivelamentoOk;

  // Bolsa (cupom resgatado ou concessão direta do admin) — se existir,
  // troca o preço exibido e o valor do botão de compra pelo valor com
  // desconto (ver lib/scholarships).
  const grant = isPaidCourse && !enrollment ? await getActiveGrant(user.id, course.id) : null;
  const finalPriceCents = grant
    ? Math.round((course.price_cents! * (100 - grant.discount_percent)) / 100)
    : course.price_cents;

  const allLessonIds = content.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressMap = enrollment
    ? await getUserProgressForLessons(user.id, allLessonIds)
    : new Map<string, boolean>();

  const totalLessons = allLessonIds.length;
  const completedLessons = allLessonIds.filter((id) => progressMap.get(id)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/academy" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Academy
        </Link>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          {course.level ?? "Curso"}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{course.title}</h1>
        {course.description && (
          <p className="text-base leading-relaxed text-neutral-400">{course.description}</p>
        )}
        {isPaidCourse && !enrollment && (
          <p className="flex flex-wrap items-baseline gap-2 text-lg font-semibold text-emerald-400">
            {grant ? (
              <>
                <span className="text-sm font-normal text-neutral-500 line-through">
                  {BRL.format(course.price_cents! / 100)}
                </span>
                <span>{BRL.format(finalPriceCents! / 100)}</span>
                <span className="text-xs font-normal text-emerald-300">
                  bolsa de {grant.discount_percent}% aplicada
                </span>
              </>
            ) : (
              BRL.format(course.price_cents! / 100)
            )}
          </p>
        )}
      </div>

      {searchParams?.bolsa_aplicada === "1" && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Bolsa aplicada com sucesso.
        </p>
      )}

      {paymentJustReconciled === "APPROVED" && enrollment && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Pagamento aprovado — acesso liberado!
        </p>
      )}
      {paymentJustReconciled && paymentJustReconciled !== "APPROVED" && !enrollment && (
        <p className="rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
          Pagamento em processamento. Assim que for aprovado (pode levar alguns minutos em boleto/Pix
          pendente), o acesso é liberado automaticamente — recarregue esta página pra checar.
        </p>
      )}
      {searchParams?.checkout === "falhou" && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          Pagamento não aprovado. Você pode tentar de novo.
        </p>
      )}
      {searchParams?.checkout === "pendente" && (
        <p className="rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
          Pagamento pendente de confirmação. O acesso é liberado automaticamente assim que for
          aprovado.
        </p>
      )}
      {searchParams?.checkout_error && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          {searchParams.checkout_error}
        </p>
      )}

      {!enrollment ? (
        requiresNivelamento ? (
          <div className="rounded-md border border-amber-900/50 bg-amber-950/20 p-4">
            <p className="text-sm font-medium text-amber-200">
              Pré-requisito: Treinamento de Nivelamento
            </p>
            <p className="mt-1 text-sm text-amber-200/80">
              Esta é uma trilha de especialização — conclua o Nivelamento primeiro pra desbloquear a
              matrícula aqui.
            </p>
            <Link
              href="/academy/cursos/nivelamento"
              className="mt-3 inline-block rounded-md border border-amber-700 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-950/40"
            >
              Ir para o Nivelamento →
            </Link>
          </div>
        ) : isPaidCourse ? (
          <div className="flex flex-col gap-3">
            <form action={createCheckoutAction}>
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="course_slug" value={course.slug} />
              <button
                type="submit"
                className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Comprar acesso — {BRL.format(finalPriceCents! / 100)}
              </button>
            </form>
            {!grant && (
              <form action={redeemScholarshipCouponAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="course_slug" value={course.slug} />
                <input
                  name="coupon_code"
                  placeholder="Código de bolsa (opcional)"
                  className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
                />
                <button
                  type="submit"
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
                >
                  Aplicar cupom
                </button>
              </form>
            )}
          </div>
        ) : (
          <form action={enrollAction}>
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <button
              type="submit"
              className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Matricular-se
            </button>
          </form>
        )
      ) : (
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: totalLessons > 0 ? `${Math.round((completedLessons / totalLessons) * 100)}%` : "0%",
              }}
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {completedLessons} de {totalLessons} aulas concluídas
          </p>
          {certificate && (
            <p className="mt-2 text-sm text-emerald-400">
              Certificado emitido — código <code>{certificate.code}</code>.{" "}
              <Link href="/academy/certificados" className="underline hover:text-emerald-300">
                Ver certificados
              </Link>
            </p>
          )}
        </div>
      )}

      <section className="flex flex-col gap-6">
        {content.modules.map((module) => (
          <div key={module.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-neutral-100">{module.title}</h2>
            <ul className="flex flex-col gap-2">
              {module.lessons.map((lesson) => {
                const done = progressMap.get(lesson.id) ?? false;
                const canAccess = enrollment || lesson.is_preview;
                return (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          done ? "bg-emerald-600 text-white" : "border border-neutral-700 text-neutral-500"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="text-sm text-neutral-200">{lesson.title}</span>
                      {lesson.is_preview && !enrollment && (
                        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                          Prévia
                        </span>
                      )}
                    </div>
                    {canAccess ? (
                      <Link
                        href={`/academy/cursos/${course.slug}/aulas/${lesson.slug}`}
                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Assistir →
                      </Link>
                    ) : (
                      <span className="text-sm text-neutral-600">
                        {isPaidCourse ? "Compre o curso para assistir" : "Matricule-se para assistir"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
