# Kungwi — AI Transcription SaaS

Kungwi is an AI-powered transcription SaaS built with:

- **Next.js 15** (App Router, React Server Components)
- **Supabase** (Auth, PostgreSQL, Storage)
- **Google Gemini 2.0 Flash** (transcription engine)
- **Polar.sh** (subscriptions & payments)
- **Tailwind CSS** (styling)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `POLAR_ACCESS_TOKEN` | [Polar.sh](https://polar.sh) → Settings → API |
| `POLAR_WEBHOOK_SECRET` | Polar.sh → Webhooks → Secret |
| `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID` | Polar.sh → Products → Your Pro product ID |

### 3. Set up Supabase

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL editor
3. Enable Email auth in Authentication → Providers
4. Set redirect URL to `http://localhost:3000/auth/callback` in Authentication → URL Configuration
5. Create a storage bucket named `audio-files` (private)

### 4. Set up Polar.sh

1. Create an account at [polar.sh](https://polar.sh)
2. Create a product named "Kungwi Pro" with monthly & annual pricing
3. Add a webhook pointing to `https://yourdomain.com/api/webhooks/polar`
4. Select events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
kw9_x3mb7f/
├── app/
│   ├── (auth)/
│   │   ├── login/           # Sign in page
│   │   └── signup/          # Create account page
│   ├── (dashboard)/
│   │   ├── dashboard/       # Main dashboard + new transcription
│   │   ├── transcriptions/  # All transcriptions + individual view
│   │   └── settings/        # Account & upgrade
│   ├── api/
│   │   ├── transcribe/      # POST: upload + transcribe via Gemini
│   │   └── webhooks/polar/  # POST: handle Polar.sh payment events
│   ├── auth/callback/       # Supabase auth callback
│   └── page.tsx             # Landing page
├── components/
│   └── dashboard/
│       ├── Sidebar.tsx
│       ├── ExportButtons.tsx
│       └── SignOutButton.tsx
├── lib/
│   ├── supabase/            # Client, server, middleware helpers
│   ├── gemini.ts            # Transcription logic
│   ├── polar.ts             # Plan definitions & helpers
│   └── utils.ts             # Shared utilities
└── supabase/
    └── migrations/          # Database schema
```

---

## Plans

| Feature | Free | Pro |
|---|---|---|
| Daily transcriptions | 3/day | Unlimited |
| Max file size | 25MB | 500MB |
| Export formats | TXT | TXT, SRT |
| AI summary | ✗ | ✓ |
| Storage | 7 days | Permanent |

---

---

## Folders Management (implementation guide)

### DB
The `folders` table is already in the schema with `user_id`, `name`, `created_at`. Transcriptions have a nullable `folder_id` FK.

### Pages to build
- `app/(dashboard)/folders/page.tsx` — list all folders with transcription counts
- `app/(dashboard)/folders/[id]/page.tsx` — view transcriptions inside a folder

### Key queries
```ts
// Get folders with counts
const { data } = await supabase
  .from("folders")
  .select("*, transcriptions(count)")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

// Create folder
await supabase.from("folders").insert({ user_id, name });

// Move transcription to folder
await supabase
  .from("transcriptions")
  .update({ folder_id: folderId })
  .eq("id", transcriptionId);
```

### UI pattern
- Sidebar already has a "Folders" nav link pointing to `/dashboard/folders`
- Folder list page: grid of cards, each showing name + count + last modified
- Individual folder page: same layout as `/transcriptions` but filtered by `folder_id`
- On the transcription detail page, add a "Move to folder" dropdown (client component) that fetches folders and calls the update query above
- Add a "New folder" button that triggers an inline modal (name input → POST to a `/api/folders` route or direct Supabase call from a server action)

---

## Search (implementation guide)

### Approach: Supabase full-text search on `full_text`

Add this index to the migration (or run separately):
```sql
alter table public.transcriptions
  add column if not exists fts tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(full_text, ''))) stored;

create index if not exists transcriptions_fts_idx on public.transcriptions using gin(fts);
```

### Search query
```ts
const { data } = await supabase
  .from("transcriptions")
  .select("id, title, created_at, status, word_count, duration_seconds")
  .eq("user_id", user.id)
  .textSearch("fts", query, { type: "websearch", config: "english" })
  .order("created_at", { ascending: false });
```

### UI pattern
- Add a search input to the `/transcriptions` page header (controlled, debounced 300ms)
- On input change, re-fetch with the search query — use a client component wrapper around the list
- Highlight matched terms in results using a simple regex replace that wraps matches in `<mark>` tags styled with `bg-terra-light text-terra-dark`
- Empty state: "No results for '{query}'" with a clear button
- For a global search shortcut, add a `⌘K` command palette later using `cmdk` library

---

## Billing Portal Flow (implementation guide)

### What's already built
- Polar webhook at `/api/webhooks/polar` handles all subscription lifecycle events
- `profiles.plan` flips between `"free"` and `"pro"` automatically
- Settings page links to Polar checkout via `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID`

### Manage subscription (cancel/update)
Polar provides a customer portal URL. Add this API route:

`app/api/billing/portal/route.ts`
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.polar_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  // Polar customer portal URL
  const portalUrl = `https://polar.sh/purchases`;
  return NextResponse.redirect(portalUrl);
}
```

Then in the Settings page, for Pro users replace the upgrade CTA with:
```tsx
<a
  href="/api/billing/portal"
  className="text-sm text-terra hover:text-terra-dark font-medium transition-colors"
>
  Manage subscription →
</a>
```

### Webhook event reference
| Event | Action |
|---|---|
| `subscription.created` | Set plan = "pro", store polar IDs |
| `subscription.updated` | Re-check status, update plan accordingly |
| `subscription.canceled` | Set plan = "free" at period end |
| `subscription.revoked` | Immediate downgrade to "free" |

### Testing webhooks locally
```bash
# Use Polar's CLI or ngrok to forward to localhost
ngrok http 3000
# Then set webhook URL in Polar dashboard to:
# https://YOUR_NGROK_URL/api/webhooks/polar
```

---

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Make sure to add all environment variables in Vercel's project settings.
Set `NEXT_PUBLIC_APP_URL` to your production URL.
