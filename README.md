# Knock Knock

Knock Knock is a personal Christian prayer app built around emotional check-ins, for a general audience aged 13+ who want to grow in their faith. The name comes from Revelation 3:20, "I stand at the door and knock." Every check-in is a gentle opening toward God, inviting Him into the moment the user is experiencing.

## Tech Stack

- **Frontend:** React Native (Expo) · TypeScript · Reanimated · SVG
- **Backend:** Cloudflare Workers (serverless AI proxy) · Anthropic Claude API · KV (rate limits)
- **Data:** on-device only (AsyncStorage) - no accounts, no server DB
- **Delivery:** EAS Build + OTA (EAS Update)

## Key Features

- **The conversation layer** - staged system prompts and a rolling memory, so the model tracks each user's context over time.
- **The backend** - a Cloudflare Workers proxy that keeps credentials server-side and rate-limits per device, so inference cost stays around a dollar per user per month.
- **The client** - a gesture-driven 60fps UI with OTA updates through EAS, so I could ship fixes without waiting on App Review.

## Screens

<img width="832" height="998" alt="Screenshot 2026-09-04 at 8 33 53 PM" src="https://github.com/user-attachments/assets/cadabb61-1efe-41e6-a46f-0721cf162697" />
