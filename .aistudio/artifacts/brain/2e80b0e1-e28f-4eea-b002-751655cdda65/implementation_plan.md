# Project Eklavya: AI EdTech Learning Platform

An Indian curriculum-aligned, cognitive-science grounded EdTech SaaS platform featuring an AI Mentor, RAG-indexed Document Vault, 3D Flashcards, Adaptive Quizzes, Career Roadmaps, and Live Voice Tutoring.

### User Review & Critical Decisions

> [!IMPORTANT]
> The backend specification defines FastAPI + Supabase pgvector endpoints (`/api/user/sync`, `/api/user/onboard`, `/api/upload`, `/api/documents/{user_id}`, `/api/documents/{doc_id}`, `/api/query`, `/api/study-tools`).
> For seamless usage in both the cloud preview and local development:
> - **Dual-Engine Execution**: Preloaded high-quality NCERT/CBSE curriculum knowledge base (Class 10 Math: Real Numbers, Triangles, Trigonometry; Class 10 Science: Chemical Reactions, Light) combined with an active live backend connector switch.
> - **Live FastAPI Proxy & Render Gateway Bar**: Supports connecting to remote endpoints (e.g. `https://project-eklavya-5yuy.onrender.com`) and local development server (`http://127.0.0.1:8000`), complete with latency pinging and status monitoring.
> - **Clerk Auth Simulation**: Authentic Clerk-inspired modal and persistent profile state with instant one-click login and profile switching.
> - **Badges & Achievement Progression**: Earned achievements based on XP, daily streak, and subject milestones ('Early Bird', 'Math Wizard', 'Consistent Learner', 'Grandmaster').
> - **Stacking Context & Dropdown Overlap Fix**: Multi-layer z-index hierarchy (`header` at `z-[80]`, dropdown at `z-[100]`, backdrop at `z-[90]`, `ContextControlBar` at `z-20`) guaranteeing the profile dropdown never gets overlapped by control bars or body elements.

---

### 1. Overview & Core Concept

- **What It Does**: Project Eklavya is an AI mentor tailored for Indian students (CBSE, ICSE, State boards). Students upload textbook PDFs to their Curriculum Vault, converse in Hinglish, Hindi, or English with an AI mentor equipped with active recall checkpoints, review spaced repetition flashcards, test mastery in the Quiz Arena, explore vocational career pathways, and speak naturally using speech synthesis.
- **Target Audience / Persona**: Class 9–12 and undergraduate Indian students preparing for board exams, competitive entrances (JEE/NEET), or mastering core academic curricula with bilingual explanations.
- **Key Value**: Bridges academic theory with intuitive cultural analogies (e.g. cricket, cooking, metro rail), reinforces cognitive retention via Ebbinghaus spacing and Sweller's cognitive load theory, and grounds every answer in the student's own textbooks.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Background Aesthetic**: Organic warm beige canvas (`#F6F4EE`) layered with a subtle custom inline SVG geometric math/science doodle pattern.
- **Brand Palette (60-30-10 Rule)**:
  - Canvas (60%): Warm Ivory / Beige (`#F6F4EE`, `#FAF9F5`, translucent glass white `#FFFFFFE6`)
  - Structural Panels & Dividers (30%): Deep Forest Green (`#284E38`) headers/borders, subtle golden hairline dividers (`#8C6D2320`), warm parchment cards (`#FDFBF7`)
  - High-Intent Accents (10%): Terracotta Orange (`#B85C38`) for active states, CTA triggers, active recall checkpoints, and Muted Gold (`#8C6D23`) for highlighted keywords and badges
- **Surface Elevation**: Glassmorphism with `backdrop-blur-md`, `rounded-3xl` corners, soft ambient box shadows (`shadow-sm`, `shadow-xl`), hairline border accents.
- **Typography**: Display typography using `Plus Jakarta Sans` / `Outfit` styling with balanced headlines, readable body text, and tabular numbers for streak/XP counters and timers.

#### Key User Flows & Core Modules
1. **Top Server Gateway Bar**:
   - Connection input for live backend (`https://project-eklavya-5yuy.onrender.com` / `http://127.0.0.1:8000`).
   - Latency monitor and live status indicator.
2. **Global Header**:
   - App Wordmark ("Project Eklavya: Guru for Modern India").
   - Integrated Pomodoro Timer: 25:00 / 05:00 focus/break intervals, circular countdown visualizer, start/pause/reset controls.
   - Gamification Tracker: Flame streak counter (days active) and Trophy XP meter with level progression.
   - Clerk User Avatar & Dropdown (`z-[100]`) with direct profile navigation, Clerk account switcher, and sign-out.
3. **Sticky Context Control Bar**:
   - Subject Selector (populated from user profile: Mathematics, Science, Social Science, Computer Applications).
   - Document Vault Filter (filtered by selected subject + "📚 Entire Subject" option).
   - Output Language Switcher (Hinglish, Hindi, English).
4. **Tab 1: AI Mentor Chat & D3 Concept Map**:
   - Split view between conversational mentor chat and interactive D3.js curriculum concept network.
   - Real-time speech recognition and chunked TTS.
5. **Tab 2: Curriculum Vault**:
   - PDF vectorization, chunk inspection, and hover-reveal document management.
6. **Tab 3: Quiz Arena**:
   - Adaptive 4-MCQ quizzes with instant feedback, explanations, and confetti rewards.
7. **Tab 4: 3D Flashcards**:
   - Spaced repetition cards with audio flip and self-grading (Again, Hard, Good, Easy).
8. **Tab 5: Career Map (Roadmap)**:
   - Syllabus-to-industry pathways for high-impact Indian technology hubs, space missions, and engineering.
9. **Tab 6: Talk Live (Voice)**:
   - Voice-first tutor with audio waveform visualizer.
10. **Tab 7: Profile, Badges & Activity Log**:
    - Comprehensive Badges component with unlocked/locked milestone trackers, XP rewards, and achievement modal.
    - Activity timeline for study sessions and mastery.
11. **Tab 8: About & Learning Science**:
    - Interactive Ebbinghaus forgetting curve and Sweller's cognitive load theory.
