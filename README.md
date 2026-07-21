# 🥷 Cluelessly — Free, Local & Stealthy AI Interview Copilot

**Cluelessly** is a 100% free, open-source, and fully local desktop copilot designed to help developers solve technical interview coding problems in real-time. 

Unlike paid subscription services like Interview Coder, **Cluelessly runs completely offline on your own machine**. It leaves zero API trails, costs $0 to run, protects your privacy, and stays completely invisible to screen-sharing software.

---

## ✨ Features

* 🔒 **100% Local & Free:** Powered locally by **Ollama** (`qwen2.5-coder:1.5b`) and native Windows OCR. No API keys, no monthly subscriptions, no rate limits.
* 👻 **Hardware-Level Stealth:** Features OS content protection to remain **100% invisible to screen-sharing software** (Zoom, Microsoft Teams, Google Meet, Discord).
* ⚡ **Ultra-Fast Native OCR:** Uses Windows Native Media OCR engine directly in Rust—extracts text from screenshots in ~30ms without cloud roundtrips.
* 💬 **Interactive Follow-up Chat:** Ask clarifying questions, request solutions in different languages, or optimize time/space complexity dynamically.
* 🎨 **Minimalist Floating Pill UI:** Unobtrusive design that hovers over your IDE, expands dynamically on demand, and features full syntax highlighting.
* ⌨️ **Native Global Hotkeys:** Control visibility instantly with global keyboard shortcuts (`Alt + B`).

---

## 🏗️ Architecture & How It Works
[ Screen Screenshot ]
│
▼ (30ms local extraction)
[ Windows Native OCR (Rust) ]
│
▼ (Clean text string)
[ Ollama / Qwen2.5-Coder (1.5B) ]
│
▼ (Real-time Markdown stream)
[ Translucent Tauri v2 Floating Overlay ]

---

## 🚀 Prerequisites

1. **Windows 10/11** (Required for native Windows OCR support)
2. **Node.js** (v18 or higher)
3. **Rust Toolchain** (Install via [rustup.rs](https://rustup.rs/))
4. **Ollama** installed and running locally.

---

## 🛠️ Installation & Setup

### 1. Clone the repository
cd cluelessly
2. Install Node dependencies
Bash
npm install
3. Pull the Local Code Model
Pull the ultra-fast 1.5B coding model using Ollama:

ollama run qwen2.5-coder:1.5b
4. Run in Development Mode

npm run tauri dev
🎮 How to Use
Show / Hide Overlay: Press Alt + X anytime to instantly toggle the visibility of the copilot.

Solve Problem: Click Screenshot to capture your screen, run native OCR, and stream the solution.

Interactive Chat: Once a solution is generated, use the bottom input box to ask follow-up questions or request edge-case handling.

Start Over: Click Start Over to reset the conversation.

🛡️ Privacy & Safety Notice
This tool is created for educational and learning purposes to help developers practice technical problem-solving and logic building. Because all processing happens locally on your GPU/CPU:

No image or screen data is ever uploaded to external cloud servers.

No telemetry or analytics are collected.