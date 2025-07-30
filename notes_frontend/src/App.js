import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// Color Palette
const COLORS = {
  primary: "#1976d2",
  accent: "#ff4081",
  secondary: "#424242",
  lightBg: "#fff",
  lightAlt: "#f7f7fb",
  border: "#e9ecef",
};

const SIDEBAR_WIDTH = 320;

// Utility
function formatDate(date) {
  if (!date) return "";
  let d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// PUBLIC_INTERFACE
export default function App() {
  // === App State ===
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light"); // Only for demo theme toggle

  // --- CRUD: Backend integration ---
  // Simulate backend using localStorage (replace with backend API for real deployment)
  useEffect(() => {
    // Load notes from localStorage or "backend"
    async function fetchNotes() {
      setLoading(true);
      setError("");
      try {
        let items = JSON.parse(localStorage.getItem("notes-db")) || [];
        setNotes(Array.isArray(items) ? items : []);
      } catch {
        setNotes([]);
      }
      setLoading(false);
    }
    fetchNotes();
  }, []);

  // Save to localStorage (simulate API)
  const persistNotes = (items) => {
    localStorage.setItem("notes-db", JSON.stringify(items));
    setNotes(items);
  };

  // Note creation
  // PUBLIC_INTERFACE
  const handleCreateNote = () => {
    const newNote = {
      id: String(Date.now()),
      title: "Untitled Note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      tags: [],
    };
    const updated = [newNote, ...notes];
    persistNotes(updated);
    setSelectedId(newNote.id);
  };

  // Note selection
  // PUBLIC_INTERFACE
  const handleSelectNote = (id) => setSelectedId(id);

  // Note update (title/content)
  // PUBLIC_INTERFACE
  const handleUpdateNote = (id, updates) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
  };

  // Note deletion
  // PUBLIC_INTERFACE
  const handleDeleteNote = (id) => {
    let idx = notes.findIndex((n) => n.id === id);
    if (idx >= 0) {
      if (window.confirm("Delete this note? This cannot be undone.")) {
        const updated = notes.filter((n) => n.id !== id);
        persistNotes(updated);
        // select next note or none
        setSelectedId(updated[idx] ? updated[idx].id : updated[0]?.id || null);
      }
    }
  };

  // Pin/unpin note
  // PUBLIC_INTERFACE
  const handleTogglePin = (id) => {
    const updated = notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
    );
    persistNotes(updated);
  };

  // Tag update
  // PUBLIC_INTERFACE
  const handleAddTag = (id, newTag) => {
    const updated = notes.map((n) =>
      n.id === id && newTag
        ? { ...n, tags: Array.from(new Set([...n.tags, newTag])), updatedAt: new Date().toISOString() }
        : n
    );
    persistNotes(updated);
  };
  // PUBLIC_INTERFACE
  const handleRemoveTag = (id, tag) => {
    const updated = notes.map((n) =>
      n.id === id
        ? { ...n, tags: n.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
        : n
    );
    persistNotes(updated);
  };

  // --- Search and Filtering ---
  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase();
    let filtered = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
    );
    filtered.sort((a, b) => {
      if (a.pinned === b.pinned) return new Date(b.updatedAt) - new Date(a.updatedAt);
      return b.pinned - a.pinned;
    });
    return filtered;
  }, [search, notes]);
  // Select first available note if none selected
  useEffect(() => {
    if (
      (!selectedId && filteredNotes.length) ||
      (selectedId && !notes.find((n) => n.id === selectedId))
    ) {
      setSelectedId(filteredNotes[0]?.id || null);
    }
    // eslint-disable-next-line
  }, [filteredNotes, notes]);

  // Selected note object
  const selNote = notes.find((n) => n.id === selectedId) || null;

  // --- Theming: apply theme to document root ---
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // --- Render ---
  return (
    <div className="NotesApp">
      <HeaderBar
        onNew={handleCreateNote}
        theme={theme}
        onTheme={toggleTheme}
        accent={COLORS.accent}
        primary={COLORS.primary}
      />
      <div className="MainLayout">
        <Sidebar
          notes={filteredNotes}
          onSelect={handleSelectNote}
          selectedId={selectedId}
          search={search}
          setSearch={setSearch}
          onNew={handleCreateNote}
          loading={loading}
          accent={COLORS.accent}
          primary={COLORS.primary}
        />
        <NoteDetail
          note={selNote}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onPin={handleTogglePin}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          accent={COLORS.accent}
          secondary={COLORS.secondary}
          primary={COLORS.primary}
        />
      </div>
      {/* Error and global overlays */}
      {saving && <div className="OverlayInfo">Saving...</div>}
      {error && <div className="OverlayError">{error}</div>}
    </div>
  );
}

