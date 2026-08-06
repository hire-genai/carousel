"use client";

import { useState, useRef, useCallback } from "react";

interface InitialPost {
  id: string;
  content: string;
  status: string;
  imageData: string | null;
  scheduledAt: string | null;
}

interface Props {
  linkedinConnected: boolean;
  linkedinName: string;
  linkedinUrn: string;
  initialPost?: InitialPost | null;
}

const MAX_CHARS = 3000;

// Clean SVG icon components
function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function IconPoly({ points }: { points: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
}

export default function PostEditorClient({ linkedinConnected, linkedinName, initialPost }: Props) {
  const isScheduled = initialPost?.status === "scheduled";

  const [content, setContent] = useState(initialPost?.content ?? "");
  const [postId, setPostId] = useState<string | null>(initialPost?.id ?? null);
  const [image, setImage] = useState<string | null>(initialPost?.imageData ?? null);
  const [imageName, setImageName] = useState(initialPost?.imageData ? "Attached image" : "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "saved" | "scheduled" | "published" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // AI Generator
  const [showAI, setShowAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiYoutube, setAiYoutube] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "storytelling" | "bold">("professional");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // Post Later
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedDate, setSchedDate] = useState(
    initialPost?.scheduledAt ? new Date(initialPost.scheduledAt).toISOString().split("T")[0] : ""
  );
  const [schedTime, setSchedTime] = useState(
    initialPost?.scheduledAt
      ? new Date(initialPost.scheduledAt).toTimeString().slice(0, 5)
      : ""
  );

  // Hyperlink
  const [showLinkBox, setShowLinkBox] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charPct = Math.min((chars / MAX_CHARS) * 100, 100);

  // ── Helpers ────────────────────────────────────────────
  function insertAtCursor(text: string) {
    if (isScheduled) return;
    const ta = textareaRef.current;
    if (!ta) { setContent((c) => c + text); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = content.slice(0, s) + text + content.slice(e);
    setContent(next);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + text.length; ta.focus(); }, 0);
  }

  function wrapSelection(prefix: string, suffix = prefix) {
    if (isScheduled) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const selected = content.slice(s, e);
    setContent(content.slice(0, s) + prefix + selected + suffix + content.slice(e));
    setTimeout(() => { ta.selectionStart = s + prefix.length; ta.selectionEnd = e + prefix.length; ta.focus(); }, 0);
  }

  function loadImageFile(file: File) {
    if (isScheduled) return;
    if (!file.type.startsWith("image/")) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  }

  function insertLink() {
    if (!linkUrl.trim()) return;
    insertAtCursor(`[${linkText.trim() || linkUrl}](${linkUrl})`);
    setShowLinkBox(false);
    setLinkUrl(""); setLinkText("");
  }

  // ── Save to DB ─────────────────────────────────────────
  async function upsertPost(extraData: Record<string, unknown> = {}): Promise<string | null> {
    if (!content.trim()) return null;
    const body = { content, imageData: image ?? null, ...extraData };
    if (postId) {
      await fetch(`/api/text-posts/${postId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return postId;
    }
    const res = await fetch("/api/text-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { setPostId(data.post.id); return data.post.id; }
    return null;
  }

  // ── Actions ────────────────────────────────────────────
  const handleSave = useCallback(async (status: "draft" | "complete" = "draft") => {
    if (!content.trim()) return;
    setSaving(true); setErrorMsg(""); setShowSaveDialog(false);
    try {
      const id = await upsertPost({ status });
      if (id) setActionStatus("saved");
      else { setActionStatus("error"); setErrorMsg("Failed to save."); }
    } catch { setActionStatus("error"); setErrorMsg("Save failed."); }
    finally { setSaving(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, image, postId]);

  async function handleSchedule() {
    if (!schedDate || !schedTime) return;
    const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString();
    setSaving(true); setErrorMsg("");
    try {
      const id = await upsertPost({ status: "scheduled", scheduledAt });
      if (id) { setActionStatus("scheduled"); setShowScheduler(false); }
      else { setActionStatus("error"); setErrorMsg("Failed to schedule."); }
    } catch { setActionStatus("error"); setErrorMsg("Schedule failed."); }
    finally { setSaving(false); }
  }

  async function handlePublish() {
    if (!content.trim() || isScheduled) return;
    if (!linkedinConnected) { setErrorMsg("Connect LinkedIn in Settings first."); return; }
    setPublishing(true); setErrorMsg("");
    try {
      const id = await upsertPost({ status: "draft" });
      if (!id) { setErrorMsg("Failed to save before publish."); setPublishing(false); return; }
      const res = await fetch(`/api/text-posts/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActionStatus("published");
        setContent(""); setPostId(null); setImage(null); setImageName("");
      } else {
        setActionStatus("error"); setErrorMsg(data.error ?? "Publish failed.");
      }
    } catch { setActionStatus("error"); setErrorMsg("Network error."); }
    finally { setPublishing(false); }
  }

  // ── AI Generate ────────────────────────────────────────
  async function handleAIGenerate() {
    if (!aiTopic.trim() && !aiYoutube.trim()) { setAiError("Enter a topic or YouTube URL."); return; }
    setAiGenerating(true); setAiError("");
    try {
      let source = aiTopic.trim();
      if (aiYoutube.trim()) {
        const r = await fetch("/api/fetch-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: aiYoutube.trim(), mode: "youtube" }) });
        const d = await r.json();
        if (!r.ok || d.error) { setAiError(d.error || "Could not fetch YouTube transcript."); setAiGenerating(false); return; }
        source = d.content;
      }
      const r = await fetch("/api/generate-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: source, tone: aiTone }) });
      const d = await r.json();
      if (!r.ok || d.error) { setAiError(d.error || "AI generation failed."); }
      else { setContent(d.post); setShowAI(false); setAiTopic(""); setAiYoutube(""); }
    } catch { setAiError("Network error. Try again."); }
    finally { setAiGenerating(false); }
  }

  function renderPreview(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 underline" target="_blank">$1</a>')
      .replace(/\n/g, "<br/>");
  }

  const initials = linkedinName ? linkedinName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="flex flex-col h-full min-h-0 relative">

      {/* ── AI Modal ── */}
      {showAI && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div>
                <h3 className="text-white font-bold text-base">✨ AI Post Generator</h3>
                <p className="text-white/35 text-[12px] mt-0.5">Generate a LinkedIn post from a topic or YouTube video</p>
              </div>
              <button onClick={() => setShowAI(false)} className="w-7 h-7 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition text-lg flex items-center justify-center">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Topic / Idea</label>
                <textarea value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. 5 habits that doubled my LinkedIn engagement" rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" /><span className="text-white/20 text-[11px] font-semibold uppercase tracking-widest">or</span><div className="h-px flex-1 bg-white/[0.07]" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">YouTube URL</label>
                <input type="url" value={aiYoutube} onChange={(e) => setAiYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["professional", "casual", "storytelling", "bold"] as const).map((t) => (
                    <button key={t} onClick={() => setAiTone(t)} className={`py-2 rounded-lg text-[11px] font-semibold capitalize transition ${aiTone === t ? "bg-violet-600 text-white" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.09] hover:text-white border border-white/[0.08]"}`}>{t}</button>
                  ))}
                </div>
              </div>
              {aiError && <p className="text-red-400 text-[12px]">{aiError}</p>}
            </div>
            <div className="px-6 pb-5">
              <button onClick={handleAIGenerate} disabled={aiGenerating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {aiGenerating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : "✨ Generate Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post Later Modal ── */}
      {showScheduler && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div>
                <h3 className="text-white font-bold text-base">⏰ Schedule Post</h3>
                <p className="text-white/35 text-[12px] mt-0.5">Pick date & time — posts automatically</p>
              </div>
              <button onClick={() => setShowScheduler(false)} className="w-7 h-7 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition text-lg flex items-center justify-center">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Date</label>
                <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Time</label>
                <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
              </div>
              {schedDate && schedTime && (
                <p className="text-white/40 text-[12px] bg-white/[0.03] px-3 py-2 rounded-lg">
                  Will post: <span className="text-white/70 font-semibold">{schedDate} at {schedTime}</span>
                </p>
              )}
            </div>
            <div className="px-6 pb-5">
              <button onClick={handleSchedule} disabled={!schedDate || !schedTime || saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm transition disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "⏰ Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Type Dialog ── */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
              <div>
                <h3 className="text-white font-bold text-base">Choose Save Type</h3>
                <p className="text-white/35 text-[12px] mt-0.5">How would you like to save this post?</p>
              </div>
              <button onClick={() => setShowSaveDialog(false)} className="w-7 h-7 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition text-lg flex items-center justify-center">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <button onClick={() => handleSave("draft")} disabled={saving}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-left transition disabled:opacity-50">
                <p className="text-white font-semibold text-sm">Save as Draft</p>
                <p className="text-white/35 text-xs mt-0.5">Unfinished work — visible in Drafts only</p>
              </button>
              <button onClick={() => handleSave("complete")} disabled={saving}
                className="w-full p-4 rounded-xl border border-blue-500/30 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] text-left transition disabled:opacity-50">
                <p className="text-blue-300 font-semibold text-sm">Save as Complete</p>
                <p className="text-blue-300/50 text-xs mt-0.5">Ready for publishing — visible in My Posts</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled read-only banner */}
      {isScheduled && (
        <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
          <span className="text-amber-400 text-sm">⏰</span>
          <p className="text-amber-300 text-[13px] font-medium flex-1">
            Scheduled for {schedDate} at {schedTime} — post is locked until published or unscheduled.
          </p>
          <a href="/dashboard/scheduled" className="text-amber-400 text-[12px] font-semibold hover:text-amber-300 underline underline-offset-2 transition">
            Manage →
          </a>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
        <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold">Publish to</p>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#0A66C2]/40 bg-[#0A66C2]/10 text-[#60a9e8] text-[13px] font-semibold">
          <span className="font-black text-[#0A66C2] text-sm">in</span> LinkedIn
          {linkedinConnected ? <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" /> : <span className="text-[10px] text-amber-400 ml-2">Not connected</span>}
        </div>
        {!isScheduled && (
          <div className="ml-auto">
            <button onClick={() => { setShowAI(true); setAiError(""); }}
              className="px-4 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-300 hover:bg-violet-600/25 hover:text-white text-[13px] font-semibold transition flex items-center gap-2">
              ✨ AI Generate
            </button>
          </div>
        )}
      </div>

      {/* ── Main two-column ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT — Editor */}
        <div className="flex-1 flex flex-col border-r border-white/[0.06] min-h-0">

          {/* ── Toolbar ── */}
          <div className={`flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] flex-shrink-0 ${isScheduled ? "opacity-30 pointer-events-none" : ""}`}>

            {/* Text formatting */}
            <button onClick={() => wrapSelection("**")} title="Bold" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center font-black text-[13px]">B</button>
            <button onClick={() => wrapSelection("*")} title="Italic" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center italic text-[13px]">I</button>
            <button onClick={() => insertAtCursor("\n• ")} title="Bullet point" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
            </button>
            <button onClick={() => insertAtCursor("#")} title="Hashtag" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center">
              <Icon d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />
            </button>
            <button onClick={() => insertAtCursor("@")} title="Mention" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
            </button>
            <button onClick={() => insertAtCursor(" — ")} title="Em dash" className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center text-[15px] font-semibold">—</button>

            <div className="w-px h-4 bg-white/[0.08] mx-1" />

            {/* Emoji */}
            <button title="Insert emoji" onClick={() => insertAtCursor("🚀")} className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center text-base">😊</button>

            {/* Hyperlink */}
            <div className="relative">
              <button title="Insert link" onClick={() => setShowLinkBox((v) => !v)}
                className={`w-8 h-8 rounded-lg transition flex items-center justify-center ${showLinkBox ? "bg-white/[0.08] text-white" : "text-white/50 hover:text-white hover:bg-white/[0.08]"}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </button>
              {showLinkBox && (
                <div className="absolute left-0 top-full mt-2 z-40 bg-[#16161e] border border-white/[0.1] rounded-xl p-3 w-60 shadow-2xl space-y-2">
                  <input type="text" placeholder="Display text (optional)" value={linkText} onChange={(e) => setLinkText(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-[12px] placeholder:text-white/20 focus:outline-none" />
                  <input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && insertLink()}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-[12px] placeholder:text-white/20 focus:outline-none" />
                  <button onClick={insertLink} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold rounded-lg transition">Insert</button>
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-white/[0.08] mx-1" />

            {/* Image upload */}
            <button title="Add image (JPG, PNG, GIF)" onClick={() => imageInputRef.current?.click()}
              className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImageFile(f); }} />

            {/* Video upload */}
            <button title="Add video (MP4, MOV)" onClick={() => videoInputRef.current?.click()}
              className="w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </button>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={() => {}} />

            {/* Show attached media name */}
            {imageName && (
              <span className="ml-2 text-[11px] text-white/35 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-lg flex items-center gap-1.5">
                {imageName.length > 18 ? imageName.slice(0, 16) + "…" : imageName}
                <button onClick={() => { setImage(null); setImageName(""); }} className="text-white/20 hover:text-red-400 transition leading-none">✕</button>
              </span>
            )}
          </div>

          {/* Textarea */}
          <textarea ref={textareaRef} value={content}
            onChange={(e) => { if (isScheduled) return; setContent(e.target.value); if (actionStatus !== "idle") setActionStatus("idle"); }}
            readOnly={isScheduled}
            placeholder={isScheduled ? "This post is scheduled and locked for editing." : "Start typing your LinkedIn post... or click ✨ AI Generate above"}
            maxLength={MAX_CHARS}
            className={`flex-1 w-full bg-transparent text-[15px] leading-relaxed resize-none focus:outline-none px-6 py-5 placeholder:text-white/20 ${isScheduled ? "text-white/40 cursor-not-allowed" : "text-white/85"}`}
          />

          {/* Image dropzone */}
          <div
            ref={dragRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`mx-5 mb-3 border-2 border-dashed border-white/[0.08] rounded-xl transition-colors ${isScheduled ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
            onClick={() => !image && !isScheduled && imageInputRef.current?.click()}
          >
            {image ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="attached" className="w-full max-h-44 object-cover rounded-xl" />
                {!isScheduled && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition rounded-xl flex items-center justify-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[12px] font-semibold rounded-lg transition">Change</button>
                    <button onClick={(e) => { e.stopPropagation(); setImage(null); setImageName(""); }} className="px-3 py-1.5 bg-red-500/40 hover:bg-red-500/60 text-white text-[12px] font-semibold rounded-lg transition">Remove</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-4 text-white/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p className="text-[12px]">Drag & drop or click to add image</p>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] flex-shrink-0 gap-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                <circle cx="12" cy="12" r="9" fill="none"
                  stroke={chars > 2800 ? "#f87171" : chars > 2400 ? "#fbbf24" : "#3b82f6"}
                  strokeWidth="3" strokeDasharray={`${(charPct / 100) * 56.5} 56.5`} strokeLinecap="round" transform="rotate(-90 12 12)" />
              </svg>
              <span className={`text-[11px] font-mono ${chars > 2800 ? "text-red-400" : "text-white/30"}`}>{chars}/{MAX_CHARS} · {words}w</span>
              {actionStatus === "saved" && <span className="text-green-400 text-[12px]">✓ Saved</span>}
              {actionStatus === "scheduled" && <span className="text-amber-400 text-[12px]">⏰ Scheduled</span>}
              {actionStatus === "published" && <span className="text-green-400 text-[12px]">✓ Published!</span>}
              {(actionStatus === "error" && errorMsg) && <span className="text-red-400 text-[12px] truncate max-w-[140px]">{errorMsg}</span>}
            </div>

            {isScheduled ? (
              <div className="flex items-center gap-2">
                <span className="text-amber-400/70 text-[12px] font-medium">⏰ Locked — scheduled</span>
                <a href="/dashboard/scheduled" className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-[12px] font-semibold transition">
                  Manage →
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { if (content.trim()) setShowSaveDialog(true); }} disabled={saving || !content.trim()} title="Save post"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/55 hover:text-white text-[12px] font-semibold transition disabled:opacity-30">
                  {saving ? "Saving…" : "💾 Save"}
                </button>
                <button onClick={() => { if (content.trim()) setShowScheduler(true); }} disabled={!content.trim()} title="Post Later — pick date & time"
                  className="px-3 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-[12px] font-semibold transition disabled:opacity-30">
                  ⏰ Post Later
                </button>
                <button onClick={handlePublish} disabled={publishing || !content.trim() || !linkedinConnected}
                  title={!linkedinConnected ? "Connect LinkedIn in Settings first" : "Publish now to LinkedIn"}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-[12px] font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-40 flex items-center gap-1.5">
                  {publishing ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing…</> : "Publish Now →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — LinkedIn Preview */}
        <div className="w-[390px] flex-shrink-0 flex flex-col bg-[#0a0a10]">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center flex-shrink-0">
            <p className="text-[11px] text-white/25 uppercase tracking-widest font-semibold">Post Preview</p>
            <div className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-white/40">
              <span className="font-black text-[#0A66C2]">in</span> LinkedIn
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="bg-[#1B1B27] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
              <div className="p-5 pb-3 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-white text-sm flex-shrink-0">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{linkedinName || "Your Name"}</p>
                  <p className="text-white/35 text-[11px] mt-0.5">Now · 🌐</p>
                </div>
                <button className="text-[#60a9e8] text-[11px] font-semibold border border-[#0A66C2]/40 px-2.5 py-1 rounded-full hover:bg-[#0A66C2]/10 transition flex-shrink-0">+ Follow</button>
              </div>
              <div className="px-5 pb-3">
                {content.trim() ? (
                  <div className="text-white/80 text-[13px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: renderPreview(content) }} />
                ) : (
                  <p className="text-white/15 text-[13px] italic">Start typing to see your preview here…</p>
                )}
              </div>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="post image" className="w-full max-h-56 object-cover" />
              ) : (
                <div className="mx-5 mb-4 border border-dashed border-white/[0.07] rounded-xl flex flex-col items-center justify-center py-7 text-white/12 gap-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <p className="text-[11px] text-white/15">Image preview</p>
                </div>
              )}
              <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-4 text-white/20 text-[11px]">
                {["👍 Like", "💬 Comment", "🔁 Repost", "📤 Send"].map((a) => <span key={a}>{a}</span>)}
              </div>
            </div>
            {actionStatus === "published" && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-[13px] text-center font-medium">✓ Published to LinkedIn!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
