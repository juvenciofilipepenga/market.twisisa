import type {
  CloudinarySignature,
  AuthResponse, Category, Order, PaginatedResponse, Product, AppNotification, Me, AdminUser,
  Payment, Invoice, ReferralInfo, Conversation, ChatMessage, ChatMenuOption
} from "./types";

// Em desenvolvimento local cai para localhost:3000; em produção TEM de vir de
// VITE_API_URL (definida na Vercel), apontando para o backend no Render/Railway/Fly.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
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
  if (res.status === 401 && options.token) {
    window.dispatchEvent(new Event("twisisa:unauthorized"));
  }
  throw new ApiError(res.status, (data as { error?: string }).error ?? "UNKNOWN_ERROR");
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
  | { provider: "ZUMBOPAY"; method: string };

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
    create: (items: Array<{ productId: string; quantity: number }>, token: string) =>
      request<Order>("/orders", { method: "POST", body: { items }, token }),
    get: (id: string, token: string) => request<Order>(`/orders/${id}`, { token }),
    cancel: (id: string, reason: string, token: string) =>
      request<Order>(`/orders/${id}/cancel`, { method: "POST", body: { reason }, token })
  },
  payments: {
    initiate: (orderId: string, payload: InitiatePaymentPayload, token: string) =>
      request<{ paymentId: string; reference: string; status: string; amountMzn: string; paymentNumber: string | null; checkoutUrl?: string }>(
        `/orders/${orderId}/payments/initiate`, { method: "POST", body: payload, token }
      ),
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
  notifications: {
    list: (token: string, page = 1) =>
      request<PaginatedResponse<AppNotification>>(`/notifications${qs({ page })}`, { token }),
    markRead: (id: string, token: string) =>
      request<AppNotification>(`/notifications/${id}/read`, { method: "POST", token })
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
    products: {
      list: (token: string, params: { page?: number; limit?: number; includeInactive?: boolean } = {}) =>
        request<PaginatedResponse<Product>>(`/admin/products${qs(params)}`, { token }),
      create: (token: string, payload: { name: string; description?: string; priceMzn: number; stock: number; categoryId?: string; active: boolean }) =>
        request<Product>("/admin/products", { method: "POST", body: payload, token }),
      update: (token: string, id: string, payload: Partial<{ name: string; description: string; priceMzn: number; stock: number; categoryId: string; active: boolean }>) =>
        request<Product>(`/admin/products/${id}`, { method: "PATCH", body: payload, token }),
      adjustStock: (token: string, id: string, delta: number) =>
        request<Product>(`/admin/products/${id}/stock`, { method: "POST", body: { delta }, token }),
      addImage: (token: string, id: string, payload: { url: string; publicId?: string; altText?: string; isPrimary?: boolean }) =>
        request<Product["images"][number]>(`/admin/products/${id}/images`, { method: "POST", body: payload, token }),
      removeImage: (token: string, id: string, imageId: string) =>
        request<void>(`/admin/products/${id}/images/${imageId}`, { method: "DELETE", token })
    },
    categories: {
      create: (token: string, name: string) =>
        request<Category>("/admin/categories", { method: "POST", body: { name }, token })
    },
    orders: {
      list: (token: string, params: { status?: string; page?: number; limit?: number } = {}) =>
        request<PaginatedResponse<Order>>(`/admin/orders${qs(params)}`, { token }),
      updateStatus: (token: string, id: string, status: string, reason?: string) =>
        request<Order>(`/admin/orders/${id}/status`, { method: "POST", body: { status, reason }, token })
    },
    payments: {
      review: (token: string, id: string, approved: boolean, note?: string) =>
        request<Payment>(`/admin/payments/${id}/review`, { method: "POST", body: { approved, note }, token })
    },
    users: {
      list: (token: string, params: { search?: string; status?: string; page?: number; limit?: number } = {}) =>
        request<PaginatedResponse<AdminUser>>(`/admin/users${qs(params)}`, { token })
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
