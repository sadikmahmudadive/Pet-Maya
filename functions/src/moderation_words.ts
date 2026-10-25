/**
 * Built-in word lists for community moderation (English, Bangla script, Banglish).
 *
 * Entry syntax (matched against normalised text, see moderation.ts):
 *   "word"      the whole word only
 *   "word*"     words starting with it (fuck → fucking, fucker)
 *   "*word*"    anywhere inside a word (Bangla compounds such as মাদারচোদ)
 *   "two words" a phrase (whole words, in order)
 *
 * HARD  = reject straight away.
 * SOFT  = hold for an admin. These have innocent meanings on a pet site
 *         ("bitch" = female dog, "cock" = rooster, "kuttar bacha" literally = puppy, "bal" = hair).
 * ALLOW = removed before matching, so pet words containing a bad word pass
 *         (cockatiel, Shih Tzu misspelt "shitzu", Maine Coon, চোদ্দ = fourteen…).
 *
 * Deliberately NOT listed: animal words used as insults (kutta/dog, chagol/goat, gadha/donkey,
 * suar/pig, coon) and violence words (kill, die, blood). On a pet site they are everyday words in
 * rescue, illness and farm-animal posts; real threats and harassment are caught by the AI layer.
 *
 * Admins can add words without a deploy in settings/moderation
 * (blockedWords / softWords / allowedWords); those merge with these lists.
 */

export const HARD_WORDS: string[] = [
  // ── English profanity ─────────────────────────────────────────────
  "fuck*", "*fuck*", "motherfuck*", "fck", "fcking", "fuk", "fuking", "fukin", "phuck*", "stfu", "gtfo",
  "shit", "shits", "shitty", "shithead*", "bullshit", "horseshit", "dipshit",
  "cunt*", "twat*", "wank*", "jerkoff", "dickhead*", "cocksuck*",
  "asshole*", "arsehole*", "bastard*", "slut*", "whore*", "skank*",
  "porn*", "xxx", "nude", "nudes", "boobs", "tits", "titties", "blowjob*", "handjob*", "dildo*", "cum", "cumming",
  "retard", "retards", "retarded",
  // ── Hate slurs (race, religion, sexuality, disability) ───────────
  "nigger*", "nigga*", "faggot*", "fag", "fags", "dyke", "dykes", "tranny", "trannies", "chink", "chinks",
  "spic", "spics", "kike*", "raghead*", "towelhead*", "wetback*", "gook", "gooks",
  "malaun", "malaunder", "malauner", // anti-Hindu slur used in Bangladesh
  "kill yourself", "kys", "go die",
  // ── Banglish (romanised Bangla) abuse ─────────────────────────────
  "khanki*", "magi", "magir", "chod", "choda", "chodi", "chodon", "chudi", "chudir*", "chuda",
  "chudbo", "chudsi", "chudo", "chodna", "bokachoda*", "bokachuda*", "madarchod*", "madarchud*", "motherchod*",
  "bhenchod*", "behenchod*", "benchod*", "bainchod*", "baincod*", "chutiya*", "chutia*", "chudirbhai",
  "khankir pola", "khankir pula", "khankir chele", "beshya", "beissha", "besshya", "randi*", "rendi*", "gandu*",
  "haramjada*", "haramzada*", "haramjadi*", "haramzadi*", "harami", "haramir", "jaroj", "jarja", "baal chhera",
  "maa chudi", "mare chudi", "pod mara", "podmara", "lewra", "leora", "bhoda",
  // ── Bangla script abuse ───────────────────────────────────────────
  "*চোদ*", "*চুদ*", "খানকি*", "খানকী*", "মাগি", "মাগী", "মাগির", "মাগীর", "বেশ্যা*", "রেন্ডি*", "রান্ডি*",
  "হারামজাদা*", "হারামজাদি*", "হারামি", "হারামী", "জারজ*", "গান্ডু*", "মালাউন*", "শুয়োরের বাচ্চা",
  "ধোন", "ভোদা*", "গুদ", "লেওড়া*", "পোদ", "পোদ মারা", "চুতিয়া*",
];

export const SOFT_WORDS: string[] = [
  // Innocent pet meanings, mild insults, or "your mother/sister" openers that are usually abuse.
  "bitch", "bitches", "bitchy", "cock", "cocks", "pussy", "pussies", "dick", "dicks", "ass", "arse", "wtf",
  "damn", "dammit", "crap", "piss", "pissed", "idiot", "moron", "screw you", "shut up", "hate you", "paki", "pakis",
  "malu", "nunu", "dhon", "voda",
  "kuttar bacha", "kuttar baccha", "kuttar bachcha", "kuttar bachha", "shuorer bacha", "shuyorer baccha",
  "gadhar bacha", "sala", "shala", "sali", "shali", "bal", "baal", "fokinni",
  "tor maa", "tor mare", "tor ma re", "tor bon", "tor boner",
  "কুত্তার বাচ্চা", "শালা", "শালী", "বাল", "গাধার বাচ্চা", "ফকিন্নি", "তোর মা", "তোর মায়ের", "তোর বোন",
];

export const ALLOW_WORDS: string[] = [
  "cockatiel", "cockatiels", "cockatoo", "cockatoos", "cockapoo", "cockapoos", "cocker spaniel", "cocker", "cockerel",
  "peacock", "peacocks", "woodcock", "gamecock", "shuttlecock", "shitzu", "shitsu", "shih tzu", "shihtzu",
  "maine coon", "maine coons", "blue tit", "great tit", "coal tit", "pussycat", "puss in boots", "scunthorpe",
  "চোদ্দ", "চোদ্দো", "চোদ্দই",
];

/** Phrases that look like violence or hate but are normal in pet care (used by the AI context note). */
export const CONTEXT_ALLOW: string[] = [
  "put down", "put to sleep", "euthanasia", "euthanize", "flea kill", "tick kill", "kills fleas", "kills ticks",
  "killed by a car", "passed away", "rainbow bridge", "blood test", "blood work", "bloodwork",
];
