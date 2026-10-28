# Pet Maya

Pet-care platform for Bangladesh: a **Flutter app** (owners, vets/service providers, shops, admins), a **React website** (storefront + admin console), **Firebase Cloud Functions**, and **ESP32 firmware** for pet trackers. One Firebase project (`pet-maya`) is shared by all of them, so a field or rule change affects every client. Money is BDT (৳); the site and shop are Dhaka-focused (cold-chain medicines only ship to Dhaka, Gazipur, Narayanganj).

Recent commits use conventional prefixes (`feat:`, `fix:`, `refactor:`). The developer works on **Windows** (Git Bash and PowerShell).

## Repo map

| Path | What it is |
|---|---|
| `lib/` | Flutter app. `core/` (theme, services, security), `data/` (models, `repositories/app_state_repository.dart`, services), `presentation/` by role: `owner/`, `provider/` (vets, groomers, boarding), `merchant/`, `admin/`, `auth/`, `common_widgets/` |
| `web/` | React 19 + Vite 6 site. `src/site/` storefront pages, `src/admin/` admin console, `src/lib/` router/store/analytics/helpers, `src/data/` Firestore reads (`firestore.js`) and writes (`actions.js`), `src/ui/` primitives, `src/styles/` |
| `functions/` | Cloud Functions, TypeScript, Node 22 (`src/*.ts` → `lib/`) |
| `firestore.rules`, `storage.rules`, `database.rules.json` | Security rules (the real access control; read them before changing any data shape) |
| `firmware/` | PlatformIO projects: `wifi-collar`, `lora-tracker`, `lora-gateway`, `lora-finder`, shared libs. Own README and own versioning (`FW_VERSION`) |
| `android/ ios/ macos/ windows/ linux/` | Flutter platform shells. Android has native Java/Kotlin (alarms, widgets, FCM service) |
| `tests/` | `unit/` (pure JS, `node --test`), `security/` (Firestore/Storage rules on the emulator), `responsive/` and `tracking/` (Playwright scripts) |
| `tools/set-version.mjs` | Sets the app version everywhere (see Versioning) |
| `scroll-site/` | Standalone "Maya Halo" scroll film; its images are copied to `web/public/halo-img/` |
| `figma_*`, `refactor.js`, `index.html` (root, empty) | Leftovers, ignore |

Stale docs: `backend_connectivity_logic.md` and `layout_information.md` describe the **old Android/Java app** (Realtime Database, XML layouts), not this code. The README is broadly right but light. `web/` root also holds loose copies of files that live in `web/public/` (`about.html`, `sw.js`, `manifest.json`…); Vite only copies `public/`.

## Commands

```bash
# Website (from repo root; npm workspace "web")
npm install
npm run dev                      # Vite dev server
npm run build                    # -> web/dist
cd web && npx vite preview --port 4173   # serve the built site

# Cloud Functions
cd functions && npm test         # tsc, then node --test test/**/*.test.js
cd functions && npm run build    # tsc -> lib/ (functions load lib/index.js)

# Unit tests (pure JS, no browser). Node 25 needs the FILE path, not a directory
node --test tests/unit/announcement.test.mjs
node --test tests/unit/hosts.test.mjs tests/unit/product-form.test.mjs tests/unit/species.test.mjs tests/unit/categories.test.mjs tests/unit/pricing.test.mjs tests/unit/blogs.test.mjs

# Responsive audit (phones 280-430px, tablets, desktop; reports sideways overflow and small tap targets)
cd web && npx vite --port 5173      # then, in another shell:
AUDIT_BASE_URL=http://localhost:5173 node tests/responsive/audit-web.mjs --sizes=phone-xxs,phone-xs,phone-s --touch

# Firestore/Storage rules tests (needs Java + Firebase CLI)
cd tests/security && npm test

# Flutter
flutter pub get
flutter run                      # a full run/rebuild is needed to see a new app version; hot restart is not enough
flutter test
flutter analyze
flutter build apk --release      # ~6 min; verify with aapt2 dump badging
flutter build apk --config-only  # refreshes android/local.properties from pubspec without a full build

# Deploy (the developer runs these; Firebase project from .firebaserc)
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting   # hosting serves web/dist (build first)
```

Notes: `firebase emulators:exec` on Windows often leaves a `java.exe` on port 8080; kill that PID before the next run. Under the Functions emulator on Node 25 here, `admin.firestore.Timestamp` was undefined (so the rate limiter threw); to test a callable locally, require `functions/lib/<file>.js` and call the exported function's `.run({ data, auth, rawRequest })` against the Firestore emulator instead. Playwright (`@playwright/test`) and Chromium are installed under `web/`.

