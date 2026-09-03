# ✨ ReflectAI — Gemini Journal & Reflections

A secure, AI-powered personal journaling and student productivity companion built with **Google Gemini, Firebase Authentication, Cloud Firestore, Express, Vite, React 19, TypeScript, Secret Manager, and Cloud Run**.

ReflectAI transforms personal reflections into practical, actionable steps through the following flow:
**Journal Reflection → AI Insight → Suggested Goal → Action Plan → Today's Focus → Progress Tracking**

---

## 🚀 Live Demo

**Cloud Run:**  
https://gemini-journal-reflections-479456716677.asia-southeast1.run.app

---

## 🌟 Project Overview
ReflectAI started as a secure personal AI journaling application and has been extended into a **Personal AI Life & Student Productivity Assistant**.

Instead of only storing journal reflections, ReflectAI helps users understand their thoughts and convert them into realistic goals and focused daily actions.

### Core Flow

```text
📝 Journal Reflection
        ↓
💡 AI Insight
        ↓
🎯 Suggested Goal
        ↓
📋 AI Action Plan
        ↓
📅 Today's Focus
        ↓
📊 Progress Tracking



🧩 Architecture & Key Features

🔐 1. Secure Authentication
• Firebase Authentication
• Google Sign-In
• Anonymous / Guest Sign-In
• No passwords stored by the application
• Authentication state handled securely

🛡️ 2. User-Isolated Cloud Firestore

All user interactions are stored inside an authenticated user's own Firestore boundary:
/users/{userId}/interactions/{interactionId}

The application uses Firestore security rules to ensure that:
• Users can access only their own data
• Other authenticated users cannot access another user's data
• Unauthenticated users cannot access protected interaction data
• Daily Focus data remains inside the user's existing interaction

✨ 3. Gemini Multi-Turn Reflection

ReflectAI supports multi-turn conversations with Gemini.

Users can:
• Start a reflection
• Continue the conversation
• Ask follow-up questions
• Explore thoughts through multiple turns
• Generate structured AI insights

The application uses a resilient Gemini model fallback architecture to improve reliability.

💡 4. Four Reflective AI Lenses

ReflectAI provides different reflection modes:
1) Deep Reflection & Growth
  • Explores thoughts and patterns
  • Identifies strengths
  • Encourages deeper reflection
2) Creative Brainstorming
  • Generates new perspectives
  • Expands ideas
  • Encourages creative exploration
3) Action & Execution
  • Converts ideas into practical steps
  • Creates structured execution paths
  • Helps prioritize actions
4) Mindful Grounding
  • Provides a calm reflective experience
  • Encourages present-moment awareness
  • Supports thoughtful reflection


🎯 Feature 1 — AI Insight, Goal & Action Plan

ReflectAI can transform a journal reflection into an actionable plan.

• Flow
 Reflection
     ↓
 Key Insight
     ↓
 Suggested Goal
     ↓
 Suggested Action Plan
     ↓
 Suggested Next Step

The generated Action Plan contains practical steps that the user can review, regenerate, and use as the foundation for their daily focus.

• Example
  Suggested Goal
  Create a prioritized list of current assignments and complete the highest-priority task first.

• Action Plan
1) List current assignments, projects, and deadlines.
2) Rank them by urgency and academic importance.
3) Select the highest-priority assignment.
4) Break it into manageable subtasks.
5) Complete the first subtask during a focused study session.


📅 Feature 2 — Today's Focus

The Daily Focus feature converts an existing Action Plan into a smaller list of tasks for the current day.

Daily Focus allows users to:
• Select 1–3 existing Action Plan steps
• Create a focused list for today
• Mark tasks complete/incomplete
• View live progress
• Reopen the Daily Focus later
• Retain progress after refreshing
• Retain progress after signing out and signing back in
• Reuse Action Plan tasks on another date

•Example
 📅 Today's Focus

 Goal:
 Complete the highest-priority academic task first.

 Today's Tasks:
 ☑ List current assignments and deadlines
 ☐ Select the highest-priority assignment
 ☐ Break the assignment into smaller subtasks

 Progress:
 1 of 3 completed

Non-Destructive Design
Completing Daily Focus tasks does not modify the original Action Plan.
The original Action Plan remains available for future planning.


📊 AI Synthesis & Insights

ReflectAI can generate structured summaries from a conversation, including:
• Executive Summary
• Key Breakthroughs
• Key Takeaways
• Thematic Tags

Users can also export generated information as:
• Markdown
• JSON


🗂️ Journal History

The application provides persistent Journal History with:
• Saved interactions
• Conversation turn counts
• Timestamps
• Search
• Mode filtering
• Session editing
• Session deletion


🔒 Security Architecture
Security is a core part of the application.

Authentication
Firebase Authentication manages user identity.

Firestore Isolation
User data is isolated using:
/users/{userId}/interactions/{interactionId}
with authentication-aware Firestore rules.

Secret Management
Sensitive Gemini credentials are not hardcoded into the application.
Secrets are handled through secure server-side configuration and Google Cloud Secret Manager where applicable.

Security Principles
• No hardcoded API keys
• No exposed service-account keys
• No passwords stored by the application
• User-isolated Firestore access
• Server-side secret handling
• Protected authentication flows
• Journal content treated as untrusted input


☁️ Google Cloud Run
The application is deployed using Google Cloud Run.

Production Service

Service:
gemini-journal-reflections

Region:
asia-southeast1

Required Challenge Label
dev-tutorial=cloud-run-ai-challenge


🛠️ Technology Stack

| Technology                  | Purpose                              |
| --------------------------- | ------------------------------------ |
| Google Gemini               | AI reflection, insights and planning |
| React 19                    | Frontend UI                          |
| TypeScript                  | Application development              |
| Vite                        | Frontend tooling and build           |
| Express                     | Server-side API                      |
| Firebase Authentication     | User authentication                  |
| Cloud Firestore             | Secure persistent storage            |
| Google Cloud Secret Manager | Secret management                    |
| Google Cloud Run            | Application deployment               |
| GitHub                      | Source control                       |


📋 Prerequisites

For local development, you may need:
• Node.js v20+
• Google Cloud project
• Firebase project
• Google Cloud SDK (gcloud)
• Required Firebase and Google Cloud services configured


💻 Local Development

1. Clone the repository
git clone https://github.com/tanvishinde2312-ux/personal-gemini-journal.git
cd personal-gemini-journal

2. Install dependencies
npm install

3. Configure environment variables
Create a local .env file based on .env.example.

Example:
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"

Never commit real API keys or secrets to GitHub.

4. Start the development server
npm run dev

Then open:
http://localhost:3000


🛡️ Cloud Firestore Security Rules

The application uses authentication-aware rules to maintain user isolation.
The core interaction rule follows:
match /users/{userId}/interactions/{interactionId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
This ensures that a signed-in user can access only their own interaction data.

Daily Focus is stored within the existing interaction document rather than creating a global collection.


🧪 Functional Testing

Authentication
• Sign in with Google
• Continue as Guest
• Sign out
• Sign back in

Reflection
• Select a reflection mode
• Enter a reflection
• Start a Gemini conversation
• Continue with follow-up messages

AI Features
• Generate AI Summary
• Generate AI Insight
• Generate Suggested Goal
• Generate Action Plan
• Regenerate Action Plan

Daily Focus
1) Open an existing Action Plan.
2) Select Today's Focus.
3) Select 1–3 action steps.
4) Save Daily Focus.
5) Mark a task complete.
6) Verify progress updates.
7) Close and reopen Daily Focus.
8) Refresh the page.
9) Sign out and sign back in.
10) Verify Daily Focus persists.
11) Verify the original Action Plan remains unchanged.

Security
Verify that:
• A user can access their own data.
• A user cannot access another user's data.
• Unauthenticated users cannot access protected interaction data.
• No API keys or credentials are exposed.


📁 Project Structure

personal-gemini-journal/
│
├── public/
├── src/
│   ├── components/
│   │   ├── ActiveSession.tsx
│   │   ├── DailyFocusModal.tsx
│   │   ├── PlanModal.tsx
│   │   └── SidebarHistory.tsx
│   │
│   ├── lib/
│   │   ├── dailyFocus.ts
│   │   └── firebase.ts
│   │
│   ├── App.tsx
│   └── types.ts
│
├── firestore.rules
├── firebase-blueprint.json
├── server.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md


🏆 Current Project Status

Completed
✔️ Firebase Authentication
✔️ Google Sign-In
✔️ Anonymous / Guest Sign-In
✔️ User-isolated Cloud Firestore
✔️ Gemini multi-turn reflection
✔️ Journal History
✔️ AI Summary
✔️ AI Insight
✔️ Suggested Goal
✔️ AI Action Plan
✔️ Action Plan regeneration
✔️ Daily Focus
✔️ 1–3 task selection
✔️ Daily task completion tracking
✔️ Progress tracking
✔️ Local calendar date handling
✔️ Daily Focus persistence
✔️ Authentication persistence
✔️ Firestore security verification
✔️ Cloud Run deployment
✔️ GitHub source-code backup


🔮 Future Development

Potential future improvements include:
• More personalized productivity insights
• Long-term progress analytics
• Smarter goal tracking
• Additional student productivity features
• AI-assisted reflection trends


👩‍💻 Author

Tanvi Shinde

Computer Engineering Student

This project was developed as part of the Google Cloud Gen AI Academy APAC — Cohort 3 journey and expanded into a personal AI journaling and student productivity application.


📜 License
This project is intended for educational and demonstration purposes.

