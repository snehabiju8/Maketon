export type BillingInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type PlanStatus = 'ACTIVE' | 'INACTIVE';

export interface Plan {
  id: string;
  name: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  minimumQuantity: number;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDTO {
  name: string;
  billingInterval: BillingInterval;
  intervalCount?: number;
  minimumQuantity?: number;
  status?: PlanStatus;
}

export interface UpdatePlanDTO {
  name?: string;
  billingInterval?: BillingInterval;
  intervalCount?: number;
  minimumQuantity?: number;
  status?: PlanStatus;
}
