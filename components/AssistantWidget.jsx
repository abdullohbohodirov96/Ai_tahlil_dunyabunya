"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send } from "lucide-react";
import { api } from "../lib/apiClient.js";

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Salom! Men JARVIS assistentiman. Biznesingiz bo'yicha savol bering — masalan, \"bugun nechta lead tushdi?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.chat(text);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `Xatolik: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[28rem] bg-panel border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-panelAlt/50">
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
            <span className="font-display font-medium text-sm">JARVIS Assistent</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                  m.role === "user" ? "bg-accent/15 text-textPrimary ml-auto" : "bg-panelAlt text-textPrimary"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="bg-panelAlt text-textMuted text-sm rounded-lg px-3 py-2 max-w-[60%]">
                yozmoqda...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder="Savolingizni yozing..."
              className="flex-1 bg-panelAlt border border-border rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-accent"
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-accent text-base rounded-lg w-9 flex items-center justify-center hover:bg-accentDim disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-base flex items-center justify-center shadow-xl hover:bg-accentDim hover:scale-105 transition-all z-50"
        aria-label="AI assistentni ochish"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </>
  );
}