## Architecture

### Flutter app
- State is one `ChangeNotifier`, `AppStateRepository` (~2,200 lines), provided at the root with `provider`. It owns the cart, orders, pets, notifications, etc. and listens to Firestore streams through `FirebaseService`. `RealtimeDatabaseService` and `LocalCacheService` are secondary (offline cache).
- `main.dart` boots: `.env` (flutter_dotenv) → Firebase → **App Check** (Play Integrity in release) → Crashlytics → home widgets → Workmanager. Navigation uses a global `TailWaggingApp.navigatorKey`; there is no named-route table.
- Roles (`UserRole`): petOwner, veterinarian, grooming, boarding, shelter, petShop, admin. Login routes each role to its own home screen.
- Pet species is **not trusted from storage**: `PetModel.resolvedSpecies` reads the breed (see Gotchas).
- Reminders use native Android alarms via the MethodChannel `com.masa.petmaya/native_bridge` (`AlarmHelper.java`). Android 16: `targetSdk = max(flutter default, 36)`; native `PendingIntent`s are all `FLAG_IMMUTABLE`.

### Website
- Custom router in `lib/router.jsx` (`match()` + `<Link>`; no react-router). Storefront routes are listed in `App.jsx` (`SITE_ROUTES`); the admin console is `src/admin/AdminApp.jsx`, shown when the path starts with `/admin` **or the host starts with `admin.`** (production admin is `admin.petmaya.app`, so `"/"` there is still the admin; see `lib/hosts.js`).
- `lib/store.jsx` is the storefront store (cart, coupon, wishlist, compare, `placeOrder`, active pet). Data hooks and normalisers live in `data/firestore.js` (`normProduct`, `normPet`, `normOrder`…); every write is in `data/actions.js`.
- Legacy: `src/components/` + `context/AppContext.jsx` are the previous UI generation and are only partly live (`ModalRoot`, `GoogleMapView`, `useApp()` modals). Do not extend them; new work goes in `site/`, `admin/`, `lib/`.
- Admin pages read through `useAdmin()` and write through `useAdminWrite()` (`admin/data.jsx`). Access by staff role is `ROLE_ACCESS` in `admin/erp.js` (Manager `*`, Cashier, Pharmacist, Accountant, Storekeeper; admins see everything). In the dev server only, `/admin?preview` opens the console with sample data without signing in.
- Pure, unit-tested logic is kept free of browser imports: `lib/species.js`, `lib/announcement.js`, `lib/hosts.js`, `lib/categories.js`, `lib/pricing.js`, `lib/blogs.js`, `admin/productForm.js`. Keep new testable logic that way (`lib/security.js` imports DOMPurify and cannot be loaded under plain Node).

### Cloud Functions (`functions/src`)
| Function | Purpose |
|---|---|
| `create_order` (callable) | **The only way the website creates orders** (guests included). Prices from the catalogue, checks and deducts stock in one transaction, validates coupons, makes the order number, reserves it in `order_ids`, retry-safe through `order_requests/{requestId}` |
| `check_order_prices`, `handle_order_status_change` | Order triggers: flag price mismatches; restore stock on cancel / approved return |
| `track_purchase`, `collect` | Server-side GA4 + Meta CAPI (or forward to the server GTM container when `SGTM_URL` is set). `track_purchase` skips orders without `_track` (app orders log their own purchase) |
| `feed` (HTTP) | Product feeds `/feeds/meta.xml`, `google.xml`, `marketplace.xml`, built live from `products`; Rx products are excluded |
| `openai_proxy` (callable) | All AI (health, nutrition, breed finder, shopping assistant). The OpenAI key is a Functions secret and never leaves the server |
| `push_on_notification` | FCM push for each new `notifications/{uid}/items` doc, with a repeat guard (below) |
| `send_broadcast`, `apply_referral`, `sync_public_profile`, `stamp_record_owner`, `backfill_security_data` | Admin broadcast, referral points, public profile mirror, record ownership, one-off backfill |
| `device_ingest`, `lora_ingest`, `get_tracker_key`, `mark_offline_devices`, `mark_offline_gateways` | IoT: collar/gateway telemetry (HMAC-signed), 5-minute offline sweeps |

Config: `defineString` params with defaults plus `functions/.env.pet-maya` (git-ignored; copy from `functions/.env.example`). Secrets via `firebase functions:secrets:set` (`OPENAI_API_KEY`, `GA4_API_SECRET`, `META_CAPI_TOKEN`, `DEVICE_MASTER_SECRET`). Setting `META_PIXEL_ID` makes `META_CAPI_TOKEN` required at deploy.

