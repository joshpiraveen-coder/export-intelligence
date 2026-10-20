"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What documents are needed for sending spices to the UK?",
  "Is Halal certification required for UAE shipments?",
  "What is the import duty on tea in Canada?",
  "Why does Australia have strict food import rules?",
  "What is FDA Prior Notice and how do I submit it?",
  "What allergens must be declared on UK food labels?",
];

import { Suspense } from "react";

function AIAssistantChat() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm your Export Compliance Assistant for Jaffna Basket. I can help you understand export regulations, required documents, and compliance requirements for Sri Lankan products.\n\n${assessmentId ? "I can see you're viewing an assessment. Ask me anything about the compliance results or next steps." : "Ask me about any country's import regulations, required certificates, or compliance requirements."}\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          assessmentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: err.content || "Sorry, I encountered an error. Please try again.",
          };
          return updated;
        });
        return;
      }

      // Check if response is JSON (fallback) or stream
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: data.content,
          };
          return updated;
        });
        return;
      }

      // Stream response
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Connection error. Please check your API key in Settings and try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Compliance Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Powered by regulation database • Answers grounded in real data
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-full font-medium flex items-center gap-1">
            <Sparkles size={10} />
            Beta
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === "user" ? "bg-primary" : "bg-primary/20"
                  )}
                >
                  {msg.role === "user" ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-3 text-sm",
                    msg.role === "user" ? "chat-user text-foreground" : "chat-ai text-foreground"
                  )}
                >
                  {msg.content ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking…
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about regulations, documents, compliance requirements…"
              disabled={isStreaming}
              className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2">
            AI responses are grounded in our regulation database. Always verify with official authorities before shipping.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" /></div>}>
      <AIAssistantChat />
    </Suspense>
  );
}
