import type {
  CloudinarySignature,
  AuthResponse, Category, Order, PaginatedResponse, Product, AppNotification, Me, AdminUser,
  Payment, Invoice, ReferralInfo, Conversation, ChatMessage, ChatMenuOption, AdminStats, OrderSummary,
  PaymentView, InvoiceSettings, PaymentMethodsInfo, PaymentSettings, PendingReviewPayment
} from "./types";

// Em desenvolvimento local cai para localhost:3000; em produção TEM de vir de
// VITE_API_URL (definida na Vercel), apontando para o backend no Render/Railway/Fly.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;
  /** Corpo completo do erro (ex.: { error: "PAYMENT_ALREADY_ACTIVE", paymentId }). */
  data: Record<string, unknown>;
  constructor(status: number, code: string, data: Record<string, unknown> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  isForm?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.isForm) {
      body = options.body as FormData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    cache: "no-store"
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
  const code = (data as { error?: string }).error;
  // Token inválido, ou conta suspensa/bloqueada: a sessão guardada já não vale.
  if (options.token && (res.status === 401 || (res.status === 403 && code === "ACCOUNT_RESTRICTED"))) {
    window.dispatchEvent(new Event("twisisa:unauthorized"));
  }
  throw new ApiError(res.status, code ?? "UNKNOWN_ERROR", data as Record<string, unknown>);
}
  return data as T;
}

// Ficheiros binários (PDF da factura) não passam pelo request() genérico — precisam do
// blob em bruto, não de JSON, mas continuam a exigir o cabeçalho Authorization.
async function downloadFile(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiError(res.status, "DOWNLOAD_FAILED");
  return res.blob();
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return `?${entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")}`;
}

export type InitiatePaymentPayload =
  | { provider: "MANUAL"; method: "MPESA"; paymentNumber: string }
  | { provider: "MANUAL"; method: "EMOLA"; paymentNumber: string }
  | { provider: "MANUAL"; method: "CARD" }
  | { provider: "ZUMBOPAY"; method: "MPESA" | "EMOLA"; paymentNumber: string }
  | { provider: "ZUMBOPAY"; method: "CARD" }
  | { provider: "MANUAL"; method: "MPESA" | "EMOLA"; paymentNumber: string; payerName: string };

