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
  /** Opções da variante (ex.: { Cor: "#000000", Tamanho: "M" }). Variantes antigas recebem-nas a partir de cor/tamanho. */
  options?: Record<string, string>;
  sku?: string | null;
  /** Preço próprio da variante; vazio = herda o do produto. */
  priceMzn?: string | null;
  /** Preço que o servidor cobra por esta variante (o da variante, ou o do produto). */
  effectivePriceMzn?: string;
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
  /** Menor preço entre as variantes ativas (ou o do produto). */
  priceFromMzn?: string;
  /** Opções que o cliente pode escolher, deduzidas das variantes reais. */
  optionDefs?: OptionDef[];
  /** Características técnicas (só as públicas na loja). */
  attributes?: ProductAttributeView[];
  /** Custos e margens: só vêm nas respostas do admin. Sem isto o produto tem preço antigo, sem custos. */
  pricing?: ProductPricing | null;
}

// Calculadora de preço (só admin): o preço é calculado a partir daqui no servidor. Decimais chegam como texto.
export interface ProductPricing { purchaseMzn: string; taxPct: string; transportMzn: string; otherCostsMzn: string; returnPct: string; commissionPct: string; discountPct: string }
export interface PricingInput { purchaseMzn: number; taxPct: number; transportMzn: number; otherCostsMzn: number; returnPct: number; commissionPct: number; discountPct: number }
export interface PricingThresholds { goodFromPct: number; excellentFromPct: number }

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

export interface ForgotPasswordResult {
  ok: true;
  cooldownSeconds?: number;
  expiresMinutes?: number;
}

export interface ResetCheckResult {
  valid: true;
  email: string;
  expiresAt: string;
  serverNow?: string;
}

export interface ResetPasswordResult {
  ok: true;
  user: AuthUser;
  accessToken: string | null;
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
  /** Texto da variante no momento da compra, ex.: "Cor: #000000 · Capacidade: 256 GB". */
  variantLabel?: string | null;
  sku?: string | null;
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
  location?: string | null;
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
  payerName?: string | null;
  paidClaimedAt?: string | null;
  expiresAt?: string | null;
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
  estimatedDeliveryAt?: string | null;
  trackingCode?: string | null;
  carrier?: string | null;
  invoice?: Invoice | null;
  user?: { id: string; name: string; email: string } | null;
  /** Fim do prazo de pagamento (só enquanto aguarda pagamento) e prazo máximo de entrega (só depois de confirmado): calculados no servidor. */
  paymentDeadline?: string | null;
  deliveryDeadlineAt?: string | null;
  serverNow?: string;
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

/** Linha de GET /orders (as encomendas do próprio cliente): resumo leve; o detalhe vem de GET /orders/:id. */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalMzn: string;
  discountMzn: string;
  createdAt: string;
  invoice: { id: string; invoiceNumber: string } | null;
  items: Array<{ productName: string; quantity: number }>;
  _count: { items: number };
  /** Em que separador cai: carteira (pago e confirmado), P2P (em espera/expirada), recusada, ou nenhum (ex.: cancelada pelo cliente). */
  phase: OrderPhase;
  expired: boolean;
  paymentDeadline: string | null;
}

export type OrderPhase = "wallet" | "p2p" | "refused" | "other";
export type OrderTab = "all" | "wallet" | "p2p" | "refused";

export interface OrdersListResponse extends PaginatedResponse<OrderSummary> {
  counts: Record<OrderTab, number>;
  serverNow: string;
}

export type PaymentFailureKind = "MANUAL_EXPIRED" | "PROOF_REJECTED" | "WRONG_PIN" | "INSUFFICIENT_FUNDS" | "CANCELLED" | "TIMEOUT" | "AMOUNT_MISMATCH" | "UNAVAILABLE" | "UNKNOWN";
export type PaymentMethodId = "MPESA" | "EMOLA" | "CARD";

/** Estado do pagamento visto pelo ecrã de pagamento (GET /payments/:id/status). `success` só existe depois de o ZumboPay confirmar. */
export interface PaymentView {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  /** Nota da loja ao rejeitar um comprovativo. */
  note: string | null;
  payerName: string | null;
  claimedAt: string | null;
  /** Pagamento manual: até quando ainda se pode carregar em "Já paguei", mesmo depois de o prazo acabar. */
  claimUntil: string | null;
  method: string | null;
  amountMzn: string;
  paymentNumber: string | null;
  state: "pending" | "success" | "failed";
  status: PaymentStatus;
  failureKind: PaymentFailureKind | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  invoiceId: string | null;
  checkoutUrl?: string;
}

