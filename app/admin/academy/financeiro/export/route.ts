import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPaidCourses } from "@/lib/academy/queries";
import { getPaymentsForAdmin } from "@/lib/payments/queries";

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  REJECTED: "Recusado",
  CANCELLED: "Cancelado",
};

/** Escapa um campo pra CSV: envolve em aspas e duplica aspas internas
 * sempre que o valor contém vírgula, aspas ou quebra de linha — regra
 * padrão do formato, evita quebrar colunas com título de curso/nome
 * de aluno que tenham vírgula. */
function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /admin/academy/financeiro/export?curso=<slug> — exporta os
 * pagamentos filtrados (mesma consulta do painel) como CSV. Relatório
 * básico (Prioridade 3 do cronograma pós-análise Enterprise) — sem
 * biblioteca nova, CSV é texto simples.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Só o admin pode exportar o financeiro." }, { status: 403 });
  }

  const cursoSlug = request.nextUrl.searchParams.get("curso") ?? undefined;
  const cursos = await getPaidCourses();
  const cursoFiltro = cursoSlug ? cursos.find((c) => c.slug === cursoSlug) : undefined;

  const pagamentos = await getPaymentsForAdmin(cursoFiltro?.id);

  const header = ["Curso", "Aluno", "Valor (R$)", "Status", "Data", "ID do pagamento (Mercado Pago)"];
  const lines = [header.map(csvField).join(",")];

  for (const pagamento of pagamentos) {
    lines.push(
      [
        csvField(pagamento.courseTitle),
        csvField(pagamento.studentName),
        csvField((pagamento.amount_cents / 100).toFixed(2)),
        csvField(STATUS_LABEL[pagamento.status] ?? pagamento.status),
        csvField(new Date(pagamento.created_at).toLocaleString("pt-BR")),
        csvField(pagamento.mp_payment_id ?? ""),
      ].join(","),
    );
  }

  // BOM (﻿) na frente: sem isso o Excel abre acentuação PT-BR
  // corrompida em CSV UTF-8 puro — comportamento conhecido do Excel,
  // não bug nosso.
  const csv = "﻿" + lines.join("\n");
  const filename = cursoFiltro ? `financeiro-${cursoFiltro.slug}.csv` : "financeiro-todos-os-cursos.csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
