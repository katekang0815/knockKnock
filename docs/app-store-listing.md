# App Store submission notes — KnockKnock: Daily Prayer

Copy-paste reference for the public App Store listing. These are **not** needed for
TestFlight — only for the public submission ("Add for Review").

Bundle ID: `com.katekang.knockKnock` · App name: **KnockKnock: Daily Prayer**

---

## 1) Listing copy (App Store Connect → Distribution / App Information)

### Subtitle (≤30 chars)
```
Prayer for how you feel
```
Alternates: `Faith for your feelings` · `Pray through your emotions`

### Promotional text (≤170 chars — editable anytime, no review)
```
Feeling anxious, grateful, or somewhere in between? Pause, check in, and turn this moment into prayer — a gentle companion for your faith and your feelings.
```

### Description (≤4000 chars)
```
KnockKnock is a gentle prayer companion that meets you where you are — in whatever you're feeling right now.

Some days are sunny. Some are stormy. KnockKnock helps you pause, notice how you feel, and turn that moment into prayer.

HOW IT WORKS
• Check in with your emotion — choose what you're feeling and a little context.
• Talk it through — a warm, caring companion listens and reflects with you, without rushing to fix.
• Pray & find peace — when you're ready, create a personal prayer or discover a Bible verse that speaks to your moment.
• Look back — your check-ins are saved as a quiet record of your week.

MADE FOR
Anyone growing in their faith — at any age — who wants a simple, judgment-free space to reflect, pray, and feel a little less alone.

PRIVATE BY DESIGN
No account. No sign-up. Your check-ins stay on your device. We don't sell your data, show ads, or track you.

A GENTLE NOTE
KnockKnock is for reflection and encouragement — it is not a therapist or medical service. If you're ever in crisis, please reach out to someone you trust, or call or text 988.

Knock, and the door will be opened.
```

### Keywords (≤100 chars, comma-separated, no spaces; don't repeat words in the app name)
```
christian,faith,bible,verse,devotion,emotions,mood,feelings,gratitude,journal,god,reflection,peace
```

### URLs
- **Support URL:** https://katekang0815.github.io/knockKnock/support.html
- **Privacy Policy URL:** https://katekang0815.github.io/knockKnock/privacy-policy.html
- **Marketing URL:** (optional — leave blank)

---

## 2) App Privacy questionnaire (App Store Connect → App Privacy)

**"Do you or your third-party partners collect data from this app?"** → **Yes**
(Chat text is sent to the Worker → Anthropic; a device ID is sent for rate-limiting.)

Add exactly **two** data types:

### Data type 1 — User Content → "Other User Content"
(the messages typed + emotion/context, sent to the AI to generate a reply)
- Used for: **App Functionality** (only)
- Linked to the user's identity? **No** (no account, no name/email)
- Used for tracking? **No**

### Data type 2 — Identifiers → "Device ID"
(the random app-generated ID, sent only to enforce usage limits)
- Used for: **App Functionality** (only)
- Linked to the user's identity? **No**
- Used for tracking? **No**

**Everything else → Not Collected:** no name, email, phone, precise location, contacts,
health data, financial info, browsing history, purchases, or analytics/advertising data.

**"Used for tracking" across the whole app?** → **No** (keeps you out of App Tracking
Transparency — no tracking prompt needed).

### Notes / judgment calls
- Chat is classified as **"Other User Content"** (free text), not "Health" — emotion
  check-ins aren't Apple-"Health" data (that's Health-app/medical data).
- Both types marked **"Not linked to identity"** since there are no accounts and no user
  profiling. You *may* mark Device ID as "Linked" to be extra-conservative — not required.
- Keep these answers accurate: if you later add analytics, accounts, or a paywall, update this.

---

## 3) Pre-submission checklist
- [ ] Paste subtitle / promo / description / keywords (above)
- [ ] Add iPhone 6.5" screenshots (1242 × 2688 px), at least 1–3
- [ ] Complete App Privacy questionnaire (above)
- [ ] Complete Age Rating questionnaire
- [ ] Set Worker `PER_DEVICE_DAILY_CHECKINS` back to **5** and `wrangler deploy`
- [ ] Confirm build has EAS Update baked in (build 2+)
- [ ] Add for Review
