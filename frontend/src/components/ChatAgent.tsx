import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MessageCircle, X, Send, Bot, User, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* ─── Types ─── */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  visualizations?: Visualization[];
  progress?: string;
}

interface Visualization {
  type: 'donut' | 'bars';
  title: string;
  data: Array<Record<string, string | number>>;
  map_url?: string;
}

const CHART_COLORS = ['#9b145a', '#e65a78', '#ffbe78', '#d8d8a8', '#006400', '#2878b5', '#7a5aa6', '#94734a'];

function DataVisualization({ visualization }: { visualization: Visualization }) {
  const keys = visualization.type === 'bars' && visualization.data[0]
    ? Object.keys(visualization.data[0]).filter(key => key !== 'governorate')
    : [];
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-umbrella-border bg-white p-3 not-prose">
      <p className="mb-2 text-xs font-semibold text-umbrella-text">{visualization.title}</p>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {visualization.type === 'donut' ? (
            <PieChart>
              <Pie data={visualization.data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={1}>
                {visualization.data.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)} %`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          ) : (
            <BarChart data={visualization.data} margin={{ top: 5, right: 5, left: -22, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="governorate" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(value) => `${Number(value).toFixed(1)} %`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              {keys.map((key, index) => <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} radius={[2, 2, 0, 0]} />)}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {visualization.map_url && <a href={visualization.map_url} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-umbrella-accent hover:underline">Voir sur la carte <ExternalLink size={12} /></a>}
    </div>
  );
}

/* ─── Component ─── */

interface ChatAgentProps {
  placement?: 'default' | 'geoportal';
  geoportalHasStats?: boolean;
  analysisRequest?: {
    id: number;
    prompt: string;
    context: { layerId: number; governorate: string };
  } | null;
}

export default function ChatAgent({ placement = 'default', geoportalHasStats = false, analysisRequest = null }: ChatAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationSummary, setConversationSummary] = useState('');
  const [summarizedCount, setSummarizedCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handledAnalysisRequestRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = async (message: string, analysisContext?: { layerId: number; governorate: string }) => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant message for streaming
    const assistantMessage: Message = { role: 'assistant', content: '' };
    setMessages([...updatedMessages, assistantMessage]);

    // Abort any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(summarizedCount).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          summary: conversationSummary,
          ...(analysisContext ? { analysisContext } : {}),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Request failed' }));
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: `⚠️ ${errData.error || 'Something went wrong. Please try again.'}`,
          };
          return copy;
        });
        setIsStreaming(false);
        return;
      }

      // Read stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          if (!trimmedLine.startsWith('data: ')) continue;

          const jsonStr = trimmedLine.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  progress: undefined,
                  content: copy[copy.length - 1].content + parsed.content,
                };
                return copy;
              });
            }
            if (parsed.type === 'progress' && typeof parsed.message === 'string') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, progress: parsed.message };
                return copy;
              });
            }
            if (parsed.type === 'visualization' && parsed.visualization) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, visualizations: [...(last.visualizations || []), parsed.visualization] };
                return copy;
              });
            }
            if (parsed.type === 'error' && parsed.error) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: `⚠️ ${parsed.error}` };
                return copy;
              });
            }
            if (parsed.type === 'context' && typeof parsed.summary === 'string') {
              setConversationSummary(parsed.summary);
              if (Number.isInteger(parsed.consumed) && parsed.consumed > 0) {
                setSummarizedCount(count => count + parsed.consumed);
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === '') {
          copy[copy.length - 1] = {
            role: 'assistant',
            content: '⚠️ Connection error. Please try again.',
          };
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    await sendMessage(input);
  };

  useEffect(() => {
    if (!analysisRequest || handledAnalysisRequestRef.current === analysisRequest.id) return;
    setIsOpen(true);
    if (isStreaming) {
      setInput(analysisRequest.prompt);
      return;
    }
    handledAnalysisRequestRef.current = analysisRequest.id;
    void sendMessage(analysisRequest.prompt, analysisRequest.context);
    // sendMessage deliberately uses the latest chat state when this request changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisRequest, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    abortRef.current?.abort();
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`fixed flex h-14 w-14 items-center justify-center rounded-full bg-umbrella-accent text-white shadow-lg transition-all duration-300 hover:bg-umbrella-accent/90 hover:shadow-xl active:scale-[0.98] group ${
            placement === 'geoportal'
              ? geoportalHasStats
                ? 'bottom-[calc(55dvh+1rem)] right-3 top-auto z-[1200] translate-y-0 lg:bottom-auto lg:right-4 lg:top-[29rem]'
                : 'right-3 top-[46%] z-[1200] -translate-y-1/2 lg:right-4 lg:top-1/2 lg:translate-y-0'
              : 'bottom-6 right-6 z-[9999]'
          }`}
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-200" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-umbrella-accent/30 animate-ping" />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className={`fixed flex h-[550px] max-h-[calc(100dvh-6rem)] w-[380px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-umbrella-border bg-white shadow-2xl animate-slide-up ${
          placement === 'geoportal' ? 'bottom-3 right-3 z-[2200] sm:bottom-4 sm:right-4' : 'bottom-6 right-6 z-[9999] max-w-[calc(100vw-3rem)]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-umbrella-accent text-white">
            <div className="flex items-center gap-2.5">
              <Bot size={20} strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold tracking-wide">Umbrella Assistant</p>
                <p className="text-[10px] text-white/60">Powered by AI</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 geo-sidebar-scroll">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-full bg-umbrella-accent-light flex items-center justify-center mb-4">
                  <Bot size={24} className="text-umbrella-accent" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-umbrella-text mb-1">
                  Bonjour ! 👋
                </p>
                <p className="text-xs text-umbrella-text-light leading-relaxed">
                  Ask me about the Umbrella project, land degradation in Tunisia,
                  the Geoportal, or our partners.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-umbrella-accent-light flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-umbrella-accent" strokeWidth={1.5} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-umbrella-accent text-white rounded-br-md whitespace-pre-wrap'
                      : 'bg-umbrella-bg-alt text-umbrella-text rounded-bl-md prose prose-sm prose-umbrella max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:mb-2 [&_ol]:ml-4 [&_ol]:list-decimal [&_li]:mb-0.5 [&_strong]:font-semibold [&_em]:italic [&_a]:text-umbrella-accent [&_a]:underline [&_a:hover]:text-umbrella-accent/80 [&_code]:bg-umbrella-border/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-umbrella-dark [&_pre]:text-white [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-umbrella-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1'
                  }`}
                >
                  {msg.content ? (
                    msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )
                  ) : msg.progress ? (
                    <div className="flex items-center gap-2.5 text-xs text-umbrella-text-secondary">
                      <span className="flex items-center gap-1" aria-hidden="true">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-umbrella-accent" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-umbrella-accent [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-umbrella-accent [animation-delay:300ms]" />
                      </span>
                      <span>{msg.progress}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-umbrella-text-light">Connexion à l’assistant…</span>
                  )}
                  {msg.visualizations?.map((visualization, index) => <DataVisualization key={`${visualization.title}-${index}`} visualization={visualization} />)}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-umbrella-warm-light flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-umbrella-warm" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-umbrella-border px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 resize-none px-3 py-2 border border-umbrella-border rounded-xl text-sm text-umbrella-text placeholder:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300 max-h-24"
                disabled={isStreaming}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-2.5 bg-umbrella-accent text-white rounded-xl hover:bg-umbrella-accent/90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
