# Knock Knock

A mobile prayer companion that helps users build a daily habit of reflection through emotional check-ins, guided prayer, and faith-based conversation.

## About the project

Knock Knock turns a daily emotional check-in into a short, gentle conversation. Instead of rating your day one to ten, it asks how you are arriving - then helps you find the specific feeling underneath, talk it through with an AI companion, and turn it into a personalized reflection and a fitting passage.


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
