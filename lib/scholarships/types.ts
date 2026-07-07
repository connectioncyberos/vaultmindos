export type ScholarshipSource = "COUPON" | "ADMIN_DIRECT";

export interface ScholarshipCoupon {
  id: string;
  code: string;
  course_id: string | null;
  discount_percent: number;
  max_redemptions: number | null;
  redemption_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ScholarshipGrant {
  id: string;
  user_id: string;
  course_id: string;
  discount_percent: number;
  source: ScholarshipSource;
  coupon_id: string | null;
  granted_by: string | null;
  payment_id: string | null;
  created_at: string;
}

/** Cupom + título do curso vinculado (ou "Qualquer curso") — painel admin. */
export interface CouponForAdmin extends ScholarshipCoupon {
  courseTitle: string;
}

/** Bolsa + nomes legíveis — painel admin. */
export interface GrantForAdmin extends ScholarshipGrant {
  studentName: string;
  courseTitle: string;
}