// --- Header bar ---
// PUBLIC_INTERFACE
function HeaderBar({ onNew, theme, onTheme, accent, primary }) {
  return (
    <header className="AppHeader" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <div className="AppTitle" style={{ color: primary }}>Notes Organizer</div>
      <div className="HeaderActions">
        <button className="btn-accent" title="New note" onClick={onNew}>
          +
        </button>
        <button className="btn-theme" onClick={onTheme} title={`${theme === "light" ? "Dark" : "Light"} mode`}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}

// --- Sidebar: note list, search bar ---
// PUBLIC_INTERFACE
function Sidebar({ notes, onSelect, selectedId, search, setSearch, onNew, loading, accent, primary }) {
  return (
    <aside className="AppSidebar" style={{ borderRight: `1px solid ${COLORS.border}` }}>
      <div className="SidebarHeader">
        <input
          className="SidebarSearch"
          type="search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="SidebarNewBtn" title="New note" onClick={onNew}>
          +
        </button>
      </div>
      <div className="NotesList">
        {loading ? (
          <div className="NotesListLoading">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="NotesListEmpty">No notes found.</div>
        ) : (
          notes.map((n) => (
            <SidebarNoteItem
              key={n.id}
              note={n}
              active={n.id === selectedId}
              onClick={() => onSelect(n.id)}
              accent={accent}
              primary={primary}
            />
          ))
        )}
      </div>
    </aside>
  );
}

// PUBLIC_INTERFACE
function SidebarNoteItem({ note, active, onClick, accent, primary }) {
  return (
    <div
      className={`SidebarNoteItem${active ? " active" : ""}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-selected={active}
      style={{
        borderLeft: active ? `4px solid ${accent}` : "4px solid transparent",
        background: note.pinned ? "rgba(255,64,129,0.08)" : "",
      }}
    >
      <div className="ItemHeader">
        <span className="ItemTitle">{note.title || "Untitled"}</span>{" "}
        {note.pinned && (
          <span className="ItemPin" title="Pinned" style={{ color: accent }}>
            📌
          </span>
        )}
      </div>
      <div className="ItemMeta">
        <span className="ItemDate">{formatDate(note.updatedAt)}</span>
        {note.tags && note.tags.length > 0 && (
          <span className="ItemTags">
            {note.tags.map((t) => (
              <span className="Tag" key={t}>
                {t}
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="ItemPreview">
        {note.content
          ? note.content.slice(0, 60) + (note.content.length > 60 ? "…" : "")
          : ""}
      </div>
    </div>
  );
}

// --- Main note editor/detail ---
// PUBLIC_INTERFACE
function NoteDetail({
  note,
  onUpdate,
  onDelete,
  onPin,
  onAddTag,
  onRemoveTag,
  accent,
  secondary,
  primary,
}) {
  const [editState, setEditState] = useState({ title: "", content: "" });
  const [editTags, setEditTags] = useState("");
  // Reset internal edit buffer on note change
  useEffect(() => {
    setEditState(note ? { title: note.title, content: note.content } : { title: "", content: "" });
    setEditTags("");
  }, [note?.id]);

  if (!note)
    return (
      <main className="NoteDetail NoteEmpty">
        <div className="NoteEmptyMsg">Select a note or create a new one.</div>
      </main>
    );

  // Apply updates if blurring or confirming
  const handleBlurOrSave = () => {
    if (
      editState.title !== note.title ||
      editState.content !== note.content
    ) {
      onUpdate(note.id, { title: editState.title, content: editState.content });
    }
  };

  // Add tag when pressing Enter
  const handleTagInputKey = (e) => {
    if (e.key === "Enter" && editTags.trim()) {
      onAddTag(note.id, editTags.trim());
      setEditTags("");
    }
  };

  return (
    <main className="NoteDetail">
      <div className="NoteDetailHeader">
        <input
          type="text"
          className="NoteTitleInput"
          value={editState.title}
          onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
          onBlur={handleBlurOrSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
          }}
          maxLength={128}
        />
        <div className="NoteActionBtns">
          <button
            className="btn-icon"
            title={note.pinned ? "Unpin" : "Pin"}
            onClick={() => onPin(note.id)}
            style={{ color: note.pinned ? accent : "#999" }}
          >
            📌
          </button>
          <button
            className="btn-icon"
            title="Delete note"
            style={{ color: secondary }}
            onClick={() => onDelete(note.id)}
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="NoteMeta">
        <span>
          Created:&nbsp;
          <span className="NoteMetaDate">{formatDate(note.createdAt)}</span>
        </span>
        <span>
          Updated:&nbsp;
          <span className="NoteMetaDate">{formatDate(note.updatedAt)}</span>
        </span>
        <span>
          {note.tags &&
            note.tags.map((tag) => (
              <span className="Tag TagActive" key={tag}>
                {tag}
                <button
                  className="btn-tag-del"
                  title="Remove tag"
                  onClick={() => onRemoveTag(note.id, tag)}
                >
                  ×
                </button>
              </span>
            ))}
          <input
            className="NoteTagInput"
            type="text"
            placeholder="Add tag…"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            onKeyDown={handleTagInputKey}
            maxLength={20}
          />
        </span>
      </div>
      <textarea
        className="NoteContentInput"
        value={editState.content}
        onChange={(e) => setEditState((s) => ({ ...s, content: e.target.value }))}
        onBlur={handleBlurOrSave}
        placeholder="Write your note here…"
        maxLength={4000}
      />
    </main>
  );
}
