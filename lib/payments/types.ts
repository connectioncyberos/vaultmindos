export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount_cents: number;
  status: PaymentStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Pagamento + dados pra exibição no painel financeiro (admin). */
export interface PaymentForAdmin extends Payment {
  courseTitle: string;
  courseSlug: string;
  studentName: string;
}

export interface PaymentTotals {
  /** Soma de amount_cents só dos pagamentos APPROVED. */
  revenueCents: number;
  approvedCount: number;
  /** revenueCents / approvedCount — 0 se não houver nenhuma venda aprovada. */
  averageTicketCents: number;
}
