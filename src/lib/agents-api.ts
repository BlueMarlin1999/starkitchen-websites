import type { ChatResponse } from '@/components/AgentLegion/types';
import { isDemoFeatureEnabled } from '@/lib/live-mode';
import { useAuthStore } from '@/store/auth';

const AGENTS_PROXY_BASE = '/api/agents/v1';
const AGENTS_HEALTH_ENDPOINT = '/api/agents/healthz';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HttpMethod = 'GET' | 'POST' | 'PATCH';

export class AgentsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'AgentsAPIError';
  }
}

type ConfidencePayload = {
  score: number;
  tier: string;
  label_zh: string;
  requires_human_review: boolean;
  must_pause: boolean;
};

type MetadataPayload = {
  agent_id?: string;
  session_id?: string;
  decision_level?: number;
  requires_human_review?: boolean;
};

export interface SendMessageOptions {
  message: string;
  sessionId?: string;
  highStakes?: boolean;
  targetAgentId?: string;
}

export interface StreamCallbacks {
  onMetadata?: (data: MetadataPayload) => void;
  onToken?: (content: string) => void;
  onConfidence?: (data: ConfidencePayload) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  source_agent_id: string;
  assigned_to: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'critical' | 'high' | 'normal' | 'low';
  decision_level: number;
  due_date: string | null;
  created_at: string;
}

export interface ChatSessionSummary {
  session_id: string;
  updated_at: string;
  latest_agent_id: string;
  latest_preview: string;
  message_count: number;
}

export interface FileUploadHistoryItem {
  id: string;
  session_id: string;
  actor_id: string;
  actor_role: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: string;
  reason: string | null;
  created_at: string;
}

const buildApiUrl = (path: string) => `${AGENTS_PROXY_BASE}${path}`;

const readLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(key);
};

const parseJsonBody = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const normalizeToken = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  return token ? token : null;
};

const getPersistedTokenFromAuthStorage = (): string | null => {
  const raw = readLocalStorageItem('auth-storage');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { token?: unknown } } | null;
    return normalizeToken(parsed?.state?.token);
  } catch {
    return null;
  }
};

export function getAuthBearerToken(): string | null {
  if (typeof window === 'undefined') return null;
  const storeToken = normalizeToken(useAuthStore.getState().token);
  if (storeToken) return storeToken;
  const persistedToken = getPersistedTokenFromAuthStorage();
  if (persistedToken) return persistedToken;
  return normalizeToken(readLocalStorageItem('sk_access_token'));
}

const buildAuthHeaders = (includeJsonContentType = true): HeadersInit => {
  const token = getAuthBearerToken();
  const headers: Record<string, string> = includeJsonContentType
    ? { 'Content-Type': 'application/json' }
    : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const buildRequiredAuthHeaders = (): HeadersInit => {
  const token = getAuthBearerToken();
  if (!token) throw new AgentsAPIError('未登录或会话已过期', 401, 'UNAUTHORIZED');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const buildQueryString = (
  fields: Array<{ key: string; value: string | number | null | undefined }>
): string => {
  const params = new URLSearchParams();
  for (const field of fields) {
    if (field.value === null || field.value === undefined || field.value === '') continue;
    params.set(field.key, String(field.value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
};

const handleResponseError = async (response: Response, fallbackMessage: string): Promise<never> => {
  const body = await parseJsonBody<{ detail?: string; code?: string }>(response);
  throw new AgentsAPIError(
    body?.detail || fallbackMessage || `请求失败 (${response.status})`,
    response.status,
    body?.code,
  );
};

const requestJson = async <T>(
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>,
  options?: { requireAuth?: boolean }
): Promise<T> => {
  const requireAuth = options?.requireAuth ?? true;
  const headers = requireAuth ? buildRequiredAuthHeaders() : buildAuthHeaders(true);
  const response = await fetch(buildApiUrl(path), {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    await handleResponseError(response, `请求失败 (${response.status})`);
  }
  return (await response.json()) as T;
};

const dispatchSseEvent = (eventType: string, payload: unknown, callbacks: StreamCallbacks) => {
  if (eventType === 'metadata') callbacks.onMetadata?.(payload as MetadataPayload);
  if (eventType === 'token') callbacks.onToken?.((payload as { content?: string }).content || '');
  if (eventType === 'confidence') callbacks.onConfidence?.(payload as ConfidencePayload);
  if (eventType === 'done') callbacks.onDone?.();
  if (eventType === 'error') {
    const message = (payload as { message?: string })?.message || '流式响应异常';
    callbacks.onError?.(message);
  }
};

const readSseResponse = async (response: Response, callbacks: StreamCallbacks) => {
  if (!response.body) {
    callbacks.onError?.('流式响应为空');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('event: ')) currentEvent = line.slice(7).trim();
      if (!line.startsWith('data: ')) continue;
      try {
        dispatchSseEvent(currentEvent, JSON.parse(line.slice(6)), callbacks);
      } catch {
        callbacks.onError?.('解析流式响应失败');
      }
    }
  }
};

const unwrapItems = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const maybeItems = (payload as { items?: unknown })?.items;
  return Array.isArray(maybeItems) ? (maybeItems as T[]) : [];
};

const ensureValidSessionId = (sessionId: string) => {
  if (UUID_PATTERN.test(sessionId)) return;
  throw new AgentsAPIError('会话ID格式不合法', 400, 'INVALID_SESSION_ID');
};

const parseHealthPayload = (payload: unknown): { status: string; version: string } => {
  const health = payload as { status?: unknown; version?: unknown } | null;
  if (typeof health?.status === 'string' && typeof health?.version === 'string') {
    return {
      status: health.status,
      version: health.version,
    };
  }
  return { status: 'unknown', version: 'unknown' };
};

export async function sendMessage(opts: SendMessageOptions): Promise<ChatResponse> {
  return requestJson<ChatResponse>('/chat/', 'POST', {
    message: opts.message,
    session_id: opts.sessionId ?? null,
    high_stakes: opts.highStakes ?? false,
    target_agent_id: opts.targetAgentId ?? null,
  });
}

export async function sendMessageStream(
  opts: Omit<SendMessageOptions, 'onStream'>,
  callbacks: StreamCallbacks,
): Promise<void> {
  let headers: HeadersInit;
  try {
    headers = buildRequiredAuthHeaders();
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error.message : '未登录或会话已过期');
    return;
  }

  const response = await fetch(buildApiUrl('/chat/stream/'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: opts.message,
      session_id: opts.sessionId ?? null,
      high_stakes: opts.highStakes ?? false,
      target_agent_id: opts.targetAgentId ?? null,
    }),
  });

  if (!response.ok) {
    callbacks.onError?.(`请求失败 (${response.status})`);
    return;
  }
  await readSseResponse(response, callbacks);
}

