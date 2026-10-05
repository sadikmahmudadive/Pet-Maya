/* Tele-vet video calls (browser side).
   Same signaling schema as the Flutter app: Firestore calls/{id} with
   callerCandidates / calleeCandidates sub-collections; media is peer-to-peer
   WebRTC. See functions/src/index.ts for the backend half. */

import {
  collection, doc, onSnapshot, addDoc, setDoc, runTransaction, getDoc, query, where,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';

export const RING_TIMEOUT_MS = 60_000;
const RECONNECT_GRACE_MS = 20_000;
const TERMINAL = ['declined', 'cancelled', 'missed', 'busy', 'ended'];

const FALLBACK_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

async function fetchIceServers() {
  try {
    const res = await httpsCallable(functions, 'get_ice_servers')();
    if (res.data?.iceServers?.length) return res.data.iceServers;
  } catch (e) {
    console.warn('get_ice_servers failed, using STUN only', e);
  }
  return FALLBACK_ICE;
}

function friendlyMediaError(e) {
  if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
    return 'Camera and microphone access was denied. Allow it in your browser permissions and try again.';
  }
  if (e?.name === 'NotFoundError') return 'No camera or microphone was found on this device.';
  if (e?.name === 'NotReadableError') return 'Your camera or microphone is being used by another app.';
  return 'Could not set up the call. Check your connection and try again.';
}

/** Subscribe to calls ringing for `uid`. Returns an unsubscribe function. */
export function subscribeIncomingCalls(uid, onChange) {
  const q = query(collection(db, 'calls'), where('calleeId', '==', uid), where('status', '==', 'ringing'));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const calls = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => !c.createdAtMs || now - c.createdAtMs < RING_TIMEOUT_MS);
    onChange(calls);
  }, (e) => console.warn('incoming call listener', e));
}

export async function declineCall(callId, uid) {
  await setStatus(callId, ['ringing'], 'declined', uid, 'declined');
}

async function setStatus(callId, from, to, uid, reason) {
  const ref = doc(db, 'calls', callId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists() || !from.includes(snap.data().status)) return;
      tx.update(ref, { status: to, endedAt: Date.now(), endedBy: uid, endReason: reason });
    });
  } catch (e) {
    console.warn(`call status -> ${to} failed`, e);
  }
}

/**
 * One call, either direction. Subscribe with `onChange(state)`; state is:
 * { phase, call, endReason, error, muted, videoOff, connectedAt, localStream, remoteStream }
 * phase: preparing | ringing | connecting | connected | reconnecting | ended
 */
export class WebCall {
  constructor({ callId, isCaller, uid }) {
    this.callId = callId;
    this.isCaller = isCaller;
    this.uid = uid;
    this.state = {
      phase: 'preparing', call: null, endReason: null, error: null,
      muted: false, videoOff: false, connectedAt: null,
      localStream: null, remoteStream: null,
    };
    this.listeners = new Set();
    this.pc = null;
    this.unsubs = [];
    this.pendingLocal = [];
    this.pendingRemote = [];
    this.docExists = false;
    this.remoteSet = false;
    this.closing = false;
    this.disposed = false;
  }

  get ref() { return doc(db, 'calls', this.callId); }
  get mine() { return this.isCaller ? 'callerCandidates' : 'calleeCandidates'; }
  get theirs() { return this.isCaller ? 'calleeCandidates' : 'callerCandidates'; }

