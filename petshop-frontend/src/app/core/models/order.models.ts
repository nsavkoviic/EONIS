export enum OrderStatus {
  Pending = 0,
  Processing = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4,
  Refunded = 5
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress?: string | null;
  stripePaymentIntentId?: string | null;
  items: OrderItem[];
}

export interface OrderSummary {
  id: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
}

export interface CreateOrderRequest {
  shippingAddress: string;
}

export interface UpdateStatusRequest {
  status: OrderStatus;
}
