/**
 * Community moderation: pure decision logic (no Firebase / OpenAI imports, so it is unit-tested).
 *
 * Pipeline for every post, comment and edit (see runModeration):
 *   1. word filter   English + Bangla + Banglish, after undoing spelling tricks (f*ck, fuuuck, f.u.c.k, 5h1t, Cyrillic look-alikes)
 *   2. spam rules    off-site links, phone/email outside Lost & Found / adoption, selling medicines, repeated text
 *   3. AI safety     OpenAI omni-moderation on text + image (hate, harassment, sexual, violence, self-harm, illicit)
 *   4. AI relevance  is it about pets / animals? (text + image)
 * Layers 1–2 run first and are free; a hard hit there rejects without paying for the AI.
 *
 * Verdicts: "approve" (published), "pending" (hidden, an admin decides), "reject" (user sees the reason, gets a strike).
 * When an AI layer is unavailable the item is held as "pending", never silently published.
 */
import { ALLOW_WORDS, HARD_WORDS, SOFT_WORDS } from "./moderation_words";

export type Verdict = "approve" | "pending" | "reject";
export type ReasonCode =
  | "abusive_language" | "hate" | "sexual" | "harmful" | "off_topic"
  | "link" | "contact" | "selling_medicine" | "spam"
  | "needs_review" | "ok";

export interface Message { en: string; bn: string }

export const MESSAGES: Record<ReasonCode, Message> = {
  abusive_language: {
    en: "Your post contains abusive or offensive language. Please keep the community kind.",
    bn: "আপনার লেখায় অশালীন বা আপত্তিকর ভাষা আছে। দয়া করে সবার প্রতি সম্মান বজায় রাখুন।",
  },
  hate: {
    en: "This looks like hate speech or harassment, which isn't allowed.",
    bn: "এটি ঘৃণামূলক বা হয়রানিমূলক বক্তব্য মনে হচ্ছে, যা অনুমোদিত নয়।",
  },
  sexual: {
    en: "Sexual content isn't allowed in the community.",
    bn: "কমিউনিটিতে যৌন কনটেন্ট অনুমোদিত নয়।",
  },
  harmful: {
    en: "This content may be harmful, so it can't be posted.",
    bn: "এই কনটেন্টটি ক্ষতিকর হতে পারে, তাই পোস্ট করা যাবে না।",
  },
  off_topic: {
    en: "The Pet Maya community is only for pets and animals. Please share something about your pet or animals.",
    bn: "Pet Maya কমিউনিটি শুধুমাত্র পোষা প্রাণী ও প্রাণীদের জন্য। আপনার পোষা প্রাণী বা প্রাণী সম্পর্কিত কিছু শেয়ার করুন।",
  },
  link: {
    en: "Links to other websites aren't allowed in the community.",
    bn: "কমিউনিটিতে অন্য ওয়েবসাইটের লিংক দেওয়া যাবে না।",
  },
  contact: {
    en: "Phone numbers and emails can only be shared in Lost & Found or adoption posts.",
    bn: "ফোন নম্বর বা ইমেইল শুধু হারানো-প্রাপ্তি বা দত্তক পোস্টে দেওয়া যাবে।",
  },
  selling_medicine: {
    en: "Selling medicines in the community isn't allowed. Please use the Pet Maya shop or ask a vet.",
    bn: "কমিউনিটিতে ওষুধ বিক্রি করা যাবে না। Pet Maya শপ ব্যবহার করুন অথবা পশু চিকিৎসকের পরামর্শ নিন।",
  },
  spam: {
    en: "This looks like spam (the same text repeated).",
    bn: "এটি স্প্যাম মনে হচ্ছে (একই লেখা বারবার)।",
  },
  needs_review: {
    en: "Thanks! Your post is being reviewed and will appear once a moderator approves it.",
    bn: "ধন্যবাদ! আপনার পোস্টটি পর্যালোচনা করা হচ্ছে, মডারেটর অনুমোদন দিলে দেখা যাবে।",
  },
  ok: { en: "Posted to the community.", bn: "কমিউনিটিতে পোস্ট হয়েছে।" },
};

/* ───────────────────────────── Normalisation ───────────────────────────── */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const HOMOGLYPHS: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "к": "k", "м": "m", "т": "t", "н": "h",
  "і": "i", "ј": "j", "ѕ": "s", "ο": "o", "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "ρ": "p", "τ": "t", "υ": "u",
};
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