export const api = {
  products: {
    list: (params: { search?: string; categoryId?: string; page?: number; limit?: number } = {}) =>
      request<PaginatedResponse<Product>>(`/products${qs(params)}`),
    get: (id: string) => request<Product>(`/products/${id}`)
  },
  categories: {
    list: () => request<Category[]>("/categories")
  },
  auth: {
    login: (payload: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: payload }),
    register: (payload: { name: string; email: string; phone?: string; password: string; referralCode?: string }) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: payload }),
    me: (token: string) => request<AuthResponse["user"]>("/auth/me", { token })
  },
  users: {
    me: (token: string) => request<Me>("/users/me", { token }),
    updateMe: (token: string, payload: { name?: string; phone?: string | null; avatarUrl?: string | null }) =>
      request<{ id: string; name: string; email: string; phone: string | null; avatarUrl?: string | null }>("/users/me", { method: "PATCH", body: payload, token })
  },
  uploads: {
    // Pede uma assinatura de curta duração para enviar UMA imagem ao Cloudinary (ver lib/avatar.ts).
    sign: (token: string, folder: "avatars" | "site") =>
      request<CloudinarySignature>("/uploads/sign", { method: "POST", body: { folder }, token })
  },
  orders: {
    create: (items: Array<{ productId: string; variantId?: string; quantity: number }>, token: string) =>
      request<Order>("/orders", { method: "POST", body: { items }, token }),
    list: (token: string, params: { page?: number; limit?: number; invoiced?: boolean } = {}) =>
      request<PaginatedResponse<OrderSummary>>(`/orders${qs(params)}`, { token }),
    get: (id: string, token: string) => request<Order>(`/orders/${id}`, { token }),
    cancel: (id: string, reason: string, token: string) =>
      request<Order>(`/orders/${id}/cancel`, { method: "POST", body: { reason }, token })
  },
  payments: {
    // Métodos online realmente disponíveis (carteira configurada) + se o servidor está em modo de teste.
    methods: () => request<PaymentMethodsInfo>("/payments/methods"),
    initiate: (orderId: string, payload: InitiatePaymentPayload, token: string) =>
      request<PaymentView>(`/orders/${orderId}/payments/initiate`, { method: "POST", body: payload, token }),
    // Pergunta o estado real (o servidor confirma com o ZumboPay). É o que o ecrã de espera consulta de 3 em 3 segundos.
    status: (id: string, token: string) => request<PaymentView>(`/payments/${id}/status`, { token }),
    cancel: (id: string, token: string) => request<PaymentView>(`/payments/${id}/cancel`, { method: "POST", token }),
    // Pagamento manual: "Já paguei". A partir daqui o pedido aparece ao admin. O código da mensagem é opcional.
    claim: (id: string, payload: { transactionCode?: string }, token: string) =>
      request<PaymentView>(`/payments/${id}/claim`, { method: "POST", body: payload, token }),
    get: (id: string, token: string) => request<Payment>(`/payments/${id}`, { token }),
    submitProof: (id: string, proofUrl: string, token: string) =>
      request<Payment>(`/payments/${id}/proof`, { method: "POST", body: { proofUrl }, token })
  },
  invoices: {
    get: (id: string, token: string) => request<Invoice>(`/invoices/${id}`, { token }),
    downloadPdf: (id: string, token: string) => downloadFile(`/invoices/${id}/pdf`, token)
  },
  referrals: {
    me: (token: string) => request<ReferralInfo>("/referrals/me", { token }),
    // Público: devolve só o primeiro nome de quem convidou (404 se o código não existir).
    lookup: (code: string) => request<{ valid: boolean; inviterFirstName: string }>(`/referrals/lookup/${encodeURIComponent(code)}`)
  },
  reviews: {
    list: (productId: string) => request<{ data: Array<{ id: string; rating: number; comment: string | null; createdAt: string; userName: string }>; summary: { average: number; count: number } }>(`/products/${productId}/reviews`),
    create: (productId: string, token: string, payload: { rating: number; comment?: string }) => request(`/products/${productId}/reviews`, { method: "POST", body: payload, token })
  },
  notifications: {
    list: (token: string, page = 1) =>
      request<PaginatedResponse<AppNotification>>(`/notifications${qs({ page })}`, { token }),
    markRead: (id: string, token: string) =>
      request<AppNotification>(`/notifications/${id}/read`, { method: "POST", token }),
    remove: (id: string, token: string) => request<void>(`/notifications/${id}`, { method: "DELETE", token }),
    removeAll: (token: string) => request<void>("/notifications", { method: "DELETE", token })
  },
  chat: {
    open: (token: string) =>
      request<{ conversation: Conversation; messages: ChatMessage[]; menu: ChatMenuOption[] }>("/chat/conversations", { method: "POST", token }),
    listConversations: (token: string) => request<{ data: Conversation[] }>("/chat/conversations", { token }),
    getMessages: (id: string, token: string) =>
      request<{ conversation: Conversation; messages: ChatMessage[] }>(`/chat/conversations/${id}/messages`, { token }),
    sendMessage: (id: string, token: string, content?: string, file?: File) => {
      if (file) {
        const form = new FormData();
        if (content) form.append("content", content);
        form.append("file", file);
        return request<{ message: ChatMessage; botMessage?: ChatMessage }>(`/chat/conversations/${id}/messages`, { method: "POST", body: form, token, isForm: true });
      }
      return request<{ message: ChatMessage; botMessage?: ChatMessage }>(`/chat/conversations/${id}/messages`, { method: "POST", body: { content }, token });
    }
  },
  media: {
    // POST multipart com um campo "file"; devolve { url, publicId } prontos para
    // admin.products.addImage / pagamentos (comprovativo) / chat (anexos).
    upload: (file: File, token: string) => {
      const form = new FormData();
      form.append("file", file);
      return request<{ url: string; publicId: string }>("/media/image", { method: "POST", body: form, token, isForm: true });
    }
  },
  admin: {
    stats: (token: string, days: 7 | 14 | 30 | 90) => request<AdminStats>(`/admin/stats?days=${days}`, { token }),
    products: {
      list: (token: string, params: { page?: number; limit?: number; includeInactive?: boolean; search?: string } = {}) =>
        request<PaginatedResponse<Product>>(`/admin/products${qs(params)}`, { token }),
      create: (token: string, payload: { name: string; description?: string; priceMzn: number; stock: number; categoryId?: string; active: boolean; variants?: Array<{ colorHex?: string; size?: string; stock: number; active?: boolean }> }) =>
        request<Product>("/admin/products", { method: "POST", body: payload, token }),
      update: (token: string, id: string, payload: Partial<{ name: string; description: string | null; priceMzn: number; stock: number; categoryId: string | null; active: boolean; variants: Array<{ colorHex?: string; size?: string; stock: number; active?: boolean }> }>) =>
        request<Product>(`/admin/products/${id}`, { method: "PATCH", body: payload, token }),
      adjustStock: (token: string, id: string, delta: number) =>
        request<Product>(`/admin/products/${id}/stock`, { method: "POST", body: { delta }, token }),
      addImage: (token: string, id: string, payload: { url: string; publicId?: string; altText?: string; isPrimary?: boolean }) =>
        request<Product["images"][number]>(`/admin/products/${id}/images`, { method: "POST", body: payload, token }),
      removeImage: (token: string, id: string, imageId: string) =>
        request<void>(`/admin/products/${id}/images/${imageId}`, { method: "DELETE", token }),
      remove: (token: string, id: string) => request<void>(`/admin/products/${id}`, { method: "DELETE", token }),
      bulkCreate: (token: string, products: Array<{ name: string; description?: string; priceMzn: number; stock: number; categoryId?: string; active: boolean; variants?: Array<{ colorHex?: string; size?: string; stock: number; active?: boolean }> }>) =>
        request<{ created: number; failed: Array<{ row: number; error: string }> }>(`/admin/products/bulk`, { method: "POST", body: { products }, token })
    },
    categories: {
      create: (token: string, name: string) =>
        request<Category>("/admin/categories", { method: "POST", body: { name }, token }),
      update: (token: string, id: string, name: string) =>
        request<Category>(`/admin/categories/${id}`, { method: "PATCH", body: { name }, token }),
      remove: (token: string, id: string) =>
        request<void>(`/admin/categories/${id}`, { method: "DELETE", token })
    },
    orders: {
      list: (token: string, params: { status?: string; page?: number; limit?: number } = {}) =>
        request<PaginatedResponse<Order>>(`/admin/orders${qs(params)}`, { token }),
      updateStatus: (token: string, id: string, status: string, reason?: string) =>
        request<Order>(`/admin/orders/${id}/status`, { method: "POST", body: { status, reason }, token }),
      addTracking: (token: string, id: string, payload: { note?: string; location?: string; estimatedDeliveryAt?: string; trackingCode?: string; carrier?: string }) =>
        request<Order>(`/admin/orders/${id}/tracking`, { method: "POST", body: payload, token })
    },
    paymentSettings: {
      get: (token: string) => request<PaymentSettings>("/admin/payment-settings", { token }),
      update: (token: string, payload: Omit<PaymentSettings, "onlineStatus" | "zpFailures" | "zpDegradedUntil">) =>
        request<PaymentSettings>("/admin/payment-settings", { method: "PUT", body: payload, token }),
      resetBreaker: (token: string) => request<PaymentSettings>("/admin/payment-settings/reset-degraded", { method: "POST", token })
    },
    invoiceSettings: {
      get: (token: string) => request<InvoiceSettings>("/admin/invoice-settings", { token }),
      update: (token: string, payload: Omit<InvoiceSettings, "nextNumber" | "vatRatePercent"> & { vatRatePercent: number }) =>
        request<InvoiceSettings>("/admin/invoice-settings", { method: "PUT", body: payload, token }),
      previewPdf: (token: string) => downloadFile("/admin/invoice-settings/preview", token)
    },
    payments: {
      pendingReview: (token: string) => request<PendingReviewPayment[]>("/admin/payments/pending-review", { token }),
      review: (token: string, id: string, approved: boolean, note?: string) =>
        request<Payment>(`/admin/payments/${id}/review`, { method: "POST", body: { approved, note }, token })
    },
    users: {
      list: (token: string, params: { search?: string; status?: string; page?: number; limit?: number } = {}) =>
        request<PaginatedResponse<AdminUser>>(`/admin/users${qs(params)}`, { token }),
      setStatus: (token: string, id: string, status: "ACTIVE" | "SUSPENDED" | "BLOCKED") =>
        request<{ id: string; status: string }>(`/admin/users/${id}/status`, { method: "PATCH", body: { status }, token })
    },
    chat: {
      list: (token: string, params: { status?: string; page?: number; limit?: number } = {}) =>
        request<PaginatedResponse<Conversation>>(`/admin/chat/conversations${qs(params)}`, { token }),
      reply: (token: string, id: string, content?: string, file?: File) => {
        if (file) {
          const form = new FormData();
          if (content) form.append("content", content);
          form.append("file", file);
          return request<{ message: ChatMessage }>(`/admin/chat/conversations/${id}/reply`, { method: "POST", body: form, token, isForm: true });
        }
        return request<{ message: ChatMessage }>(`/admin/chat/conversations/${id}/reply`, { method: "POST", body: { content }, token });
      },
      close: (token: string, id: string) => request<Conversation>(`/admin/chat/conversations/${id}/close`, { method: "POST", token }),
      messages: (id: string, token: string) =>
        request<{ conversation: Conversation; messages: ChatMessage[] }>(`/chat/conversations/${id}/messages`, { token })
    }
  }
};
