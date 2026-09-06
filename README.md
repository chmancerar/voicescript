# VoiceScript 🎙️✨

**VoiceScript** is a modern, responsive web application for multimodal audio transcription and linguistic analysis powered by **Google Gemini 3.8 Flash**.

---

## 🌟 Key Features

### 1. Three Versatile Transcription Modes
* **Standard Transcription**: Speaker identification with timestamps (e.g. `[00:23] Speaker 1:`). Timestamps are interactive—click any timestamp to immediately jump to that point in audio playback.
* **Subtitle Generation (`.srt`)**: SubRip subtitle format with millisecond timecodes (`00:00:01,000 --> 00:00:04,000`). Click any subtitle block to jump the audio player directly to that cue. Includes single-click `.srt` export and clipboard copying.
* **Clean Transcription**: Natural spoken text without timestamps or speaker labels, ideal for summaries, articles, and documentation.

### 2. Audio Analysis & CEFR Evaluation
* **Concise Audio Summary**: Quick 2–3 sentence overview of spoken contents.
* **Estimated CEFR Language Level**: Linguistic evaluation (A1, A2, B1, B2, C1, C2) with an accompanying rationale explaining vocabulary range and grammatical complexity.
* **Immediate Duration Probing**: Instant audio length detection upon file selection.

### 3. Audio Player & Navigation
* Embedded HTML5 audio player synchronized with the live transcript.
* **Auto-Scroll Control**: Toggle auto-scroll on or off to follow playback or scroll through the transcript freely without view-snapping.
* **In-Transcript Search**: Live keyword search with match counter and navigation controls.
* **Format Flexibility**: Supports MP3, WAV, M4A, FLAC, OGG, AAC, WebM, and Opus files up to 15MB.

### 4. Client-Side API Key Management
* Easily enter and store your Gemini API key in local browser storage, or configure it via `.env` / deployment variables.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chmancerar/voicescript.git
   cd voicescript
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Copy the example environment file and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: You can also enter your API key directly in the web UI without configuring a `.env` file.)*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🛠️ Tech Stack

* **Framework:** React 19
* **Build Tool:** Vite 6
* **Styling:** Tailwind CSS v4
* **AI Model:** Google Gemini 3.8 Flash (`@google/genai` SDK)
* **Animation:** Motion (v12)
* **Icons:** Lucide React

---

## 📄 License

MIT License. Feel free to use, modify, and distribute.