export interface InvoiceSettings {
  companyName: string;
  legalName: string | null;
  nuit: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  signerName: string | null;
  signerRole: string | null;
  accentColor: string;
  numberPrefix: string;
  nextNumber: number;
  footerNote: string | null;
  terms: string | null;
  bankDetails: string | null;
  vatRatePercent: number | string;
  showSignature: boolean;
}

export type PaymentChoice = PaymentMethodId;
export type OnlineStatus = "ok" | "degraded" | "disabled";

export interface ManualDetails {
  enabled: boolean;
  mpesa: { number: string; name: string | null } | null;
  emola: { number: string; name: string | null } | null;
  bank: { name: string | null; nib: string; holder: string | null } | null;
  instructions: string | null;
}

export interface PaymentMethodsInfo {
  methods: PaymentMethodId[];
  onlineStatus: OnlineStatus;
  manual: ManualDetails;
  manualWindowSeconds: number;
  sandbox: boolean;
  confirmWindowSeconds: number;
}

export interface PaymentSettings {
  onlineEnabled: boolean;
  manualEnabled: boolean;
  mpesaNumber: string | null;
  mpesaName: string | null;
  emolaNumber: string | null;
  emolaName: string | null;
  bankName: string | null;
  bankNib: string | null;
  bankHolder: string | null;
  instructions: string | null;
  onlineStatus: OnlineStatus;
  zpFailures: number;
  zpDegradedUntil: string | null;
}

export interface PendingReviewPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  method: string | null;
  amountMzn: string;
  payerName: string | null;
  paymentNumber: string | null;
  transactionCode: string | null;
  proofUrl: string | null;
  reference: string;
  claimedAt: string;
}

export interface ProductAttributeView {
  id: string;
  key: string;
  name: string;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MEASURE";
  unit: string | null;
  options: unknown;
  required: boolean;
  showPublic: boolean;
  filterable: boolean;
  value: string | number | boolean | null;
}

export interface OptionDef { name: string; kind: "COLOR" | "TEXT"; values: string[] }

export type AttributeType = "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MEASURE";

/** Característica técnica definida pelo admin para uma categoria (ex.: RAM, Material). */
export interface CategoryAttribute {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: AttributeType;
  required: boolean;
  showPublic: boolean;
  filterable: boolean;
  unit: string | null;
  options: string[];
  sortOrder: number;
}

export interface CategoryAttributePayload {
  name: string;
  type: AttributeType;
  required: boolean;
  showPublic: boolean;
  filterable: boolean;
  unit?: string | null;
  options?: string[];
  sortOrder: number;
}

export interface VariantPayload {
  options?: Record<string, string>;
  colorHex?: string;
  size?: string;
  sku?: string | null;
  /** Vazio/null = herda o preço do produto. */
  priceMzn?: number | null;
  stock: number;
  active?: boolean;
}

export interface ProductWritePayload {
  name: string;
  description: string | null;
  /** Só para produtos sem custos (preço antigo). Com `pricing` o servidor calcula o preço e ignora este valor. */
  priceMzn?: number;
  pricing?: PricingInput;
  stock: number;
  categoryId: string | null;
  active: boolean;
  variants?: VariantPayload[];
  attributes?: Array<{ attributeId: string; value: string | number | boolean | null }>;
}

// ── Painel admin: o que precisa de atenção e o histórico ───────────────────────────────────────────────────────────
export interface AttentionOrder { id: string; orderNumber: string; customer: string; totalMzn: string; since: string }
export interface AttentionToPrepare extends AttentionOrder {
  items: Array<{ name: string; quantity: number }>;
  itemCount: number;
  method: string | null;
  payerName: string | null;
  payerNumber: string | null;
}
export interface AdminAttention {
  counts: { paymentsToConfirm: number; toPrepare: number; cancelRequests: number; refunds: number; chats: number; lowStock: number; total: number };
  toPrepare: AttentionToPrepare[];
  cancelRequests: AttentionOrder[];
  refunds: AttentionOrder[];
  chats: Array<{ id: string; customer: string; since: string; preview: string | null }>;
  lowStock: Array<{ id: string; name: string; stock: number }>;
}
export interface AdminHistoryItem { id: string; at: string; status: OrderStatus; note: string | null; orderId: string; orderNumber: string; totalMzn: string; customer: string }
export type OrderBucket = "action" | "ongoing" | "done";
