'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage, AgentsAPIError } from '@/lib/agents-api';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FeedbackButtons } from './FeedbackButtons';
import { shouldEnableMessageCollapse } from './message-content';
import {
  AGENT_PROFILES,
  DECISION_LEVEL_LABELS,
  type ChatMessage,
  type ChatResponse,
} from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAgentProfile(agentId: string) {
  return AGENT_PROFILES.find(a => a.id === agentId);
}

function AgentAvatar({ agentId }: { agentId: string }) {
  const profile = getAgentProfile(agentId);
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 text-sm shrink-0">
      {profile?.emoji ?? '🤖'}
    </span>
  );
}

function HumanApprovalBanner({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  return (
    <div className="mx-4 my-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-lg shrink-0">🔐</span>
        <div className="flex-1">
          <p className="text-amber-300 text-sm font-medium">需要人工授权</p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            此操作涉及关键业务流程，需要您确认后执行。
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onConfirm}
          className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30
                     text-amber-300 text-xs font-medium transition-colors"
        >
          确认授权
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                     text-white/50 text-xs transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  '本月食材成本率怎么样？',
  '排班异常门店现在有哪些？',
  '有哪些菜品需要更新？',
  '下一步增长机会在哪里？',
  '本月有什么法务合规风险？',
];

// ── Main component ────────────────────────────────────────────────────────────
interface AgentChatPanelProps {
  selectedAgentId?: string | null
  onSelectedAgentChange?: (agentId: string | null) => void
}

export function AgentChatPanel({ selectedAgentId, onSelectedAgentChange }: AgentChatPanelProps) {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [sessionId]                 = useState(() => uuidv4());
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [pendingHumanApproval, setPendingHumanApproval] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (selectedAgentId) {
      setActiveAgentId(selectedAgentId);
    }
  }, [selectedAgentId]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: uuidv4(), timestamp: new Date() }]);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const effectiveTargetAgentId = selectedAgentId || undefined;

    setInput('');
    addMessage({ role: 'user', content: trimmed });
    setLoading(true);

    try {
      const resp: ChatResponse = await sendMessage({
        message: trimmed,
        sessionId,
        targetAgentId: effectiveTargetAgentId,
      });

      setActiveAgentId(resp.agent_id);
      onSelectedAgentChange?.(resp.agent_id);

      if (resp.requires_human_review && resp.confidence.must_pause) {
        // Critical confidence — show approval gate before surfacing answer
        setPendingMessage(resp.content);
        setPendingHumanApproval(true);
      } else {
        addMessage({
          role: 'assistant',
          content: resp.content,
          agent_id: resp.agent_id,
          confidence: resp.confidence,
          decision_level: resp.decision_level,
          requires_human_review: resp.requires_human_review,
        });
      }
    } catch (err) {
      const msg = err instanceof AgentsAPIError
        ? err.message
        : '连接失败，请稍后重试。';
      addMessage({ role: 'assistant', content: `⚠️ ${msg}`, agent_id: 'system' });
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, addMessage, selectedAgentId, onSelectedAgentChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const confirmHumanApproval = () => {
    if (pendingMessage) {
      addMessage({
        role: 'assistant',
        content: pendingMessage,
        agent_id: activeAgentId ?? 'cos_zhuge_liang',
      });
    }
    setPendingHumanApproval(false);
    setPendingMessage(null);
  };

  const activeProfile = getAgentProfile(activeAgentId || selectedAgentId || 'cos_zhuge_liang');

  return (
    <div className="flex min-h-0 flex-col h-full bg-[#0d1117] rounded-3xl border border-white/8 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8
                      bg-gradient-to-r from-white/3 to-transparent">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl
                        bg-gradient-to-br from-violet-500/30 to-blue-500/20
                        border border-white/10 text-lg">
          🪄
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">SK AI Agent Legion</h2>
          <p className="text-white/40 text-xs">
            {activeProfile
              ? `${activeProfile.emoji} ${activeProfile.name_zh} 正在响应`
              : '诸葛亮 · 12位CxO待命'
            }
          </p>
          {selectedAgentId ? (
            <p className="mt-1 text-[11px] text-white/45">
              直连目标：{getAgentProfile(selectedAgentId)?.role ?? selectedAgentId}
            </p>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs">在线</span>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin
                      scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* Welcome state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center space-y-2">
              <div className="text-4xl">🪄</div>
              <h3 className="text-white font-medium">你好，我是诸葛亮</h3>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                Star Kitchen C-Suite 智能幕僚。你的问题我来路由给最合适的 CxO 专家。
              </p>
            </div>
            <div className="w-full space-y-2">
              <p className="text-white/30 text-xs text-center">你可以问：</p>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5
                             hover:bg-white/8 border border-white/8 hover:border-white/15
                             text-white/60 hover:text-white/80 text-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => {
          const collapseEnabled = msg.role === 'assistant' && shouldEnableMessageCollapse(msg.content);
          const expanded = Boolean(expandedMessages[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <AgentAvatar agentId={msg.agent_id ?? 'cos_zhuge_liang'} />
              )}

              <div className={`max-w-[85%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Agent name + decision level */}
                {msg.role === 'assistant' && msg.agent_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs">
                      {getAgentProfile(msg.agent_id)?.name_zh ?? msg.agent_id}
                    </span>
                    {msg.decision_level && (
                      <span className="text-white/20 text-xs">
                        · {DECISION_LEVEL_LABELS[msg.decision_level]}
                      </span>
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-blue-600/80 text-white rounded-br-md'
                    : 'bg-white/7 text-white/85 border border-white/8 rounded-bl-md'
                  }`}
                >
                  <div className={`whitespace-pre-wrap ${collapseEnabled && !expanded ? 'max-h-64 overflow-hidden' : ''}`}>
                    {msg.content}
                  </div>
                  {collapseEnabled && !expanded ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-[#111827] to-transparent" />
                  ) : null}
                </div>

                {collapseEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedMessages((previous) => ({
                        ...previous,
                        [msg.id]: !previous[msg.id],
                      }));
                    }}
                    className="text-[11px] text-blue-300/90 hover:text-blue-200"
                  >
                    {expanded ? '收起详情' : '展开详情'}
                  </button>
                ) : null}

                {/* Confidence badge */}
                {msg.confidence && (
                  <ConfidenceBadge confidence={msg.confidence} />
                )}
                {msg.role === 'assistant' && (
                  <FeedbackButtons
                    sessionId={sessionId}
                    agentId={msg.agent_id ?? 'cos_zhuge_liang'}
                    confidenceScore={msg.confidence?.score}
                    decisionLevel={msg.decision_level}
                  />
                )}

                {/* Human review flag */}
                {msg.requires_human_review && msg.confidence?.tier !== 'critical' && (
                  <span className="text-amber-400/70 text-xs flex items-center gap-1">
                    🔐 建议人工确认后执行
                  </span>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex items-center justify-center w-7 h-7 rounded-lg
                                bg-blue-600/30 text-xs text-blue-300 shrink-0">
                  你
                </div>
              )}
            </div>
          );
        })}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">
              🪄
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/7 border border-white/8">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
                <span className="text-white/30 text-xs ml-1">正在分析...</span>
              </div>
            </div>
          </div>
        )}

        {/* Human approval gate */}
        {pendingHumanApproval && (
          <HumanApprovalBanner
            onConfirm={confirmHumanApproval}
            onDismiss={() => { setPendingHumanApproval(false); setPendingMessage(null); }}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-t border-white/8 bg-white/2">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问我任何运营、财务、法务或增长问题..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl
                       px-3 py-2.5 text-sm text-white placeholder-white/25
                       focus:outline-none focus:border-white/25 focus:bg-white/8
                       transition-all disabled:opacity-50 leading-relaxed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl
                       bg-blue-600 hover:bg-blue-500 disabled:bg-white/10
                       disabled:text-white/20 text-white transition-all shrink-0"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 rotate-90">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-white/20 text-xs mt-1.5 text-center">
          Enter 发送 · Shift+Enter 换行 · 所有对话加密存储
        </p>
      </div>
    </div>
  );
}