  subscribe(fn) { this.listeners.add(fn); fn(this.state); return () => this.listeners.delete(fn); }
  set(patch) {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn(this.state));
  }

  static async startOutgoing({ uid, name, photo, calleeId, calleeName, petId, petName, appointmentId }) {
    const callRef = doc(collection(db, 'calls'));
    const c = new WebCall({ callId: callRef.id, isCaller: true, uid });
    try {
      await c.prepareMedia();
      await c.createPeer(await fetchIceServers());
      const offer = await c.pc.createOffer();
      await c.pc.setLocalDescription(offer);
      await setDoc(callRef, {
        callerId: uid, calleeId, callerName: name, calleeName: calleeName || '',
        ...(photo && photo.startsWith('http') ? { callerPhoto: photo } : {}),
        petId: petId || '', petName: petName || '', appointmentId: appointmentId || '',
        status: 'ringing', video: true, participants: [uid, calleeId],
        createdAt: serverTimestamp(), createdAtMs: Date.now(),
        offer: { type: offer.type, sdp: offer.sdp },
      });
      c.docExists = true;
      await c.flushLocal();
      c.set({ phase: 'ringing' });
      c.listenCall();
      c.listenCandidates();
      c.ringTimer = setTimeout(() => c.end(['ringing'], 'missed', 'timeout'), RING_TIMEOUT_MS);
    } catch (e) { c.fail(e); }
    return c;
  }

  static async answerIncoming({ callId, uid }) {
    const c = new WebCall({ callId, isCaller: false, uid });
    try {
      const snap = await getDoc(c.ref);
      if (!snap.exists()) throw new Error('This call no longer exists.');
      const call = { id: callId, ...snap.data() };
      c.set({ call });
      if (call.calleeId !== uid) throw new Error('This call is not for you.');
      if (call.status !== 'ringing') {
        c.set({ phase: 'ended', endReason: call.status === 'cancelled' || call.status === 'missed'
          ? 'The caller hung up before you answered.' : 'This call has already ended.' });
        return c;
      }
      await c.prepareMedia();
      await c.createPeer(await fetchIceServers());
      await c.pc.setRemoteDescription(call.offer);
      c.remoteSet = true;
      const answer = await c.pc.createAnswer();
      await c.pc.setLocalDescription(answer);
      c.docExists = true;
      await runTransaction(db, async (tx) => {
        const s = await tx.get(c.ref);
        if (s.data()?.status !== 'ringing') throw new Error('The caller hung up before you answered.');
        tx.update(c.ref, {
          status: 'accepted', answeredAt: Date.now(),
          answer: { type: answer.type, sdp: answer.sdp },
        });
      });
      await c.flushLocal();
      c.set({ phase: 'connecting' });
      c.listenCall();
      c.listenCandidates();
    } catch (e) { c.fail(e); }
    return c;
  }

  async prepareMedia() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Video calls are not supported in this browser.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
    });
    this.set({ localStream: stream });
  }

  async createPeer(iceServers) {
    const pc = new RTCPeerConnection({ iceServers, bundlePolicy: 'max-bundle' });
    this.pc = pc;
    this.state.localStream.getTracks().forEach((t) => pc.addTrack(t, this.state.localStream));

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const cand = e.candidate.toJSON();
      if (this.docExists) {
        addDoc(collection(this.ref, this.mine), cand).catch((err) => console.warn('candidate write', err));
      } else {
        this.pendingLocal.push(cand);
      }
    };
    pc.ontrack = (e) => {
      if (e.streams[0]) this.set({ remoteStream: e.streams[0] });
    };
    pc.oniceconnectionstatechange = () => {
      if (this.disposed || this.state.phase === 'ended') return;
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') {
        clearTimeout(this.reconnectTimer);
        this.set({ phase: 'connected', connectedAt: this.state.connectedAt || Date.now() });
      } else if (s === 'disconnected' && this.state.phase === 'connected') {
        this.set({ phase: 'reconnecting' });
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.hangUp('connection_lost'), RECONNECT_GRACE_MS);
      } else if (s === 'failed') {
        this.hangUp('connection_failed');
      }
    };
  }

  async flushLocal() {
    const pending = this.pendingLocal.splice(0);
    await Promise.all(pending.map((c) => addDoc(collection(this.ref, this.mine), c)));
  }

  listenCall() {
    this.unsubs.push(onSnapshot(this.ref, async (snap) => {
      if (!snap.exists() || this.disposed) return;
      const call = { id: this.callId, ...snap.data() };
      this.set({ call });
      if (this.isCaller && call.answer && !this.remoteSet && call.status === 'accepted') {
        clearTimeout(this.ringTimer);
        this.remoteSet = true;
        try {
          await this.pc.setRemoteDescription(call.answer);
          await this.drainRemote();
          this.set({ phase: 'connecting' });
        } catch (e) { this.fail(e); }
      }
      if (TERMINAL.includes(call.status) && this.state.phase !== 'ended') {
        this.set({ endReason: this.describeEnd(call) });
        this.teardown();
        this.set({ phase: 'ended' });
      }
    }, (e) => console.warn('call listener', e)));
  }

  listenCandidates() {
    this.unsubs.push(onSnapshot(collection(this.ref, this.theirs), (snap) => {
      snap.docChanges().forEach(async (ch) => {
        if (ch.type !== 'added') return;
        const cand = ch.doc.data();
        if (this.remoteSet) {
          try { await this.pc?.addIceCandidate(cand); } catch (e) { console.warn('addIceCandidate', e); }
        } else {
          this.pendingRemote.push(cand);
        }
      });
    }, (e) => console.warn('candidate listener', e)));
  }

  async drainRemote() {
    const pending = this.pendingRemote.splice(0);
    for (const c of pending) { try { await this.pc.addIceCandidate(c); } catch { /* stale candidate */ } }
  }

  describeEnd(call) {
    switch (call.status) {
      case 'declined': return this.isCaller ? 'The vet is unavailable right now and declined the call.' : 'Call declined.';
      case 'busy': return 'The other party is on another call. Please try again shortly.';
      case 'missed': return this.isCaller ? 'No answer. Please try again or book an appointment.' : 'Call missed.';
      case 'cancelled': return 'The caller hung up.';
      default:
        return ['connection_lost', 'connection_failed'].includes(call.endReason)
          ? 'The connection was lost.' : 'Call ended.';
    }
  }

  toggleMute() {
    const muted = !this.state.muted;
    this.state.localStream?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    this.set({ muted });
  }

  toggleVideo() {
    const videoOff = !this.state.videoOff;
    this.state.localStream?.getVideoTracks().forEach((t) => { t.enabled = !videoOff; });
    this.set({ videoOff });
  }

  async end(from, to, reason) {
    await setStatus(this.callId, from, to, this.uid, reason);
  }

  /** Cancel / decline / end depending on where the call is. */
  async hangUp(reason = 'user') {
    if (this.closing || this.state.phase === 'ended') return;
    this.closing = true;
    const status = this.state.call?.status || (this.isCaller ? 'ringing' : 'accepted');
    if (status === 'ringing') await this.end(['ringing'], this.isCaller ? 'cancelled' : 'declined', reason);
    else if (status === 'accepted') await this.end(['accepted'], 'ended', reason);
    if (!this.state.endReason) this.set({ endReason: 'Call ended.' });
    this.teardown();
    this.set({ phase: 'ended' });
  }

  teardown() {
    clearTimeout(this.ringTimer);
    clearTimeout(this.reconnectTimer);
    this.state.localStream?.getTracks().forEach((t) => t.stop());
    try { this.pc?.close(); } catch { /* already closed */ }
    this.pc = null;
    this.unsubs.splice(0).forEach((u) => u());
  }

  fail(e) {
    console.warn('call error', e);
    const msg = e?.name ? friendlyMediaError(e) : (e?.message || friendlyMediaError(e));
    this.teardown();
    if (this.isCaller && this.docExists) this.end(['ringing', 'accepted'], 'ended', 'error');
    this.set({ error: msg, endReason: msg, phase: 'ended' });
  }

  dispose() {
    if (this.state.phase !== 'ended') this.hangUp();
    this.teardown();
    this.disposed = true;
    this.listeners.clear();
  }
}
