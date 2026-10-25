import { useEffect, useMemo, useState } from 'react';
import { useCollection, useDoc, saveDoc, patchDoc } from '../../data/firestore.js';
import { PageHead } from '../AdminApp.jsx';
import { Icon, Button, Pill, Stat, Empty, Field, Avatar, Ph } from '../../ui/index.jsx';
import { cx, ago, shortDate } from '../../lib/format.js';
import { useStore } from '../../lib/store.jsx';
import { moderationDecide } from '../../data/actions.js';

export default function Moderation({ user }) {
  const { toast } = useStore();
  const [tab, setTab] = useState('pending'); // 'pending' | 'reports' | 'strikes' | 'settings'

  // Subscriptions to moderation collections
  const pendingQuery = useCollection('community_pending', { sampleWhenEmpty: false });
  const reportsQuery = useCollection('community_reports', { sampleWhenEmpty: false });
  const strikesQuery = useCollection('moderation_strikes', { sampleWhenEmpty: false });
  const settingsDoc = useDoc('settings', 'moderation');

  // Pending item selection
  const [selectedPendingId, setSelectedPendingId] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    enableWordFilter: true,
    enableSpamRules: true,
    enableAiSafety: true,
    enableAiRelevance: true,
    blockedWordsText: '',
    softWordsText: '',
    allowedWordsText: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (settingsDoc.data) {
      setSettingsForm({
        enableWordFilter: settingsDoc.data.enableWordFilter ?? true,
        enableSpamRules: settingsDoc.data.enableSpamRules ?? true,
        enableAiSafety: settingsDoc.data.enableAiSafety ?? true,
        enableAiRelevance: settingsDoc.data.enableAiRelevance ?? true,
        blockedWordsText: (settingsDoc.data.blockedWords || []).join(', '),
        softWordsText: (settingsDoc.data.softWords || []).join(', '),
        allowedWordsText: (settingsDoc.data.allowedWords || []).join(', '),
      });
    }
  }, [settingsDoc.data]);

  const pendingItems = useMemo(() => {
    return [...(pendingQuery.items || [])].sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
  }, [pendingQuery.items]);

  const reportsList = useMemo(() => {
    return [...(reportsQuery.items || [])].sort((a, b) => (b.updatedAt || b.lastReportedAt || 0) - (a.updatedAt || a.lastReportedAt || 0));
  }, [reportsQuery.items]);

  const strikesList = useMemo(() => {
    return [...(strikesQuery.items || [])].sort((a, b) => (b.strikeCount || 0) - (a.strikeCount || 0));
  }, [strikesQuery.items]);

  const activeSuspensions = useMemo(() => {
    const now = Date.now();
    return strikesList.filter((s) => (s.suspendedUntil || 0) > now).length;
  }, [strikesList]);

  const selectedPending = pendingItems.find((p) => p.id === selectedPendingId) || pendingItems[0];

  const handleDecision = async (action) => {
    if (!selectedPending) return;
    setBusy(true);
    try {
      const res = await moderationDecide({
        pendingId: selectedPending.id,
        action,
        reason: decisionReason.trim() || undefined,
      });
      if (res.ok) {
        toast(res.message || `Content ${action.toLowerCase()}d`);
        setDecisionReason('');
        setSelectedPendingId(null);
      } else {
        toast(res.message || `Failed to ${action.toLowerCase()} item`, { tone: 'error' });
      }
    } catch (err) {
      toast(err.message || 'Error processing decision', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleLiftStrike = async (strikeItem) => {
    try {
      await patchDoc('moderation_strikes', strikeItem.id, {
        strikeCount: 0,
        suspendedUntil: null,
        liftedAt: Date.now(),
        liftedBy: user?.name || 'Admin',
      });
      await patchDoc('users', strikeItem.id, {
        postingSuspendedUntil: null,
      });
      toast(`Strikes lifted for user ${strikeItem.id}`);
    } catch (err) {
      toast(err.message || 'Could not lift strike', { tone: 'error' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const blocked = settingsForm.blockedWordsText.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
      const soft = settingsForm.softWordsText.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
      const allowed = settingsForm.allowedWordsText.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);

      await saveDoc('settings', 'moderation', {
        enableWordFilter: settingsForm.enableWordFilter,
        enableSpamRules: settingsForm.enableSpamRules,
        enableAiSafety: settingsForm.enableAiSafety,
        enableAiRelevance: settingsForm.enableAiRelevance,
        blockedWords: blocked,
        softWords: soft,
        allowedWords: allowed,
        updatedBy: user?.name || 'Admin',
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      toast('Moderation settings updated');
    } catch (err) {
      toast(err.message || 'Failed to update settings', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead eyebrow="Community Trust & Safety" title="Content moderation">
        <div className="row gap-8">
          <Pill tone={settingsForm.enableAiRelevance ? 'teal' : 'amber'}>
            <Icon name="shield" size={13} /> AI Shield {settingsForm.enableAiRelevance ? 'Active' : 'Bypassed'}
          </Pill>
        </div>
      </PageHead>

      <div className="stat-grid">
        <Stat
          label="Pending review"
          value={pendingItems.length}
          icon="clock"
          delta={pendingItems.length > 5 ? `${pendingItems.length} awaiting` : 'On track'}
          deltaTone={pendingItems.length > 5 ? 'red' : 'teal'}
        />
        <Stat
          label="Flagged reports"
          value={reportsList.length}
          icon="flag"
          note="from community members"
        />
        <Stat
          label="Active strikes"
          value={strikesList.reduce((acc, s) => acc + (s.strikeCount || 0), 0)}
          icon="alert"
          note={`${strikesList.length} users with strikes`}
        />
        <Stat
          label="Suspensions"
          value={activeSuspensions}
          icon="lock"
          deltaTone={activeSuspensions > 0 ? 'red' : 'teal'}
          note="posting restricted"
        />
      </div>

      <div className="card tight" style={{ marginTop: 20 }}>
        <div className="row gap-4" style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
          <button
            type="button"
            className={cx('btn btn-sm', tab === 'pending' ? 'btn-teal' : 'btn-ghost')}
            onClick={() => setTab('pending')}
          >
            Pending review ({pendingItems.length})
          </button>
          <button
            type="button"
            className={cx('btn btn-sm', tab === 'reports' ? 'btn-teal' : 'btn-ghost')}
            onClick={() => setTab('reports')}
          >
            Reported content ({reportsList.length})
          </button>
          <button
            type="button"
            className={cx('btn btn-sm', tab === 'strikes' ? 'btn-teal' : 'btn-ghost')}
            onClick={() => setTab('strikes')}
          >
            Strikes & suspensions ({strikesList.length})
          </button>
          <button
            type="button"
            className={cx('btn btn-sm', tab === 'settings' ? 'btn-teal' : 'btn-ghost')}
            onClick={() => setTab('settings')}
          >
            Safety filter settings
          </button>
        </div>

        {tab === 'pending' && (
          <div style={{ padding: 16 }}>
            {pendingItems.length === 0 ? (
              <Empty icon="check" title="Review queue is empty">
                All community posts and comments have passed automated checks or been reviewed.
              </Empty>
            ) : (
              <div className="adm-grid-3">
                <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
                  <h3 className="h-card" style={{ fontSize: 15, marginBottom: 12 }}>Items awaiting decision</h3>
                  <div className="stack gap-8">
                    {pendingItems.map((item) => {
                      const isSel = selectedPending?.id === item.id;
                      const flags = (item.moderationResult?.flags || item.flags || []);
                      return (
                        <div
                          key={item.id}
                          className={cx('card tight tap', isSel && 'active')}
                          style={{
                            padding: 12,
                            borderColor: isSel ? 'var(--teal)' : 'var(--line)',
                            background: isSel ? 'var(--teal-tint)' : 'var(--surface)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedPendingId(item.id)}
                        >
                          <div className="row between">
                            <span className="mono sub" style={{ fontSize: 11 }}>
                              {item.type === 'comment' ? 'Comment' : 'Post'} · {ago(item.timestamp || item.createdAt)}
                            </span>
                            <Pill sm tone={flags.length ? 'amber' : 'neutral'}>
                              {item.moderationResult?.verdict || 'PENDING'}
                            </Pill>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                            {item.userName || item.author || 'User'}
                          </div>
                          <p className="sub" style={{ fontSize: 12, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.content || item.text || '(No text)'}
                          </p>
                          {flags.length > 0 && (
                            <div className="row gap-4 wrap" style={{ marginTop: 6 }}>
                              {flags.slice(0, 2).map((fl, idx) => (
                                <Pill key={idx} sm tone="amber" style={{ fontSize: 10 }}>{fl}</Pill>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPending && (
                  <div className="card stack gap-14" style={{ gridColumn: 'span 2' }}>
                    <div className="row between">
                      <div>
                        <div className="eyebrow teal">Inspection details</div>
                        <h3 className="h-card" style={{ fontSize: 18, marginTop: 4 }}>
                          {selectedPending.type === 'comment' ? 'Comment by' : 'Post by'} {selectedPending.userName || selectedPending.author || 'User'}
                        </h3>
                        <div className="sub" style={{ fontSize: 12 }}>
                          User ID: <span className="mono">{selectedPending.userId || selectedPending.authorId}</span> · Submitted {ago(selectedPending.timestamp || selectedPending.createdAt)}
                        </div>
                      </div>
                      <Pill tone="amber" icon="clock">Pending review</Pill>
                    </div>

                    <div className="card tight" style={{ background: 'var(--surface-sunken)', padding: 14 }}>
                      <div className="sub" style={{ fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>Content preview</div>
                      <div style={{ fontSize: 14.5, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {selectedPending.content || selectedPending.text || 'No text content'}
                      </div>
                      {selectedPending.imageUrl && (
                        <div style={{ marginTop: 12 }}>
                          <Ph src={selectedPending.imageUrl} label="Attached image" style={{ maxHeight: 240, borderRadius: 8 }} />
                        </div>
                      )}
                    </div>

                    {/* Moderation Scan Diagnostics */}
                    <div className="card tight" style={{ padding: 14 }}>
                      <div className="sub" style={{ fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Moderation diagnostics</div>
                      <div className="stack gap-6">
                        <div className="row between" style={{ fontSize: 13 }}>
                          <span>Word Filter status</span>
                          <b>{selectedPending.moderationResult?.wordFilterPassed === false ? '❌ Flagged words' : '✅ Clear'}</b>
                        </div>
                        <div className="row between" style={{ fontSize: 13 }}>
                          <span>Spam Rules status</span>
                          <b>{selectedPending.moderationResult?.spamRulesPassed === false ? '❌ Violation detected' : '✅ Clear'}</b>
                        </div>
                        <div className="row between" style={{ fontSize: 13 }}>
                          <span>OpenAI Omni-Moderation</span>
                          <b>{selectedPending.moderationResult?.aiSafetyPassed === false ? '❌ Safety breach' : '✅ Safe'}</b>
                        </div>
                        <div className="row between" style={{ fontSize: 13 }}>
                          <span>Pet & Animal Relevance</span>
                          <b>{selectedPending.moderationResult?.aiRelevancePassed === false ? '❌ Off-topic' : '✅ Animal related'}</b>
                        </div>
                        {selectedPending.moderationResult?.aiRelevanceReason && (
                          <div className="sub" style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                            AI reasoning: “{selectedPending.moderationResult.aiRelevanceReason}”
                          </div>
                        )}
                        {(selectedPending.moderationResult?.flags || []).length > 0 && (
                          <div className="row gap-6 wrap" style={{ marginTop: 8 }}>
                            {selectedPending.moderationResult.flags.map((fl, idx) => (
                              <Pill key={idx} sm tone="red">{fl}</Pill>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Decision Input */}
                    <div className="stack gap-8">
                      <Field
                        label="Admin note / Rejection reason"
                        placeholder="Optional feedback or reason if rejecting..."
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                      />
                      <div className="row gap-10" style={{ marginTop: 8 }}>
                        <Button
                          variant="teal"
                          icon="check"
                          disabled={busy}
                          onClick={() => handleDecision('APPROVE')}
                        >
                          Approve and publish
                        </Button>
                        <Button
                          variant="red"
                          icon="x"
                          disabled={busy}
                          onClick={() => handleDecision('REJECT')}
                        >
                          Reject content
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div style={{ padding: 16 }}>
            {reportsList.length === 0 ? (
              <Empty icon="flag" title="No content reports">
                The community is clean. Flagged posts and comments will appear here.
              </Empty>
            ) : (
              <div className="stack gap-12">
                {reportsList.map((rep) => (
                  <div key={rep.id} className="card tight" style={{ padding: 14 }}>
                    <div className="row between">
                      <div className="row gap-8">
                        <Pill tone="red" icon="flag" sm>{rep.reportCount || 1} report(s)</Pill>
                        <span className="mono sub" style={{ fontSize: 12 }}>Target: {rep.targetType} #{rep.targetId || rep.id}</span>
                      </div>
                      <span className="sub" style={{ fontSize: 12 }}>Last reported {ago(rep.updatedAt || rep.lastReportedAt)}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      <b>Report reasons:</b>
                      <ul style={{ margin: '4px 0 0 16px', fontSize: 13, color: 'var(--ink-2)' }}>
                        {(rep.reasons || [rep.reason || 'General violation']).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="row gap-8" style={{ marginTop: 12 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await patchDoc('community_reports', rep.id, { resolved: true, resolvedAt: Date.now(), resolvedBy: user?.name || 'Admin' });
                          toast('Report dismissed');
                        }}
                      >
                        Dismiss report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'strikes' && (
          <div style={{ padding: 16 }}>
            {strikesList.length === 0 ? (
              <Empty icon="shield" title="Zero active strikes">
                No users currently have strikes or community suspensions on file.
              </Empty>
            ) : (
              <div className="stack gap-10">
                {strikesList.map((str) => {
                  const isSuspended = (str.suspendedUntil || 0) > Date.now();
                  return (
                    <div key={str.id} className="card tight row between" style={{ padding: 14 }}>
                      <div>
                        <div className="row gap-8">
                          <b style={{ fontSize: 14 }}>User ID: {str.id}</b>
                          <Pill tone={isSuspended ? 'red' : 'amber'} sm>
                            {str.strikeCount || 0} strike(s)
                          </Pill>
                          {isSuspended && <Pill tone="red" sm icon="lock">Suspended until {shortDate(str.suspendedUntil)}</Pill>}
                        </div>
                        <div className="sub" style={{ fontSize: 12, marginTop: 6 }}>
                          Last strike: {ago(str.lastStrikeAt || str.updatedAt)}
                        </div>
                      </div>
                      <div className="row gap-8">
                        <Button
                          variant="outline"
                          size="sm"
                          icon="rotate"
                          onClick={() => handleLiftStrike(str)}
                        >
                          Lift strikes & unsuspend
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <form style={{ padding: 20 }} onSubmit={handleSaveSettings} className="stack gap-16">
            <div>
              <h3 className="h-card" style={{ fontSize: 16 }}>Automated 4-Layer Safety Filters</h3>
              <p className="sub" style={{ fontSize: 13, marginTop: 2 }}>
                Toggle individual defense layers or customize banned words and pet-specific allowlists.
              </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <label className="card tight row between" style={{ padding: 12, cursor: 'pointer' }}>
                <div>
                  <b>Word Filter (Layer 1)</b>
                  <div className="sub" style={{ fontSize: 11 }}>Bangla, Banglish, & English profanity</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.enableWordFilter}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableWordFilter: e.target.checked })}
                />
              </label>

              <label className="card tight row between" style={{ padding: 12, cursor: 'pointer' }}>
                <div>
                  <b>Spam & Guideline Rules (Layer 2)</b>
                  <div className="sub" style={{ fontSize: 11 }}>Links, unauthorized phone/medicine sales</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.enableSpamRules}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableSpamRules: e.target.checked })}
                />
              </label>

              <label className="card tight row between" style={{ padding: 12, cursor: 'pointer' }}>
                <div>
                  <b>OpenAI Omni-Moderation (Layer 3)</b>
                  <div className="sub" style={{ fontSize: 11 }}>Hate speech, harassment, self-harm</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.enableAiSafety}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableAiSafety: e.target.checked })}
                />
              </label>

              <label className="card tight row between" style={{ padding: 12, cursor: 'pointer' }}>
                <div>
                  <b>Pet Relevance AI (Layer 4)</b>
                  <div className="sub" style={{ fontSize: 11 }}>Ensures content is strictly animal-related</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.enableAiRelevance}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableAiRelevance: e.target.checked })}
                />
              </label>
            </div>

            <Field
              label="Custom Blocked Words (comma-separated)"
              hint="Instant hard rejection across posts and comments"
              value={settingsForm.blockedWordsText}
              onChange={(e) => setSettingsForm({ ...settingsForm, blockedWordsText: e.target.value })}
            />

            <Field
              label="Custom Soft Words (comma-separated)"
              hint="Flags post for human review (routed to Pending tab)"
              value={settingsForm.softWordsText}
              onChange={(e) => setSettingsForm({ ...settingsForm, softWordsText: e.target.value })}
            />

            <Field
              label="Pet Term Allowlist (comma-separated)"
              hint="Terms exempted from profanity triggers (e.g. cockatiel, shih tzu)"
              value={settingsForm.allowedWordsText}
              onChange={(e) => setSettingsForm({ ...settingsForm, allowedWordsText: e.target.value })}
            />

            <div className="row gap-8" style={{ marginTop: 8 }}>
              <Button type="submit" variant="teal" icon="check" disabled={busy}>
                {busy ? 'Saving…' : 'Save moderation settings'}
              </Button>
              {settingsSaved && <span className="teal" style={{ fontSize: 13 }}>Settings saved!</span>}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
