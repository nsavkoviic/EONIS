export enum PaymentStatus {
  Pending = 0,
  Succeeded = 1,
  Failed = 2
}

export interface CreateCheckoutSessionRequest {
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  stripePaymentIntentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}
