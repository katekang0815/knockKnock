# knockKnock — Privacy Policy

**Last updated: August 14, 2026**

knockKnock ("the app," "we," "us") is a prayer and emotional check-in app for teens
and young adults in a Christian faith context. This policy explains what information
the app handles and how. We built knockKnock to be **private by default** — there
are no accounts, and your check-ins stay on your device.

> This is a plain-language policy. If anything is unclear, contact us (below).

---

## The short version

- **No account, no sign-up.** We don't ask for your name, email, phone number, or location.
- **Your check-ins stay on your phone.** Emotions, notes, and saved verses are stored
  locally on your device, not on our servers.
- **What you type in the AI chat is sent to an AI provider** (Anthropic) to generate a
  response, through our own secure relay. It is used to reply to you, not to advertise to
  you or identify you.
- **We don't sell your data, show ads, or track you across other apps.**

---

## What the app stores on your device

The following is saved **locally on your device only** (using your phone's app storage),
and is not uploaded to any server we control:

- Your check-ins: the date, the emotion and category you selected, any context tags you
  chose (for example what you were doing or who you were with), a short note based on what
  you shared, and any Bible verse saved from a chat.
- A random **device identifier** the app generates on first launch (a string of letters
  and numbers). It is **not** linked to your identity — it's used only to apply usage
  limits (see below).

You can erase all of this at any time by deleting the app from your device.

## What is sent when you use the AI chat

When you chat, pray, or look for a verse, the app sends the following to our relay server,
which forwards it to our AI provider (**Anthropic**, maker of Claude) to generate a reply:

- The messages you type, the emotion and context you selected, and a brief summary of your
  recent check-ins (from the past week) so the response fits your situation.
- Your random **device identifier** and a per-session identifier, used **only** to enforce
  usage limits and prevent abuse.

**We never send your name, email, or contact information — because we never collect it.**

## Our relay server (Cloudflare)

To keep our AI credentials safe and to limit usage, chat requests pass through a small
relay we operate on **Cloudflare Workers**. This relay:

- Forwards your chat request to Anthropic and returns the reply.
- Stores only **counters** (your device identifier plus a date and a request count) to
  enforce daily limits. These counters **expire automatically after about two days** and
  do **not** include the content of your messages.

## Our AI provider (Anthropic)

The text described above is processed by **Anthropic** to generate the app's responses.
Under Anthropic's commercial API terms, your inputs and the outputs are **not used to
train their models**, and are retained by Anthropic only for a limited period consistent
with its policies (for example, for trust-and-safety purposes). See Anthropic's privacy
policy at https://www.anthropic.com/legal/privacy for details.

## What we do NOT do

- We do **not** require or collect names, emails, phone numbers, or precise location.
- We do **not** show advertising.
- We do **not** use third-party analytics or tracking SDKs, and we do **not** track you
  across other apps or websites.
- We do **not** sell or rent your information to anyone.

## Sensitive information

Check-ins can reflect your **emotions and your faith**, which are personal and sensitive.
We treat them accordingly: they are stored on your device, and the chat text sent to our
AI provider is used only to respond to you. Please avoid sharing information that could
identify you or others (full names, addresses, school names) in the chat — the app is
designed to help without needing it.

## Not a crisis or medical service

knockKnock is not a therapist, counselor, or medical service, and does not provide medical
or psychological advice. If you are in crisis or thinking about harming yourself, please
reach out to a trusted adult or contact the 988 Suicide & Crisis Lifeline (call or text
**988** in the U.S.).

## Children's privacy

knockKnock is intended for users **13 and older** and is **not directed to children under
13**. We do not knowingly collect personal information from children under 13. Because the
app has no accounts and collects no contact information, it does not gather identifying
personal data from any user. If you believe a child under 13 has provided personal
information, contact us and we will address it.

## Data retention & deletion

- **On your device:** kept until you delete it in the app or uninstall the app.
- **On our relay (Cloudflare):** only usage counters, which expire automatically after
  about two days.
- **At Anthropic:** retained per Anthropic's policies for a limited period.

To delete everything the app has stored, **delete the app** from your device.

## Security

Chat requests are sent over encrypted connections (HTTPS). Our AI credentials are kept on
the server side and never shipped inside the app. No method of transmission or storage is
100% secure, but we take reasonable measures to protect your information.

## International users

The app's AI processing and relay may occur on servers located in the United States or
other countries. By using the app, you understand that your chat content may be processed
in those locations.

## Changes to this policy

We may update this policy as the app evolves. When we do, we'll change the "Last updated"
date above and post the new version at this page.

## Contact

Questions about this policy or your data? Contact us at:

**[YOUR CONTACT EMAIL]**

---

*knockKnock is an independent app. "Claude" and related marks are property of Anthropic;
"Cloudflare" is a trademark of Cloudflare, Inc.; "Apple" and "App Store" are trademarks of
Apple Inc. These companies are service providers or platforms and do not endorse this app.*