### Data and security rules
- Collections: `users`, `public_profiles`, `pets`, `events`, `service_records`, `products`, `orders`, `coupons`, `promos`, `settings` (`erp`, `announcement`, …), `notifications/{uid}/items`, `devices`, `gateways`, `community_posts`, `blogs`, `reviews`, `vets`, plus ERP collections (`pos_*`, `stock_moves`, `inventoryMovements`, `suppliers`, `purchase_orders`, `expenses`, `staff`, `payroll`…). Server-only: `order_ids`, `order_requests`, `rate_limits`.
- Rules helpers: `isAdmin()`, `isVerifiedProvider()`, `isVerifiedShop()`, `hasStaffRole([...])`, `canManageCatalog()`. Users have `role` (display or Dart enum names) and optional `staffRole`.
- Orders: the website never writes `orders` directly. The Flutter app still does (signed-in only, opening status only) and is only checked afterwards by `check_order_prices`. Customers can cancel only in `Pending/Processing/Rx review/Packing` and request a return only on `Delivered`. Coupon `usageCount` is changed only by `create_order`.
- Order statuses differ by client: web `Rx review → Packing → In transit → Delivered | Return | Cancelled`; app `Pending → Processing → Dispatched → Delivered | Cancelled`.
- Notification docs come in two shapes: server/web `{title, body, category, url, timestamp}`; app `{id, title, message, type, isRead, timestamp}`. Readers must accept both.
- **Product categories** are a tree of unlimited depth: flat `categories/{id}` docs (`name`, `slug`, `parentId` (`''` = main), `order`, `active`, `description`), managed in admin → Categories (`admin/pages/Categories.jsx`, logic in `lib/categories.js`, batched writes in `admin/categoryOps.js`). Rules: public read, admin/Manager write. A product keeps `category` = its **main** category slug (so Shop filters, POS, reports, the AI assistant, kits and the Flutter app keep working) plus `categoryId`, `categoryPath` (ids, root first) and `categorySlugs`. Names live only in the tree; renaming rewrites nothing, slugs never change, and only **moving a branch** rewrites the path fields of products inside it (`reRootUpdates`). Products with just a plain `category` still resolve through `makeResolver().nodeOf()`. The product forms use `admin/CategoryPicker.jsx` when any category exists (free text otherwise); the Shop serves any slug at `/shop/<slug>` (special pages `dogs/cats/prescription/medicine/accessories` keep their own rules) and the feeds build `product_type` from the path names.
- **Blogs** (`blogs/{id}`: `title, content (HTML), authorId, authorName, authorPhoto, imageUrl, category, timestamp (ms), readTimeMinutes, tags, status, isApproved`). Only `isApproved == true` is public: the rules let anyone read an approved post, an author read their own, an admin read all, so every client **must query `where isApproved == true`** (never the whole collection). That feed query (`isApproved` + `timestamp desc`) needs the composite index in `firestore.indexes.json`; both clients fall back to an unordered approved-only read if it is missing. Authors can edit only posts still in review (an approved post is admin-only, so nothing goes live unreviewed). Website: `data/blogs.js` (`useBlogFeed` pages of 12 with a 5-minute cache, `useBlog` single read), `lib/blogs.js` (normalising, read time, Article JSON-LD), `lib/seo.js` (`usePageMeta`); no sample articles. App: `FirebaseService.streamBlogs` (newest 50 approved; admins stream all for moderation). Old posts missing `isApproved`/`timestamp` are fixed by the admin-only `backfill_security_data` function (`blogBackfill`). **Deploy order:** release the app first (older app versions stream the whole collection and would get permission-denied under the new rules), then `firebase deploy --only firestore` (rules + index), then run the backfill once.
- Product photos are stored three ways on purpose: `image`/`imageUrl` (cover), `images` (the rest; the storefront shows `[image, ...images]`), `imageGallery` (everything, for the app). Build them with `admin/productForm.js`, never by hand. New product ids are `p_<ms>`.

### Analytics and consent
`lib/analytics.js` pushes events to `dataLayer` for the **web GTM container (`GTM-TNCML2DB`)**, which sends to the **server GTM container at `https://sgtm.petmaya.app`** (GA4 `G-WSN2ZQE4PF`, Meta Pixel `1423036852741048`, Meta CAPI). The browser pixel loads only after ad consent and uses the same `event_id` as the server event so Meta de-duplicates. With `VITE_SGTM_URL` set, the browser no longer posts to `/collect`. The Flutter app logs GA4 `purchase` through Firebase Analytics.