export async function sendDemoMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  if (!isDemoFeatureEnabled()) {
    throw new AgentsAPIError('演示模式已禁用，请接入真实模型后使用。', 410, 'DEMO_MODE_DISABLED');
  }
  return requestJson<ChatResponse>('/demo/chat/', 'POST', {
    message,
    session_id: sessionId ?? null,
  }, { requireAuth: false });
}

export async function sendImageMessage(
  image: File,
  message: string = '请分析这张图片',
  sessionId?: string,
): Promise<ChatResponse> {
  const token = getAuthBearerToken();
  if (!token) throw new AgentsAPIError('未登录或会话已过期', 401, 'UNAUTHORIZED');
  const formData = new FormData();
  formData.append('image', image);
  formData.append('message', message);
  if (sessionId) formData.append('session_id', sessionId);
  const response = await fetch(buildApiUrl('/chat/vision/'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    await handleResponseError(response, '图片分析失败');
  }
  return (await response.json()) as ChatResponse;
}

export async function submitFeedback(opts: {
  sessionId: string;
  agentId: string;
  rating: number;
  comment?: string;
  feedbackType?: string;
  confidenceScore?: number;
  decisionLevel?: number;
}): Promise<void> {
  ensureValidSessionId(opts.sessionId);
  await requestJson<{ success?: boolean }>('/feedback/', 'POST', {
    session_id: opts.sessionId,
    agent_id: opts.agentId,
    rating: opts.rating,
    comment: opts.comment ?? null,
    feedback_type: opts.feedbackType ?? 'rating',
    confidence_score: opts.confidenceScore,
    decision_level: opts.decisionLevel,
  });
}

export async function listDecisions(opts?: {
  status?: string;
  agentId?: string;
  priority?: string;
  limit?: number;
}): Promise<Decision[]> {
  const query = buildQueryString([
    { key: 'status', value: opts?.status },
    { key: 'agent_id', value: opts?.agentId },
    { key: 'priority', value: opts?.priority },
    { key: 'limit', value: opts?.limit },
  ]);
  return requestJson<Decision[]>(`/decisions/${query}`, 'GET');
}

export async function updateDecisionStatus(
  id: string,
  status: 'in_progress' | 'completed' | 'cancelled',
): Promise<void> {
  await requestJson<{ success?: boolean }>(`/decisions/${id}/`, 'PATCH', { status });
}

export async function listChatSessions(limit = 30): Promise<ChatSessionSummary[]> {
  const query = buildQueryString([{ key: 'limit', value: limit }]);
  const payload = await requestJson<{ items?: ChatSessionSummary[] }>(
    `/history/sessions/${query}`,
    'GET'
  );
  return unwrapItems<ChatSessionSummary>(payload);
}

export async function listFileUploadHistory(opts?: {
  sessionId?: string;
  limit?: number;
}): Promise<FileUploadHistoryItem[]> {
  const query = buildQueryString([
    { key: 'session_id', value: opts?.sessionId },
    { key: 'limit', value: opts?.limit },
  ]);
  const payload = await requestJson<{ items?: FileUploadHistoryItem[] }>(
    `/history/files/${query}`,
    'GET'
  );
  return unwrapItems<FileUploadHistoryItem>(payload);
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(AGENTS_HEALTH_ENDPOINT, { method: 'GET' });
  if (!response.ok) return { status: 'unknown', version: 'unknown' };
  const payload = await parseJsonBody(response);
  return parseHealthPayload(payload);
}
