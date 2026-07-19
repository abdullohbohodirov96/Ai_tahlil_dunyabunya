"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, PhoneMissed, CircleDot, Clock } from "lucide-react";
import { api } from "../lib/apiClient.js";

const contactOptions = [
  { id: "ha", label: "Ha", icon: Phone, color: "text-mint" },
  { id: "yoq", label: "Yo'q", icon: PhoneOff, color: "text-coral" },
  { id: "kotarmadi", label: "Ko'tarmadi", icon: PhoneMissed, color: "text-accent" },
  { id: "ochiq", label: "Ochiq tel", icon: CircleDot, color: "text-textMuted" },
];

const qualityOptions = [
  { id: "issiq", label: "Issiq" },
  { id: "iliq", label: "Iliq" },
  { id: "sovuq", label: "Sovuq" },
];

export default function LeadDetail({ lead, onSave }) {
  const [form, setForm] = useState({
    contact_status: lead.contact_status || "",
    quality: lead.quality || "",
    follow_up_date: lead.follow_up_date ? lead.follow_up_date.slice(0, 10) : "",
    note: lead.note || "",
    sold: lead.sold || false,
    sale_amount: lead.sale_amount || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activities, setActivities] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  function loadActivities() {
    api.leadActivities(lead.id).then(setActivities).catch(() => {});
  }

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(lead.id, {
        ...form,
        sale_amount: form.sale_amount ? Number(form.sale_amount) : null,
        follow_up_date: form.follow_up_date || null,
      });
      loadActivities();
    } catch (e) {
      setSaveError(e.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    setSaveError("");
    try {
      await api.addLeadActivity(lead.id, newNote.trim());
      setNewNote("");
      loadActivities();
    } catch (e) {
      setSaveError(e.message || "Izoh qo'shishda xatolik");
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-textMuted uppercase tracking-wide">Bog'lanildimi?</label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {contactOptions.map((c) => {
              const Icon = c.icon;
              const active = form.contact_status === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setForm((f) => ({ ...f, contact_status: c.id }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    active ? "bg-accent/15 border-accent/40 text-accent" : "border-border text-textMuted hover:text-textPrimary"
                  }`}
                >
                  <Icon size={13} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs text-textMuted uppercase tracking-wide">Lead sifati</label>
          <div className="flex gap-2 mt-1.5">
            {qualityOptions.map((q) => (
              <button
                key={q.id}
                onClick={() => setForm((f) => ({ ...f, quality: q.id }))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.quality === q.id ? "bg-accent/15 border-accent/40 text-accent" : "border-border text-textMuted hover:text-textPrimary"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-textMuted uppercase tracking-wide">Qayta aloqa sanasi</label>
          <input
            type="date"
            value={form.follow_up_date}
            onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
            className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-textMuted uppercase tracking-wide">Izoh</label>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="mijoz haqida izoh..."
            className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm resize-none"
          />
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="text-xs text-textMuted uppercase tracking-wide">Sotildimi?</label>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => setForm((f) => ({ ...f, sold: true }))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.sold ? "bg-mint/15 border-mint/40 text-mint" : "border-border text-textMuted"
                }`}
              >
                Ha
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, sold: false }))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  !form.sold ? "bg-coral/15 border-coral/40 text-coral" : "border-border text-textMuted"
                }`}
              >
                Yo'q
              </button>
            </div>
          </div>
          {form.sold && (
            <div className="flex-1">
              <label className="text-xs text-textMuted uppercase tracking-wide">Summa ($)</label>
              <input
                type="number"
                value={form.sale_amount}
                onChange={(e) => setForm((f) => ({ ...f, sale_amount: e.target.value }))}
                placeholder="0"
                className="mt-1.5 w-full bg-panel border border-border rounded px-2 py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent text-base font-medium rounded-lg py-2 text-sm hover:bg-accentDim transition-colors disabled:opacity-50"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        {saveError && <p className="text-coral text-xs">{saveError}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-xs text-textMuted uppercase tracking-wide flex items-center gap-1.5">
          <Clock size={13} />
          Tarix
        </label>
        <div className="flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            placeholder="qo'ng'iroq haqida qisqa yozuv qo'shish..."
            className="flex-1 bg-panel border border-border rounded px-2 py-1.5 text-xs"
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote}
            className="bg-accent/20 text-accent rounded px-3 py-1.5 text-xs hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            Qo'shish
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {activities.map((a) => (
            <div key={a.id} className="bg-panel border border-border rounded-lg px-3 py-2 text-xs">
              <p className="text-textPrimary">{a.text}</p>
              <p className="text-textMuted mt-1">
                {a.author_name || "Tizim"} · {new Date(a.created_at).toLocaleString("uz-UZ")}
              </p>
            </div>
          ))}
          {!activities.length && <p className="text-xs text-textMuted">Hozircha tarix yo'q.</p>}
        </div>
      </div>
    </div>
  );
}

export { contactOptions, qualityOptions };
