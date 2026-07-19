"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export default function SettingField({ label, dbKey, currentInfo, multiline, onSave }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!value) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(dbKey, value);
      setValue("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const InputTag = multiline ? "textarea" : "input";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-textMuted">{label}</label>
        {currentInfo?.set ? (
          <span className="text-xs text-mint">sozlangan ({currentInfo.preview})</span>
        ) : (
          <span className="text-xs text-coral">sozlanmagan</span>
        )}
      </div>
      <div className="flex gap-2 items-start">
        <InputTag
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={multiline ? 3 : undefined}
          placeholder={currentInfo?.set ? "yangi qiymat bilan almashtirish..." : "qiymat kiriting..."}
          className="flex-1 bg-panelAlt border border-border rounded px-2 py-1.5 text-xs font-mono focus:border-accent outline-none transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={saving || !value}
          className="bg-accent/20 text-accent rounded px-3 py-1.5 text-xs hover:bg-accent/30 disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
