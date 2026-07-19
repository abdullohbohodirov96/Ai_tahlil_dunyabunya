"use client";

import { useEffect, useState } from "react";
import { Send, X, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "../lib/apiClient.js";
import { useLanguage } from "../lib/i18n.js";

export default function TelegramLinkModal({ open, onClose }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    api.telegramLinkStatus().then(setStatus).catch(() => setStatus({ linked: false }));
  }, [open]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api.generateTelegramLink();
      setLink(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-textPrimary"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Send size={18} className="text-accent" />
          <h3 className="font-display font-medium">Telegram ulash</h3>
        </div>

        {status?.linked ? (
          <div className="bg-mint/10 border border-mint/30 rounded-lg p-4 flex items-start gap-2">
            <CheckCircle2 size={18} className="text-mint shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-textPrimary">Telegram akkountingiz bog'langan</p>
              <p className="text-xs text-textMuted mt-0.5">
                @{status.username || status.first_name || "noma'lum"}
              </p>
            </div>
          </div>
        ) : link ? (
          <div className="space-y-3">
            <p className="text-sm text-textMuted">
              Quyidagi tugmani bosing — Telegram ochiladi, u yerda "Start" bosing, akkountingiz
              avtomatik bog'lanadi. Link 15 daqiqa amal qiladi.
            </p>
            <a
              href={link.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-accent text-base font-medium rounded-lg py-2.5 hover:bg-accentDim transition-colors"
            >
              Telegramda ochish
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-textMuted">
              Shaxsiy vazifalarni Telegram orqali olish uchun akkountingizni bog'lang.
            </p>
            {error && <p className="text-coral text-sm">{error}</p>}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full bg-accent text-base font-medium rounded-lg py-2.5 hover:bg-accentDim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Ulash havolasini olish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
