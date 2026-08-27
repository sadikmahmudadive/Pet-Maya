import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Quote, List, ListOrdered,
  Code, Minus, Link2, Image, X, Send, ChevronLeft,
  Save, Clock, Type, AlignLeft, Eye, EyeOff
} from 'lucide-react';
import { db, collection, addDoc, storage, ref, uploadBytesResumable, getDownloadURL } from '../../config/firebase';

const CATEGORIES = ['Health', 'Nutrition', 'Training', 'Lifestyle'];
const CATEGORY_COLORS = {
  Health: '#10B981', Nutrition: '#F59E0B',
  Training: '#3B82F6', Lifestyle: '#EC4899'
};

const DRAFT_KEY = 'pm_blog_draft';

// ── Toolbar button component ─────────────────────────────
function FmtBtn({ title, icon: Icon, cmd, value, onClick, active }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) { onClick(); return; }
    document.execCommand(cmd, false, value || null);
  };
  return (
    <button
      onMouseDown={handleClick}
      title={title}
      style={{
        width: 32, height: 32, border: 'none', borderRadius: '8px', cursor: 'pointer',
        background: active ? 'var(--primary-tint)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease', flexShrink: 0
      }}
      onMouseEnter={e => e.currentTarget.style.background = active ? 'var(--primary-tint)' : 'var(--surface-alt)'}
      onMouseLeave={e => e.currentTarget.style.background = active ? 'var(--primary-tint)' : 'transparent'}
    >
      <Icon size={15} />
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0, margin: '0 4px' }} />;
}