/** Bangla digits → ASCII (used by both the word filter and the phone rule). */
export function asciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/**
 * Lower-cases, folds Unicode look-alikes, strips invisible characters and squeezes stretched letters
 * ("fuuuuck" → "fuuck"; the matcher also compares fully squeezed forms).
 */
export function normalize(text: string): string {
  let s = asciiDigits(String(text ?? "").normalize("NFKC").toLowerCase());
  s = s.replace(/[\u200B-\u200F\u2060\uFEFF\u00AD]/g, "");
  s = s.replace(/./gu, (ch) => HOMOGLYPHS[ch] ?? ch);
  s = s.replace(/(.)\1{2,}/gu, "$1$1");
  return s;
}

/** Runs of 2+ identical characters → 1 ("shiit" → "shit"). */
const squeeze = (s: string) => s.replace(/(.)\1+/gu, "$1");

const MASK_FILLS = ["u", "i", "a", "o", "e", "ss", "uc", "ck"];

/** Turns leetspeak inside a word into letters ("5h1t" → "shit"); pure numbers are left alone. */
function unleet(token: string): string {
  if (!/[a-z]/.test(token)) return token;
  return token.replace(/[013457@$!]/g, (c) => LEET[c] ?? c);
}

/** All readings of one raw token: masked letters (f*ck, sh#t) are tried with common fills. */
function readings(token: string): string[] {
  const t = unleet(token.replace(/^[*#]+|[*#]+$/g, ""));
  if (!/[*#]/.test(t)) return [t];
  if (t.replace(/[*#]/g, "").length < 2) return [t];
  let out = [t];
  for (let i = 0; i < 2 && out.some((x) => /[*#]+/.test(x)); i++) {
    out = out.flatMap((x) => (/[*#]+/.test(x) ? MASK_FILLS.map((f) => x.replace(/[*#]+/, f)) : [x]));
  }
  return out.filter((x) => !/[*#]/.test(x));
}

/** Words of the normalised text, plus spaced-out letters joined back ("f u c k", "f.u.c.k" → "fuck"). */
export function tokenize(text: string): string[] {
  const raw = normalize(text).match(/[\p{L}\p{M}\p{N}*#@$!]+/gu) ?? [];
  const tokens: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) tokens.push(run.join(""));
    run = [];
  };
  for (const r of raw) {
    const clean = r.replace(/^[@$!]+|[@$!]+$/g, "");
    if (!clean) continue;
    if ([...clean].length === 1 && /\p{L}/u.test(clean)) run.push(clean);
    else flush();
    tokens.push(clean);
  }
  flush();
  return tokens;
}

/* ───────────────────────────── Word filter ───────────────────────────── */

type Mode = "word" | "prefix" | "contains" | "phrase";
interface Pattern { entry: string; mode: Mode; base: string; squeezed: string }

function compile(entry: string): Pattern | null {
  const e = String(entry ?? "").trim();
  if (!e) return null;
  const contains = e.startsWith("*") && e.endsWith("*") && e.length > 2;
  const prefix = !contains && e.endsWith("*");
  const core = normalize(e.replace(/^\*|\*$/g, "")).trim().replace(/\s+/g, " ");
  if (!core) return null;
  const mode: Mode = core.includes(" ") ? "phrase" : contains ? "contains" : prefix ? "prefix" : "word";
  return { entry: e, mode, base: core, squeezed: squeeze(core) };
}

export interface WordLists { hard: string[]; soft: string[]; allow: string[] }
interface Compiled { hard: Pattern[]; soft: Pattern[]; allow: Pattern[] }

const cache = new Map<string, Compiled>();
function compiled(extra?: Partial<WordLists>): Compiled {
  const key = JSON.stringify(extra ?? {});
  let c = cache.get(key);
  if (!c) {
    const build = (a: string[], b?: string[]) => [...a, ...(b ?? [])].map(compile).filter((p): p is Pattern => !!p);
    c = { hard: build(HARD_WORDS, extra?.hard), soft: build(SOFT_WORDS, extra?.soft), allow: build(ALLOW_WORDS, extra?.allow) };
    if (cache.size > 20) cache.clear();
    cache.set(key, c);
  }
  return c;
}

function tokenHits(p: Pattern, t: string): boolean {
  const st = squeeze(t);
  switch (p.mode) {
    case "word": return t === p.base || st === p.squeezed;
    case "prefix": return t.startsWith(p.base) || st.startsWith(p.squeezed);
    case "contains": return t.includes(p.base) || st.includes(p.squeezed);
    default: return false;
  }
}

function isAllowed(t: string, allow: Pattern[]): boolean {
  return allow.some((a) => a.mode !== "phrase" && (a.mode === "prefix" ? t.startsWith(a.base) : t === a.base));
}

export interface WordResult { hard: string[]; soft: string[] }

/** Which hard / soft list entries the text hits (allow-listed pet words removed first). */
export function wordFilter(text: string, extra?: Partial<WordLists>): WordResult {
  const lists = compiled(extra);
  // Remove allow-listed phrases ("shih tzu", "maine coon"), then allow-listed single words.
  let joined = ` ${tokenize(text).join(" ")} `;
  for (const a of lists.allow) {
    if (a.mode !== "phrase") continue;
    while (joined.includes(` ${a.base} `)) joined = joined.replace(` ${a.base} `, " ");
  }
  const tokens = joined.trim().split(/\s+/).filter(Boolean).filter((t) => !isAllowed(t, lists.allow));
  const variants = tokens.flatMap(readings).filter((t) => !isAllowed(t, lists.allow));
  const phraseText = ` ${variants.join(" ")} `;
  const phraseSqueezed = ` ${variants.map(squeeze).join(" ")} `;

  const hits = (patterns: Pattern[]) => patterns
    .filter((p) => (p.mode === "phrase"
      ? phraseText.includes(` ${p.base} `) || phraseSqueezed.includes(` ${p.squeezed} `)
      : variants.some((t) => tokenHits(p, t))))
    .map((p) => p.entry);

  const hard = [...new Set(hits(lists.hard))];
  const soft = [...new Set(hits(lists.soft))].filter((s) => !hard.includes(s));
  return { hard, soft };
}

/* ───────────────────────────── Spam & guideline rules ───────────────────────────── */

export interface RuleContext {
  /** Lost & Found, adoption and rescue posts (and comments on them) may share a phone number. */
  allowContact?: boolean;
}

export interface SpamResult { code: ReasonCode; detail: string }

const ALLOWED_HOSTS = /(^|\.)petmaya\.app$/i;
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const BARE_DOMAIN_RE = /\b(?:[a-z0-9-]{2,}\.)+(?:com|net|org|info|xyz|top|bd|io|me|ly|link|shop|online|site|store|club|live|biz|co|us|in|pk|tk|gl|gg)\b(?:\/[^\s]*)?/gi;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const BD_PHONE_RE = /(?:\+?88)?01[3-9]\d{8}/;
const INTL_PHONE_RE = /\+\d{10,14}/;

const SELL_RE = /\b(?:sell|selling|seller|for sale|on sale|inbox me|inbox koren|inbox korun|ib|dm me|dm for|knock me|whatsapp|imo|wholesale|stock available|available stock|cash on delivery|home delivery|order korun|order koren|bikri|bikroy)\b|বিক্রি|বিক্রয়|ইনবক্স|হোম ডেলিভারি|অর্ডার করুন|স্টকে আছে/i;
const MED_RE = /\b(?:medicines?|medications?|tablets?|tabs?|capsules?|syrups?|injections?|vaccines?|antibiotics?|dewormers?|drugs?|ivermectin|bravecto|nexgard|simparica|frontline|drontal|meloxicam|metacam|amoxicillin|amoxyclav|metronidazole|doxycycline|prednisolone|ketamine|xylazine|tramadol|diazepam|oshudh|oushodh|osud)\b|ঔষধ|ওষুধ|ট্যাবলেট|ইনজেকশন|ভ্যাকসিন|সিরাপ|ক্যাপসুল/i;

/** Links (except petmaya.app), contact details, medicine selling and repeated-text spam. */
export function spamRules(text: string, ctx: RuleContext = {}): SpamResult[] {
  const out: SpamResult[] = [];
  const s = String(text ?? "");
  const lower = asciiDigits(s.normalize("NFKC")).toLowerCase();

  const withoutEmails = lower.replace(new RegExp(EMAIL_RE.source, "gi"), " ");
  const links = [...(withoutEmails.match(URL_RE) ?? []), ...(withoutEmails.match(BARE_DOMAIN_RE) ?? [])];
  const offsite = links.find((l) => {
    const host = l.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
    return !ALLOWED_HOSTS.test(host);
  });
  if (offsite) out.push({ code: "link", detail: offsite.slice(0, 80) });

  if (!ctx.allowContact) {
    const digits = lower.replace(/[\s().\-–]/g, "");
    if (BD_PHONE_RE.test(digits) || INTL_PHONE_RE.test(digits)) out.push({ code: "contact", detail: "phone" });
    else if (EMAIL_RE.test(lower)) out.push({ code: "contact", detail: "email" });
  }

  if (SELL_RE.test(lower) && MED_RE.test(lower)) out.push({ code: "selling_medicine", detail: "sell+medicine" });

  const words = lower.match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  const counts = new Map<string, number>();
  words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
  const top = Math.max(0, ...counts.values());
  if (/([\p{L}\p{N}])\1{11,}/u.test(lower) || (words.length >= 8 && top / words.length >= 0.5)) {
    out.push({ code: "spam", detail: "repetition" });
  }
  return out;
}

/* ───────────────────────────── AI results → verdict ───────────────────────────── */

/** OpenAI moderation category scores (0..1). */
export interface SafetyResult { scores: Record<string, number> }
/** Pet-relevance classifier result. */
export interface RelevanceResult { petRelated: "yes" | "no" | "unsure"; promotesCruelty?: boolean; reason?: string }

type Layer<T> = T | "unavailable" | "skipped";

/** [category, reject at ≥ (null = never auto-reject), hold for review at ≥, reason] */
const SAFETY_RULES: [string, number | null, number, ReasonCode][] = [
  ["sexual/minors", 0.3, 0.1, "sexual"],
  ["sexual", 0.7, 0.35, "sexual"],
  ["hate/threatening", 0.5, 0.25, "hate"],
  ["hate", 0.6, 0.3, "hate"],
  ["harassment/threatening", 0.6, 0.3, "hate"],
  ["harassment", 0.7, 0.35, "hate"],
  ["self-harm/instructions", 0.6, 0.3, "harmful"],
  ["self-harm/intent", null, 0.3, "harmful"],
  ["self-harm", null, 0.4, "harmful"],
  ["illicit/violent", 0.7, 0.4, "harmful"],
  ["illicit", 0.8, 0.5, "harmful"],
  // Injured or sick animals are normal in rescue and health posts: violence is only ever held for review.
  ["violence/graphic", null, 0.6, "harmful"],
  ["violence", null, 0.7, "harmful"],
];

export interface DecideInput {
  words: WordResult;
  spam: SpamResult[];
  safety: Layer<SafetyResult>;
  relevance: Layer<RelevanceResult>;
}

export interface Decision {
  verdict: Verdict;
  code: ReasonCode;
  message: Message;
  layer: "words" | "rules" | "safety" | "relevance" | "none";
  flags: string[];
}

const decision = (verdict: Verdict, code: ReasonCode, layer: Decision["layer"], flags: string[]): Decision =>
  ({ verdict, code, message: MESSAGES[verdict === "pending" ? "needs_review" : code], layer, flags });

export function decide(input: DecideInput): Decision {
  const { words, spam, safety, relevance } = input;
  if (words.hard.length) return decision("reject", "abusive_language", "words", words.hard.map((w) => `word:${w}`));
  if (spam.length) return decision("reject", spam[0].code, "rules", spam.map((s) => `rule:${s.code}:${s.detail}`));

  const review: string[] = [];
  let reviewLayer: Decision["layer"] = "none";
  const hold = (flag: string, layer: Decision["layer"]) => {
    review.push(flag);
    if (reviewLayer === "none") reviewLayer = layer;
  };

  if (safety === "unavailable") hold("safety:unavailable", "safety");
  else if (safety !== "skipped") {
    for (const [cat, rejectAt, holdAt, code] of SAFETY_RULES) {
      const score = Number(safety.scores?.[cat] ?? 0);
      if (rejectAt !== null && score >= rejectAt) return decision("reject", code, "safety", [`safety:${cat}:${score.toFixed(2)}`]);
      if (score >= holdAt) hold(`safety:${cat}:${score.toFixed(2)}`, "safety");
    }
  }

  if (relevance === "unavailable") hold("relevance:unavailable", "relevance");
  else if (relevance !== "skipped") {
    if (relevance.petRelated === "no") return decision("reject", "off_topic", "relevance", [`relevance:no:${relevance.reason ?? ""}`.slice(0, 160)]);
    if (relevance.petRelated === "unsure") hold(`relevance:unsure:${relevance.reason ?? ""}`.slice(0, 160), "relevance");
    if (relevance.promotesCruelty) hold("relevance:cruelty", "relevance");
  }

  if (words.soft.length) words.soft.forEach((w) => hold(`soft:${w}`, "words"));
  if (review.length) return decision("pending", "needs_review", reviewLayer, review);
  return decision("approve", "ok", "none", []);
}

/* ───────────────────────────── Orchestration ───────────────────────────── */

export interface ModerationItem {
  kind: "post" | "comment";
  text: string;
  /** base64 image (already validated) for the AI layers. */
  image?: { base64: string; mime: string } | null;
  /** For comments: the parent post's text, so a short reply is judged in context. */
  parentText?: string;
  context?: RuleContext;
}

export interface ModerationDeps {
  safety?: (item: ModerationItem) => Promise<SafetyResult>;
  relevance?: (item: ModerationItem) => Promise<RelevanceResult>;
  lists?: Partial<WordLists>;
  /** settings/moderation switches; every layer is on unless set to false. */
  layers?: { words?: boolean; rules?: boolean; safety?: boolean; relevance?: boolean };
}

/**
 * Short text-only comments ("so cute 😍", "get well soon") are judged together with an approved parent post, so they
 * are not rejected for not naming an animal themselves. Posts, images and longer comments are always checked.
 */
export function needsRelevance(item: ModerationItem): boolean {
  if (item.kind === "post") return true;
  if (item.image) return true;
  return [...item.text.trim()].length > 80;
}

async function attempt<T>(fn: (() => Promise<T>) | undefined): Promise<Layer<T>> {
  if (!fn) return "unavailable";
  try {
    return await fn();
  } catch {
    return "unavailable";
  }
}

export async function runModeration(item: ModerationItem, deps: ModerationDeps = {}): Promise<Decision> {
  const on = (k: keyof NonNullable<ModerationDeps["layers"]>) => deps.layers?.[k] !== false;
  const text = String(item.text ?? "");
  const words = on("words") ? wordFilter(text, deps.lists) : { hard: [], soft: [] };
  const spam = on("rules") ? spamRules(text, item.context) : [];
  const local = decide({ words, spam, safety: "skipped", relevance: "skipped" });
  if (local.verdict === "reject") return local;

  const hasContent = text.trim().length > 0 || !!item.image;
  const [safety, relevance] = await Promise.all([
    on("safety") && hasContent ? attempt(deps.safety && (() => deps.safety!(item))) : Promise.resolve("skipped" as const),
    on("relevance") && hasContent && needsRelevance(item)
      ? attempt(deps.relevance && (() => deps.relevance!(item)))
      : Promise.resolve("skipped" as const),
  ]);
  return decide({ words, spam, safety, relevance });
}

/* ───────────────────────────── Strikes ───────────────────────────── */

export const STRIKE_LIMIT = 3;
export const STRIKE_WINDOW_MS = 30 * 24 * 3600 * 1000;
export const SUSPEND_MS = 7 * 24 * 3600 * 1000;

/**
 * Adds a strike at `now`, forgets strikes older than 30 days, and returns when posting is suspended until
 * (3 strikes within 30 days → 7 days without posting or commenting). The strike list is cleared on suspension
 * so a user is not suspended again straight after coming back.
 */
export function addStrike(previous: number[] | undefined, now: number): { strikes: number[]; suspendUntil: number | null } {
  const recent = (Array.isArray(previous) ? previous : []).filter((t) => typeof t === "number" && now - t < STRIKE_WINDOW_MS);
  const strikes = [...recent, now];
  if (strikes.length >= STRIKE_LIMIT) return { strikes: [], suspendUntil: now + SUSPEND_MS };
  return { strikes, suspendUntil: null };
}

/** The post types / categories where a phone number is expected. */
export function allowsContact(post: { postType?: unknown; category?: unknown } | undefined): boolean {
  const s = `${post?.postType ?? ""} ${post?.category ?? ""}`.toLowerCase();
  return /lost|found|adopt|rescue/.test(s);
}
