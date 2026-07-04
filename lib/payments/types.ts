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
