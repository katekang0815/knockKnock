# Knock Knock

A Christian prayer app that turns how you feel into an honest conversation with God.

## About the project

Knock Knock is a Christian prayer app that turns a daily emotional check-in into a short, gentle conversation - with God at the center. Instead of rating your day one to ten, it asks how you are arriving, then helps you name the specific feeling underneath, talk it through, and turn that moment into a personal prayer and a fitting passage of Scripture.

## Purpose
Many people struggle to name what they are feeling - and struggle even more to bring it honestly to God. Knock Knock closes that gap. It gives anyone, from teens to older adults, a calm, private, judgment-free space to check in with their emotions and reflect through a caring AI conversation, then receive a personalized prayer and an encouraging Bible verse for exactly where they are. The goal is to make daily prayer feel less like an obligation and more like an honest, ongoing conversation - one small knock at a time.


### Screen Pages

- **Home Page**

- **Emotion Check-In Page**

- **Emotion Log/ AI chat**

### Tech Stack

```
- Frontend: React Native (Expo, SDK 54) · TypeScript · Reanimated · SVG
- Backend: Cloudflare Workers (serverless AI proxy) · Anthropic Claude API · KV (rate limits)
- Data: on-device only (AsyncStorage) - no accounts, no server DB
- Delivery: EAS Build + OTA (EAS Update)
```
