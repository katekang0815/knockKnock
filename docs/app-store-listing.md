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

## 2) App Privacy questionnaire (App Store Connect → App Privacy)  ✅ SUBMITTED

**"Do you or your third-party partners collect data from this app?"** → **Yes**
(Feedback message + optional email are emailed to the owner; chat text is sent to the
Worker → Anthropic; a random device ID is sent for rate-limiting.)

**Privacy Policy URL:** https://katekang0815.github.io/knockKnock/privacy-policy.html

Four data types declared — **all "Used for: App Functionality" only, none "Used for tracking":**

### 1. Contact Info → "Email Address"
(the optional email in the in-app feedback form, used only to reply)
- Used for: **App Functionality**
- Linked to identity? **No** (as submitted) — *note: email is personal data, so Apple's
  stricter reading is "Yes/Linked"; can be edited to Linked to be exact*
- Tracking? **No**

### 2. User Content → "Customer Support"
(the feedback message text)
- Used for: **App Functionality**
- Linked to identity? **No** (as submitted) — *same note as Email Address (rides with it)*
- Tracking? **No**

### 3. User Content → "Other User Content"
(the messages typed + emotion/context, sent to the AI to generate a reply)
- Used for: **App Functionality**
- Linked to identity? **No** (chat carries only the random device ID — no name/email)
- Tracking? **No**

### 4. Identifiers → "Device ID"
(the random app-generated ID, sent only to enforce usage limits)
- Used for: **App Functionality**
- Linked to identity? **No** (random, not tied to an account or personal data)
- Tracking? **No**

**Everything else → Not Collected:** no name, phone, precise/coarse location, contacts,
health/fitness, financial info, browsing/search history, purchases, usage/analytics,
diagnostics, or advertising data.

**"Used for tracking" across the whole app?** → **No** (keeps you out of App Tracking
Transparency — no tracking prompt needed).

### Notes / judgment calls
- Chat is classified as **"Other User Content"** (free text), not "Health" — emotion
  check-ins aren't Apple-"Health" data (that's Health-app/medical data). This stays
  consistent with the Age Rating answer **Medical/Treatment Information = None**.
- Feedback message → **"Customer Support"**; the optional reply email → **"Email Address"**.
- As submitted, all four are **"Not linked to identity"** (no accounts, no user profiling).
  Email Address + Customer Support are the two that could/should be flipped to **"Linked"**
  since an email is personal data tied to a real contact — accuracy tweak, low risk either way.
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
