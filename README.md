# Gemini Journal & Reflections

A secure, user-authenticated personal journaling and reflective companion built with **Firebase Authentication**, **Cloud Firestore**, **Express + Vite (React 19 & TypeScript)**, and the **Gemini 3.6 Flash API**.

---

## 🌟 Architecture & Key Features

- **🔐 Federated User Authentication**: Google Sign-In with Firebase Auth, ensuring user identities are managed securely without ever storing passwords.
- **🛡️ Strict User Isolation in Cloud Firestore**: All reflections, conversation turns, and summaries are strictly quarantined in owner-bound document paths (`/users/{userId}/interactions/{interactionId}`), guarded by locked-down `firestore.rules`.
- **✨ Gemini 3.6 Flash Conversational Guidance**: Multi-turn reflective dialogues with an automated resilient model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **💡 4 Tailored Reflective Lenses**:
  1. *Deep Reflection & Growth*: Unpacks emotions, identifies cognitive strengths, and asks introspective questions.
  2. *Creative Brainstorming*: Generates innovative angles, expands ideas, and explores divergent pathways.
  3. *Action & Execution*: Transforms scattered thoughts into prioritized, milestone-driven roadmaps.
  4. *Mindful Grounding*: Provides a soothing, calm space for mindful de-escalation and presence.
- **📊 Instant AI Synthesis**: Generates structured executive summaries, key takeaways, and thematic tags with single-click export to Markdown or JSON.
- **🔒 Zero Hardcoding Hygiene**: Gemini API keys and sensitive credentials are encrypted and stored via Google Cloud Secret Manager or environment variables.

---

## 📋 Prerequisites & Local Development

### 1. Prerequisites
- Node.js v20+
- A Google Cloud project with billing enabled
- Google Cloud SDK (`gcloud`) installed and authenticated

### 2. Environment Setup
Clone the repository and install dependencies:

```bash
npm install
```

Configure your `.env` file based on `.env.example`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🛡️ Cloud Firestore Security Rules

To guarantee complete cross-user data isolation where each user can only read and write their own journal entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User interactions and journal entries isolation
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🚀 Google Cloud Run Deployment & Secret Manager Setup

Follow these steps to deploy the application to Google Cloud Run in compliance with production security standards.

### Step 1: Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### Step 2: Create Secret in Secret Manager
Store your Gemini API key in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run compute service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Deploy to Cloud Run
Deploy the application using `gcloud run deploy`, mounting the secret from Secret Manager into the container environment:

```bash
gcloud run deploy gemini-journal-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### Step 4: Apply Mandatory Campaign Verification Label
Update the Cloud Run service with the required challenge tracking label:

```bash
gcloud run services update gemini-journal-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Test Guide

1. **Authentication Flow**:
   - Navigate to the root landing page.
   - Click **"Sign in with Google"** (or **"Continue as Guest"**).
   - Verify redirect to the private reflection dashboard.
2. **Multi-Turn Reflective Dialogue**:
   - Select a mode (e.g., *Deep Reflection*).
   - Enter a personal reflection or select an inspiration chip and click **"Reflect"** (`Cmd/Ctrl+Enter`).
   - Confirm that Gemini responds with structured insights and probing questions.
   - Send a follow-up reply to verify multi-turn context retention.
3. **Database Isolation & Persistence**:
   - Check the **"Firestore Saved"** status indicator.
   - Verify that the interaction appears in the **Journal History** sidebar with timestamps and turn counts.
   - Refresh the page to confirm that your session history persists accurately.
4. **AI Synthesis & Insights**:
   - Click **"Generate AI Summary"** in an active session.
   - Review the generated Executive Summary, Key Breakthroughs, and Tags.
   - Test **"Copy as Markdown"** and **"Export JSON"** downloads.
5. **Session Management**:
   - Click the title to edit and rename the session.
   - Use the search bar and mode filter chips in the history drawer.
   - Click the trash icon, verify the confirmation dialog, and delete an entry cleanly.
