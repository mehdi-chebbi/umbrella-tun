import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/* ─── Types ─── */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/* ─── Component ─── */

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
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
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
                  content: copy[copy.length - 1].content + parsed.content,
                };
                return copy;
              });
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
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-umbrella-accent text-white shadow-lg hover:shadow-xl hover:bg-umbrella-accent/90 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-200" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-umbrella-accent/30 animate-ping" />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-umbrella-border flex flex-col overflow-hidden animate-slide-up">
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
                  ) : (
                    <Loader2 size={14} className="animate-spin text-umbrella-text-light" />
                  )}
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