## Conventions and gotchas (each one cost time before)

- **Secrets.** Real secrets live in **Firebase Functions secrets** (Secret Manager): `OPENAI_API_KEY`, `GA4_API_SECRET`, `META_CAPI_TOKEN`, `DEVICE_MASTER_SECRET`. `firebase functions:secrets:set NAME` takes the secret's **name**; paste the value at the prompt, never on the command line (a pasted key once became a secret *name*, which is visible in Secret Manager and shell history). `pubspec.yaml` lists the root `.env` as a Flutter **asset**, so it ships inside every APK/IPA; only `GOOGLE_MAPS_API_KEY` is read from it. The `OPENAI_API_KEY` and Firebase lines in the local `.env` are unused leftovers: delete them. `VITE_*` values are public too. Never put a real secret in either.
- **CSP and rewrites exist twice.** `firebase.json` (Firebase Hosting) and root `vercel.json` (Vercel; production deploys from GitHub `main`) carry the same Content-Security-Policy and the `/collect` and `/feeds/*.xml` rewrites. Change both. `web/vercel.json` is only an SPA fallback.
- **Species.** Many pets are stored as `type: "Dog"` whatever they are. Use `resolveSpecies()` / `speciesKind()` (`web/src/lib/species.js`) and `PetModel.resolvedSpecies`, and keep the two in step (both have tests). Shop matching uses `productFitsPet()`: `"both"` means dogs and cats only.
- **Theme tokens live in three blocks** of `styles/tokens.css`: light `:root`, `@media (prefers-color-scheme: dark)`, and `[data-theme="dark"], :root.dark`. A new token must be added to all three. Never hard-code a light colour on UI that shows in dark mode (the scrolled header once did). The site toggle sets both `data-theme` and the `dark`/`light` class.
- **Fixed-position UI.** `.page-enter` must not keep a `transform` after its animation (it would turn every `position: fixed` child into page-relative). Bottom-floating elements add `--consent-space` (set by the cookie banner) and the AI button also `--compare-space`; follow that pattern for anything new at the bottom of the screen.
- **Firestore transactions** must do all reads before the first write (`create_order` does). Order numbers are made on the server; the browser sends a random `requestId` and reuses it on retry.
- **Notifications.** The app must not save a copy of a received push (that looped for a day: server pushes, app saves a copy, server pushes the copy). `push_on_notification` also skips a notification identical to one the user got in the previous 2 minutes.
- **No sample/fake data.** Orders are never faked; empty collections render empty states. Remaining sample data (`data/sample.js`) is only a fallback for some admin/storefront collections when Firestore is empty or unreachable.
- **Writing tests.** Prefer `tests/unit` for pure logic. Rules changes need a case in `tests/security/rules.test.mjs`. For UI, build and `vite preview`, then drive it with Playwright (viewport sizes, light and dark via `localStorage.pm_theme`, consent via `localStorage.pm_consent`). Pages that need sign-in can be tested by aliasing the Firebase/store/router modules in a throwaway Vite config.
- **R8 keep rules** (`android/app/proguard-rules.pro`) are deliberately minimal: blanket `-keep class pkg.** { *; }` rules stop R8 optimising that code (Play flags it). The one Firebase rule that is needed keeps the no-argument constructor of every `ComponentRegistrar`; without it Firebase cannot create Crashlytics, App Check, Messaging or Installations in a release build. After changing the rules, build `flutter build apk --release`, install it on an emulator and check logcat for `Could not instantiate`. `firebase-appcheck-safetynet` / `play-services-safetynet` are excluded in `app/build.gradle.kts` (the app only activates Play Integrity and Debug providers).
- **Don't** edit `build/`, `web/dist/`, `functions/lib/` (generated), `android/.android/` (a Flutter SDK cache that is tracked), or `node_modules/`.

## Versioning

App version = `pubspec.yaml` `version: x.y.z+build` (Android `versionName/versionCode` and the iOS/desktop builds read it). Change it with `node tools/set-version.mjs 1.2.1 26` (also updates `lib/core/app_info.dart` fallbacks, `web/package.json` and its `package-lock.json` entry); `node tools/set-version.mjs --check` verifies they agree. Google Play requires each upload's build number to be higher than the last. Firmware versions are separate.

## Android / release notes

AGP 9.1.1, Gradle 9.3.1, Kotlin 2.3.20, `compileSdk`/`targetSdk` ≥ 36, NDK 28 (16 KB page-size compliant; all native libs in the release APK were checked). Release signing reads `android/key.properties`; without it the build falls back to the debug key (fine for checks, not for upload). Package: `com.vertexhand.petmaya`.