// ── Main Editor Component ────────────────────────────────
export default function ArticleEditor({ onClose, onPublished, showToast }) {
  const { currentUser } = useAuth();

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const imageUrlRef = useRef(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(false);
  const [category, setCategory] = useState('Health');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const [selectionLink, setSelectionLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // ── Load draft on mount ──────────────────────────────
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.title) setTitle(d.title);
        if (d.imageUrl) { setImageUrl(d.imageUrl); setImagePreview(true); }
        if (d.category) setCategory(d.category);
        if (d.tags) setTags(d.tags);
        if (d.html && editorRef.current) editorRef.current.innerHTML = d.html;
        updateStats();
      } catch {}
    }
    editorRef.current?.focus();
  }, []);

  // ── Auto-save draft every 3 seconds ─────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!title && !editorRef.current?.innerText?.trim()) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title, imageUrl, category, tags,
        html: editorRef.current?.innerHTML || ''
      }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, imageUrl, category, tags]);

  // ── Update word count & read time ───────────────────
  const updateStats = useCallback(() => {
    const text = editorRef.current?.innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
    setReadTime(Math.max(1, Math.ceil(words / 200)));

    // Detect active formats
    const bold = document.queryCommandState('bold');
    const italic = document.queryCommandState('italic');
    const underline = document.queryCommandState('underline');
    setActiveFormats({ bold, italic, underline });
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
  };

  // ── Insert heading ──────────────────────────────────
  const insertHeading = (level) => {
    document.execCommand('formatBlock', false, `h${level}`);
    editorRef.current?.focus();
  };

  // ── Insert blockquote ────────────────────────────────
  const insertQuote = () => {
    document.execCommand('formatBlock', false, 'blockquote');
    editorRef.current?.focus();
  };

  // ── Insert horizontal rule ───────────────────────────
  const insertHR = () => {
    document.execCommand('insertHorizontalRule', false, null);
    editorRef.current?.focus();
  };

  // ── Insert code block ────────────────────────────────
  const insertCode = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const code = document.createElement('code');
      code.style.cssText = 'background:var(--surface-alt);padding:2px 6px;border-radius:5px;font-family:monospace;font-size:0.9em';
      range.surroundContents(code);
      sel.removeAllRanges();
    }
    editorRef.current?.focus();
  };

  // ── Insert link ──────────────────────────────────────
  const insertLink = () => {
    if (selectionLink) {
      document.execCommand('createLink', false, selectionLink);
      setShowLinkInput(false);
      setSelectionLink('');
      editorRef.current?.focus();
    }
  };

  // ── Add tag ─────────────────────────────────────────
  const addTag = (val) => {
    const tag = val.replace(/,/g, '').trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const [coverFile, setCoverFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Validate image URL ───────────────────────────────
  const handleImageUrl = (url) => {
    setCoverFile(null); // Clear any pending local file
    setImageUrl(url);
    if (url.trim()) {
      setImagePreview(true);
    } else {
      setImagePreview(false);
    }
  };

  // ── Select Image File from Device (Local Preview Only) ──
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP, etc.)', 'error');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image must be less than 10MB', 'error');
      return;
    }

    // Keep the File object in memory - DO NOT upload to Storage yet
    setCoverFile(file);

    // Instant local preview so the user immediately sees their photo
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImageUrl(uploadEvent.target.result);
        setImagePreview(true);
      }
    };
    reader.readAsDataURL(file);

    showToast('📸 Cover image selected! It will save when you publish.', 'info');
  };

  // ── Helper: Upload Cover to Firebase Storage on Publish ──
  const uploadCoverToStorage = async (file) => {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `blogs/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          }
        },
        (error) => {
          console.warn('[Firebase Storage] Upload notice:', error);
          // If storage upload fails, return base64 / fallback
          resolve(null);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err) {
            console.warn('[Firebase Storage] Get URL error:', err);
            resolve(null);
          }
        }
      );
    });
  };

  // ── Publish (Uploads Cover File only on submit) ───────
  const handlePublish = async () => {
    const htmlContent = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';

    if (!title.trim()) { showToast('Please add a title', 'error'); return; }
    if (plainText.trim().length < 50) { showToast('Content is too short (min 50 characters)', 'error'); return; }
    if (!currentUser || currentUser.uid?.startsWith('demo_guest')) {
      showToast('🔒 Sign in to publish articles', 'info'); return;
    }

    const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'admin' || currentUser?.email === 'admin@petmaya.app';
    const status = isAdmin ? 'APPROVED' : 'PENDING';
    const isApproved = isAdmin ? true : false;

    setIsSubmitting(true);

    let finalImageUrl = imageUrl.trim();

    // If user selected a local cover file from device, upload it now!
    if (coverFile) {
      try {
        setIsUploading(true);
        const uploadedUrl = await uploadCoverToStorage(coverFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      } catch (err) {
        console.warn('Cover upload skipped:', err);
      } finally {
        setIsUploading(false);
      }
    }

    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800';
    }

    try {
      await addDoc(collection(db, 'blogs'), {
        title: title.trim(),
        content: plainText.trim(),
        htmlContent: htmlContent,
        category,
        imageUrl: finalImageUrl,
        authorId: currentUser.uid,
        authorName: currentUser.name || currentUser.displayName || 'Pet Maya User',
        authorPhoto: currentUser.photoUrl || null,
        timestamp: Date.now(),
        readTimeMinutes: readTime,
        tags,
        status,
        isApproved
      });
      localStorage.removeItem(DRAFT_KEY);
      showToast(
        isAdmin 
          ? '🎉 Article published directly to community feed!' 
          : '📝 Article submitted for review! It will be live on web & app once approved by an admin.', 
        'success'
      );
      onPublished?.();
      onClose();
    } catch (err) {
      showToast('Failed to publish. Please try again.', 'error');
    }
    setIsSubmitting(false);
  };

  const canPublish = title.trim().length > 5 && (editorRef.current?.innerText?.trim()?.length || 0) >= 50;
  const catColor = CATEGORY_COLORS[category] || '#10B981';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* ── TOP BAR ────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        flexShrink: 0, zIndex: 10, gap: '16px'
      }}>
        {/* Left: Back + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ background: 'var(--surface-alt)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>New Article</span>
          <AnimatePresence>
            {draftSaved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Save size={11} /> Draft saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Stats + Preview + Publish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={12} /> {wordCount} words
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {readTime} min read
          </span>
          <button
            onClick={() => setPreviewMode(p => !p)}
            style={{ background: 'var(--surface-alt)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isSubmitting || !canPublish}
            style={{
              background: canPublish ? catColor : 'var(--surface-alt)',
              color: canPublish ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: '12px', padding: '8px 20px',
              cursor: canPublish ? 'pointer' : 'not-allowed',
              fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={14} />
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── RICH TEXT TOOLBAR ───────────────────────────── */}
      {!previewMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 24px',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          flexShrink: 0, flexWrap: 'wrap', overflowX: 'auto'
        }}>
          <FmtBtn title="Bold (Ctrl+B)" icon={Bold} cmd="bold" active={activeFormats.bold} />
          <FmtBtn title="Italic (Ctrl+I)" icon={Italic} cmd="italic" active={activeFormats.italic} />
          <FmtBtn title="Underline (Ctrl+U)" icon={Underline} cmd="underline" active={activeFormats.underline} />
          <FmtBtn title="Strikethrough" icon={Strikethrough} cmd="strikeThrough" />
          <Divider />
          <FmtBtn title="Heading 1" icon={Heading1} onClick={() => insertHeading(1)} />
          <FmtBtn title="Heading 2" icon={Heading2} onClick={() => insertHeading(2)} />
          <FmtBtn title="Heading 3" icon={Heading3} onClick={() => insertHeading(3)} />
          <Divider />
          <FmtBtn title="Blockquote" icon={Quote} onClick={insertQuote} />
          <FmtBtn title="Bullet List" icon={List} cmd="insertUnorderedList" />
          <FmtBtn title="Numbered List" icon={ListOrdered} cmd="insertOrderedList" />
          <Divider />
          <FmtBtn title="Inline Code" icon={Code} onClick={insertCode} />
          <FmtBtn title="Divider Line" icon={Minus} onClick={insertHR} />
          <Divider />
          {/* Link input */}
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(v => !v); }}
            title="Insert Link"
            style={{ width: 32, height: 32, border: 'none', borderRadius: '8px', cursor: 'pointer', background: showLinkInput ? 'var(--primary-tint)' : 'transparent', color: showLinkInput ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Link2 size={15} />
          </button>
          <AnimatePresence>
            {showLinkInput && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '220px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                style={{ overflow: 'hidden', display: 'flex', gap: '4px', alignItems: 'center' }}
              >
                <input
                  autoFocus
                  type="url"
                  placeholder="https://..."
                  value={selectionLink}
                  onChange={e => setSelectionLink(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && insertLink()}
                  style={{
                    flex: 1, height: 32, borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--surface-alt)', color: 'var(--text-main)',
                    padding: '0 10px', fontSize: '12px', outline: 'none'
                  }}
                />
                <button onMouseDown={insertLink} style={{ height: 32, padding: '0 10px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>Apply</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── WRITING AREA ───────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '760px', padding: '0 24px 120px' }}>

          {/* Cover Image */}
          {imageUrl ? (
            <div style={{ position: 'relative', marginBottom: '32px', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
              <img
                src={imageUrl}
                alt="Cover"
                style={{ width: '100%', maxHeight: '320px', minHeight: '180px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  console.warn('Cover image load error for:', imageUrl);
                }}
              />
              <div style={{ 
                position: 'absolute', 
                top: 14, 
                right: 14, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(10px)',
                padding: '6px 12px',
                borderRadius: '999px'
              }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Image size={13} />
                  <span>Change Photo</span>
                </button>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
                <button
                  onClick={() => { setImageUrl(''); setCoverFile(null); setImagePreview(false); }}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={13} />
                  <span>Remove</span>
                </button>
              </div>

              {/* URL preview subtitle bar */}
              <div style={{ padding: '8px 16px', background: 'var(--surface-alt)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  🔗 {coverFile ? `Device photo selected: ${coverFile.name} (uploads upon publish)` : (imageUrl.startsWith('data:') ? 'Local file selected' : imageUrl)}
                </span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Cover Ready</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                border: '1.5px dashed var(--border)', 
                borderRadius: '20px', 
                background: 'var(--surface-alt)',
                overflow: 'hidden',
                alignItems: 'center',
                transition: 'border-color 0.2s ease'
              }}>
                <div
                  style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'text' }}
                  onClick={() => imageUrlRef.current?.focus()}
                >
                  <Image size={18} color="var(--primary)" />
                  <input
                    ref={imageUrlRef}
                    type="text"
                    placeholder="Paste cover image URL (https://...)..."
                    value={imageUrl}
                    onChange={e => handleImageUrl(e.target.value)}
                    style={{ 
                      flex: 1, 
                      background: 'none', 
                      border: 'none', 
                      outline: 'none', 
                      color: 'var(--text-main)', 
                      fontSize: '13.5px', 
                      fontStyle: imageUrl ? 'normal' : 'normal' 
                    }}
                  />
                </div>

                <div style={{ height: '32px', width: '1px', background: 'var(--border)' }} />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{ 
                    background: 'transparent', 
                    color: 'var(--primary)', 
                    border: 'none', 
                    padding: '0 24px', 
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontWeight: 700, 
                    fontSize: '13.5px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    height: '54px'
                  }}
                >
                  {isUploading ? (
                    <span>Uploading {uploadProgress}%...</span>
                  ) : (
                    <>
                      <span>📁 Upload File</span>
                    </>
                  )}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          )}

          {/* Metadata strip (category + tags) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Category selector - pill style */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    background: category === cat ? catColor : 'var(--surface-alt)',
                    color: category === cat ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div
            style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: '12px', cursor: 'text' }}
            onClick={() => document.getElementById('pm-tag-input')?.focus()}
          >
            {tags.map(tag => (
              <span
                key={tag}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: `${catColor}1A`, color: catColor, padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'default' }}
              >
                #{tag}
                <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: catColor, display: 'flex', lineHeight: 1 }}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              id="pm-tag-input"
              type="text"
              placeholder={tags.length === 0 ? 'Add tags (press Enter)...' : ''}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput && addTag(tagInput)}
              style={{ flex: 1, minWidth: '120px', background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '13px' }}
            />
          </div>

          {/* Title */}
          <textarea
            rows={2}
            placeholder="Your article title..."
            value={title}
            onChange={e => { setTitle(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden',
              fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: 1.15, color: 'var(--text-main)', marginBottom: '24px',
              fontFamily: 'inherit'
            }}
          />

          {/* Rich Content Editor */}
          {previewMode ? (
            <div
              style={{ fontSize: '17px', lineHeight: 1.75, color: 'var(--text-main)', minHeight: '300px' }}
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '<em style="color:var(--text-muted)">Nothing written yet...</em>' }}
              className="article-preview"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={updateStats}
              onKeyUp={updateStats}
              onMouseUp={updateStats}
              onKeyDown={handleKeyDown}
              data-placeholder="Start writing your story..."
              style={{
                minHeight: '400px', outline: 'none', fontSize: '17px', lineHeight: 1.75,
                color: 'var(--text-main)', caretColor: catColor
              }}
              className="article-editor-body"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
