const resolveApiBaseUrl = (): string => {
  const rawBase =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:7261" : window.location.origin);

  const withoutTrailingSlash = rawBase.replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api$/i, "");
};

const API_BASE_URL = resolveApiBaseUrl();

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(() => ({ error: "Network error" }));

      const errorMessage =
        typeof errorPayload?.error === "string"
          ? errorPayload.error
          : typeof errorPayload?.error?.message === "string"
            ? errorPayload.error.message
            : typeof errorPayload?.message === "string"
              ? errorPayload.message
              : `HTTP ${response.status}`;

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "USER" | "REVIEWER" | "MANAGER" | "ADMIN";
  }) {
    return this.request<{ user: any; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ user: any; token: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    this.setToken(response.token);
    return response;
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>("/api/auth/me");
  }

  // Document endpoints
  async uploadDocument(file: File, documentType: "INVOICE" | "CREDIT_NOTE") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDocuments() {
    return this.request<{ documents: any[] }>("/api/documents");
  }

  async getDocument(id: string) {
    return this.request<{ document: any }>(`/api/documents/${id}`);
  }

  // Approval endpoints
  async getPendingApprovals() {
    return this.request<{ approvals: any[] }>("/api/approvals/pending");
  }

  async approveDocument(documentId: string, stage: number, comment?: string) {
    return this.request(`/api/approvals/${documentId}/approve/${stage}`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  }

  async rejectDocument(documentId: string, stage: number, comment: string) {
    return this.request(`/api/approvals/${documentId}/reject/${stage}`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  }

  // Report endpoints
  async getSpendSummary(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append("startDate", filters.dateRange.startDate);
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters?.vendors) {
      filters.vendors.forEach((v: string) => params.append("vendors", v));
    }
    if (filters?.approvalStatus) {
      filters.approvalStatus.forEach((s: string) =>
        params.append("approvalStatus", s),
      );
    }
    if (filters?.amountRange) {
      params.append("minAmount", filters.amountRange.min.toString());
      params.append("maxAmount", filters.amountRange.max.toString());
    }

    return this.request<{ report: any }>(
      `/api/reports/spend-summary?${params}`,
    );
  }

  async getVendorAnalysis(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append("startDate", filters.dateRange.startDate);
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters?.vendors) {
      filters.vendors.forEach((v: string) => params.append("vendors", v));
    }
    if (filters?.approvalStatus) {
      filters.approvalStatus.forEach((s: string) =>
        params.append("approvalStatus", s),
      );
    }
    if (filters?.amountRange) {
      params.append("minAmount", filters.amountRange.min.toString());
      params.append("maxAmount", filters.amountRange.max.toString());
    }

    return this.request<{ report: any }>(
      `/api/reports/vendor-analysis?${params}`,
    );
  }

  async getTaxReport(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.dateRange) {
      params.append("startDate", filters.dateRange.startDate);
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters?.vendors) {
      filters.vendors.forEach((v: string) => params.append("vendors", v));
    }
    if (filters?.approvalStatus) {
      filters.approvalStatus.forEach((s: string) =>
        params.append("approvalStatus", s),
      );
    }
    if (filters?.amountRange) {
      params.append("minAmount", filters.amountRange.min.toString());
      params.append("maxAmount", filters.amountRange.max.toString());
    }

    return this.request<{ report: any }>(`/api/reports/tax-vat?${params}`);
  }

  async getAIInsights() {
    return this.request<{ insights: any }>("/api/reports/insights");
  }
}

export const apiClient = new ApiClient();
