// Tipos espelham o que a API do twisisa_market_api devolve (backend actualizado, agora com
// Prisma — ver prisma/schema.prisma e src/routes/*.ts). Mantidos à mão porque o backend não
// expõe um schema OpenAPI/gerado.

export type Role = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BLOCKED";

export type OrderStatus =
  | "PENDING_PAYMENT" | "PAYMENT_REVIEW" | "PAID" | "PROCESSING"
  | "READY_FOR_SHIPMENT" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED"
  | "CANCELLATION_REQUESTED" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";

export type PaymentStatus =
  | "INITIATED" | "AUTHENTICATING" | "SUCCESS" | "FAILED" | "TIMEOUT" | "PENDING_CONFIRMATION"
  | "CANCELLED" | "REFUNDED" | "PAYMENT_PENDING" | "PROOF_SUBMITTED" | "UNDER_REVIEW"
  | "PAYMENT_CONFIRMED" | "PAYMENT_REJECTED" | "REFUND_PENDING" | "REFUNDED_LEGACY";

export type NotificationType = "ORDER" | "PAYMENT" | "DELIVERY" | "SECURITY" | "MARKETING" | "SYSTEM" | "REFERRAL" | "SUPPORT";
export type ConversationStatus = "BOT" | "ESCALATED" | "CLOSED";
export type ChatSenderType = "CUSTOMER" | "BOT" | "ADMIN";

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorHex: string | null;
  size: string | null;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review { id:string; rating:number; comment:string|null; createdAt:string; userName:string; }

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMzn: string;
  stock: number;
  active: boolean;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  /** true se o código de convite enviado no registo era válido. */
  referralApplied?: boolean;
}

export interface Me {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** URL da foto de perfil (Cloudinary). Ainda depende do campo avatarUrl no backend. */
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: string;
}

/** Resposta de POST /uploads/sign: tudo o que o browser precisa para enviar UMA imagem ao Cloudinary. O segredo nunca sai do backend. */
export interface CloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  createdAt: string;
  roles: Array<{ role: { name: Role } }>;
}

export interface OrderItem {
  id: string;
  orderId: string;
  /** null quando o produto foi apagado depois da encomenda (o nome e o preço ficam guardados na linha). */
  productId: string | null;
  variantId?: string | null;
  variantColorHex?: string | null;
  variantSize?: string | null;
  productName: string;
  unitPriceMzn: string;
  quantity: number;
  subtotalMzn: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  from: OrderStatus | null;
  to: OrderStatus;
  reason: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  status: PaymentStatus;
  amountMzn: string;
  paymentNumber: string | null;
  reference: string;
  transactionCode: string | null;
  proofUrl: string | null;
  method: string | null;
  providerPaymentId: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotalMzn: string;
  shippingMzn: string;
  discountMzn: string;
  totalMzn: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  pdfUrl: string | null;
  issuedAt: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotalMzn: string;
  shippingMzn: string;
  discountMzn: string;
  totalMzn: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payments?: Payment[];
  statusHistory?: OrderStatusHistoryEntry[];
  invoice?: Invoice | null;
  user?: { id: string; name: string; email: string } | null;
}

export interface AppNotification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface ReferralInfo {
  referralCode: string;
  /** Convidados com pelo menos uma compra paga. */
  completedReferrals: number;
  /** Convidados que já criaram conta mas ainda não compraram (backend novo; opcional em versões antigas). */
  pendingReferrals?: number;
  invitedReferrals?: number;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  url: string;
  publicId: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: ChatSenderType;
  senderId: string | null;
  content: string | null;
  createdAt: string;
  attachments?: ChatAttachment[];
}

export interface Conversation {
  id: string;
  userId: string;
  status: ConversationStatus;
  assignedAdminId: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; phone: string | null };
}

export interface ChatMenuOption {
  key: string;
  label: string;
}

export interface ApiErrorBody {
  error: string;
}

/** Resposta de GET /admin/stats (ver backend/src/routes/admin-stats.ts). */
export interface AdminStats {
  generatedAt: string;
  days: 7 | 14 | 30 | 90;
  kpis: {
    revenueMzn: number; revenueDeltaPct: number | null;
    paidOrders: number; paidOrdersDeltaPct: number | null;
    averageTicketMzn: number;
    newCustomers: number; newCustomersDeltaPct: number | null;
    ordersCreated: number;
    paymentConversionPct: number | null;
  };
  revenueByDay: Array<{ date: string; revenueMzn: number; orders: number }>;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  topProducts: Array<{ name: string; units: number; revenueMzn: number }>;
  attention: { awaitingReview: number; pendingPayment: number; cancelRequests: number; refundPending: number; openChats: number; lowStock: number };
  catalog: { activeProducts: number; lowStockThreshold: number };
  recentOrders: Array<{ id: string; orderNumber: string; status: OrderStatus; totalMzn: number; createdAt: string; customer: string }>;
}
