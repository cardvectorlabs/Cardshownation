# Submit-Show Form Audit

Audit of `/submit-show` completed 2026-04-21. Goal: reduce abandonment
for small card show promoters (often non-technical users) while still
collecting enough data for a useful listing.

## Current state

5 sections · 12 required fields · 7 optional · ~19 total inputs.
Mobile: scrolls past 3 screens before submit button. Form is at
[apps/web/app/submit-show/page.tsx](../apps/web/app/submit-show/page.tsx).

## Friction ranked by likely impact on dropoff

1. Duplicate name/email pairs (submitter + organizer) — for local
   promoters these are the same person. CSV evidence: most real
   submitters left one side blank or copied values.
2. `venueAddress` required — only ~12% of real submissions in the
   import CSV filled it in. Promoters know the venue name, not the
   street address.
3. Categories as required checkboxes — 4-column grid creates
   decision paralysis. 0 real submissions picked categories.
4. Start/end time as free-text — users type "9am", "9:00", "9 AM".
   Should be dropdowns.
5. Admission fieldset front-and-center (4 inputs) for something
   99% of shows handle identically. Hide it.
6. `parkingInfo`, `vendorDetails`, `description` visible — 0 real
   submissions filled them. Noise for the promoter's eye.
7. Submit button copy "Submit show for review" — sounds like work
   that might be rejected. No incentive.
8. No trust signals above the form.
9. No progress indicator — single long scroll feels infinite.
10. Inputs at 14px font — iOS will zoom on focus. Needs ≥16px.

## Fields to remove entirely

| Field | Rationale |
|---|---|
| Separate `organizerName` | Default to submitter; admin can split later |
| Separate `organizerEmail` | Same |
| `vendorDetails` | 0 real usage; fold into description if needed |
| `parkingInfo` | 0 real usage; admin can add post-approval |
| `admissionNotes` | Redundant with admissionPrice |
| Explicit `endTimeLabel` | Ask only if different from startTime |

## Ideal structure — 3 steps, 6 required fields

### Step 1 — What & When (4 required)
- Show name
- Date (single input, "Multi-day" toggle reveals end date)
- City
- State (dropdown, geo-default via /api/geoip)

### Step 2 — Where (2 required)
- Venue name
- Venue address — **optional**

### Step 3 — Contact + optional details (1 required)
- Email (required)
- Name (optional, derive display from email local-part)
- "▸ Add more details" expander contains: time, admission, tables,
  website/Facebook, categories, description

## Field-level fixes

| Current | Better |
|---|---|
| Name required | Optional |
| Email text input | `inputmode="email" autocomplete="email"` |
| startDate + endDate | Single date + checkbox for multi-day |
| Start time free text | `<select>` 30-min increments |
| Categories 4-col checkbox | Pills UI, max 3, label "Main focus?" |
| Venue + city separate | Single Google Places autocomplete (later) |
| State dropdown | Geo-default from /api/geoip |
| websiteUrl + facebookUrl | Single "Show link", parse on backend |
| Free/Paid radio + price | Single "Ticket price" (blank = Free) |
| "Submit show for review" | "**Submit show · Free**" w/ checkmark |

## Trust signal copy (above form)

> **Free listing · Live within 24 hours**
> Reach collectors searching for shows in your city. No account needed.
>
> ⭐⭐⭐⭐⭐ *"Posted my Kansas show on a Tuesday, had a full vendor list
> by Friday."* — Aerial S., Midwest Collectable Expo

Placeholder testimonial fine on day one; replace with a real one once
collected. Near submit button:

> By submitting, you agree your show can be listed publicly. No spam.
> We email only if your listing needs clarification.

## Mobile-specific

- Sticky submit bar at bottom of viewport
- `inputmode="numeric"` on tableCount
- `autocapitalize="words"` on name/city, `"off"` on email
- Input font size ≥16px (currently `text-sm` = 14px, causes iOS zoom)
- Single-column on mobile (already is)

## Implementation plan

### Week 1 — biggest wins, 2-4 hr each, low risk
1. Remove duplicate `organizerName` / `organizerEmail`; reuse submitter
2. Make `venueAddress` optional
3. Hide Admission fieldset behind "Add more details"
4. Change submit button copy
5. Add trust-signal header above form
6. Bump input font size to 16px

### Week 2 — 2-step progressive disclosure
7. Split into Step 1 (What & When) + Step 2 (Where + Contact)
8. Convert time inputs to dropdowns

### Week 3 — nice-to-have
9. Geo-default state dropdown
10. Single "show link" field with website/Facebook auto-detect
11. Sticky mobile submit bar
