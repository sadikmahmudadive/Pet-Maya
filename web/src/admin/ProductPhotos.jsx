import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, storage, ref, uploadBytesResumable, getDownloadURL } from '../config/firebase';
import { Icon, Button } from '../ui/index.jsx';
import { cx } from '../lib/format.js';
import { validateUpload, ownUploadPath } from '../lib/security.js';
import { prepareImage } from './imageTools.js';
import { MAX_PHOTOS, cleanPhotoUrl } from './productForm.js';

const PARALLEL = 3;
let seq = 0;
const newKey = () => `ph${Date.now().toString(36)}${(seq += 1)}`;
const fileId = (f) => `${f.name}|${f.size}|${f.lastModified}`;

/**
 * Multi-photo manager: drag & drop or choose several files, upload with progress (3 at a time), make any photo the
 * cover, reorder, remove, retry failures, or add a photo by https link. The first photo is the cover.
 *
 * It owns the working list; the form hears about it through onChange(urls, busy, failed): `urls` are the finished photos
 * in order, `busy` is true while anything is still uploading, `failed` counts photos that did not upload. Re-key it (key={productId}) to load a different product.
 */
export default function ProductPhotos({ value = [], onChange, max = MAX_PHOTOS, toast }) {
  const [items, setItems] = useState(() => value.map((url) => ({ key: newKey(), url, status: 'done' })));
  const [over, setOver] = useState(false);
  const [link, setLink] = useState('');
  const inputRef = useRef(null);
  const tasks = useRef(new Map());   // key → UploadTask (so a tile can be cancelled)
  const queue = useRef([]);
  const running = useRef(0);
  const seen = useRef(new Set()); // files already added (same name, size and date), so a double drop is ignored
  const report = useRef(onChange);
  report.current = onChange;
  const notify = (msg, tone = 'error') => toast?.(msg, { tone });

  useEffect(() => {
    report.current?.(items.filter((i) => i.status === 'done').map((i) => i.url), items.some((i) => i.status === 'uploading'), items.filter((i) => i.status === 'error').length);
  }, [items]);
  useEffect(() => () => { // leaving the page: stop uploads and free previews
    tasks.current.forEach((t) => { try { t.cancel(); } catch { /* already finished */ } });
  }, []);

  const patch = (key, p) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const upload = async (key, file) => {
    try {
      const uid = auth?.currentUser?.uid;
      const prepared = await prepareImage(file);
      const type = await validateUpload(prepared, 'image');
      if (!storage) { patch(key, { url: URL.createObjectURL(prepared), status: 'done', progress: 1 }); return; } // local preview only
      if (!uid) throw new Error('Sign in again to upload photos.');
      const r = ref(storage, ownUploadPath('shop_products', uid, type.ext));
      const task = uploadBytesResumable(r, prepared, { contentType: type.contentType });
      tasks.current.set(key, task);
      task.on('state_changed', (s) => patch(key, { progress: s.totalBytes ? s.bytesTransferred / s.totalBytes : 0 }));
      await task;
      const url = await getDownloadURL(task.snapshot.ref);
      patch(key, { url, status: 'done', progress: 1, error: '' });
    } catch (e) {
      if (e?.code === 'storage/canceled') return;
      const permission = /unauthorized|permission/i.test(String(e?.code || e?.message));
      patch(key, { status: 'error', error: permission ? 'You do not have permission to upload photos.' : (e?.message && !e.code ? e.message : 'Upload failed. Check your connection and retry.') });
    } finally {
      tasks.current.delete(key);
    }
  };

  const pump = () => {
    while (running.current < PARALLEL && queue.current.length) {
      const { key, file } = queue.current.shift();
      running.current += 1;
      upload(key, file).finally(() => { running.current -= 1; pump(); });
    }
  };
  const enqueue = (key, file) => { queue.current.push({ key, file }); pump(); };

  const addFiles = (fileList) => {
    const files = [...(fileList || [])].filter((f) => f && f.size !== undefined);
    if (!files.length) return;
    const room = Math.max(0, max - items.length);
    const fresh = files.filter((f) => !seen.current.has(fileId(f)));
    const dupes = files.length - fresh.length;
    const take = fresh.slice(0, room);
    if (take.length < fresh.length) notify(`Only ${max} photos fit. ${fresh.length - take.length} not added.`);
    if (dupes) notify(`${dupes} photo${dupes > 1 ? 's were' : ' was'} already added.`, 'info');
    if (!take.length) return;
    const added = take.map((file) => { seen.current.add(fileId(file)); return { key: newKey(), file, fid: fileId(file), name: file.name, url: URL.createObjectURL(file), status: 'uploading', progress: 0 }; });
    setItems((list) => [...list, ...added]);
    added.forEach((it) => enqueue(it.key, it.file));
  };

  const addLink = () => {
    const url = cleanPhotoUrl(link);
    if (!url) { notify('Paste a full photo link starting with https://'); return; }
    if (items.length >= max) { notify(`Only ${max} photos fit.`); return; }
    if (items.some((i) => i.url === url)) { notify('That photo is already added.', 'info'); return; }
    setItems((list) => [...list, { key: newKey(), url, status: 'done' }]);
    setLink('');
  };

  const retry = (it) => { patch(it.key, { status: 'uploading', progress: 0, error: '' }); if (it.file) enqueue(it.key, it.file); };
  const remove = (it) => {
    const t = tasks.current.get(it.key);
    if (t) { try { t.cancel(); } catch { /* done */ } }
    queue.current = queue.current.filter((q) => q.key !== it.key);
    if (it.fid) seen.current.delete(it.fid);
    if (it.file && it.url?.startsWith('blob:') && it.status !== 'done') URL.revokeObjectURL(it.url);
    setItems((list) => list.filter((i) => i.key !== it.key));
  };
  const move = (idx, dir) => setItems((list) => {
    const to = idx + dir;
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    [next[idx], next[to]] = [next[to], next[idx]];
    return next;
  });
  const makeCover = (idx) => setItems((list) => (idx <= 0 ? list : [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)]));

  const uploading = items.filter((i) => i.status === 'uploading').length;
  const failed = items.filter((i) => i.status === 'error').length;
  const full = items.length >= max;
  const summary = useMemo(() => {
    const parts = [`${items.length} of ${max} photos`];
    if (uploading) parts.push(`${uploading} uploading…`);
    if (failed) parts.push(`${failed} failed`);
    return parts.join(' · ');
  }, [items.length, max, uploading, failed]);

  return (
    <div className="pp">
      <input
        ref={inputRef} type="file" accept="image/*" multiple hidden data-testid="photo-input"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
      <button
        type="button" disabled={full}
        className={cx('pp-drop', over && 'over')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!full) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!full) addFiles(e.dataTransfer?.files); }}
      >
        <Icon name="upload" size={22} />
        <b>{full ? 'Photo limit reached' : 'Drag photos here, or click to choose several'}</b>
        <span>JPEG, PNG, WebP, GIF or HEIC · up to {max} · big photos are resized automatically</span>
      </button>

      <div className="row between wrap gap-8" style={{ margin: '10px 0 6px' }}>
        <span className="sub" role="status" aria-live="polite">{summary}{items.length > 1 && ' · the first photo is the cover'}</span>
      </div>

      {items.length > 0 && (
        <ul className="pp-grid" aria-label="Product photos">
          {items.map((it, idx) => (
            <li key={it.key} className={cx('pp-tile', it.status === 'error' && 'bad')}>
              <img src={it.url} alt={`Photo ${idx + 1}${idx === 0 ? ' (cover)' : ''}`} />
              {idx === 0 && <span className="pp-cover">Cover</span>}
              {it.status === 'uploading' && (
                <div className="pp-prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((it.progress || 0) * 100)}>
                  <span style={{ width: `${Math.max(6, Math.round((it.progress || 0) * 100))}%` }} />
                </div>
              )}
              {it.status === 'error' && (
                <div className="pp-err">
                  <span>{it.error}</span>
                  <div className="row gap-6">
                    {it.file && <button type="button" onClick={() => retry(it)}>Retry</button>}
                    <button type="button" onClick={() => remove(it)}>Remove</button>
                  </div>
                </div>
              )}
              {it.status !== 'error' && (
                <div className="pp-actions">
                  <button type="button" aria-label={`Move photo ${idx + 1} earlier`} disabled={idx === 0} onClick={() => move(idx, -1)}><Icon name="chevronLeft" size={14} /></button>
                  {idx > 0 && <button type="button" aria-label={`Make photo ${idx + 1} the cover`} title="Make cover" onClick={() => makeCover(idx)}><Icon name="star" size={14} /></button>}
                  <button type="button" aria-label={`Move photo ${idx + 1} later`} disabled={idx === items.length - 1} onClick={() => move(idx, 1)}><Icon name="chevronRight" size={14} /></button>
                  <button type="button" aria-label={`Remove photo ${idx + 1}`} onClick={() => remove(it)}><Icon name="x" size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="row gap-8" style={{ marginTop: 12 }}>
        <input
          className="input grow" value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste a photo link (https://)"
          aria-label="Photo link" disabled={full}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
        />
        <Button variant="outline" onClick={addLink} disabled={full || !link.trim()}>Add link</Button>
      </div>
    </div>
  );
}
