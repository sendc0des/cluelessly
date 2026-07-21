const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;
const { LogicalSize } = window.__TAURI__.dpi;

const appWindow = getCurrentWindow();
const solveBtn = document.getElementById('solve-btn');
const resetBtn = document.getElementById('reset-btn');
const hideBtn = document.getElementById('hide-btn');
const outputContainer = document.getElementById('output-container');
const aiOutput = document.getElementById('ai-output');
const appWrapper = document.getElementById('app-wrapper');
const chatBar = document.getElementById('chat-bar');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

const PILL_WIDTH = 440;
const EXPANDED_WIDTH = 750;

// This array remembers the conversation context!
let chatHistory = [];
let fullMarkdown = "";

// Smart Dynamic Resizer
async function updateWindowSize() {
  const isExpanded = outputContainer.style.display !== 'none';
  const targetWidth = isExpanded ? EXPANDED_WIDTH : PILL_WIDTH;
  const targetHeight = appWrapper.offsetHeight;
  await appWindow.setSize(new LogicalSize(targetWidth, targetHeight));
}

setTimeout(updateWindowSize, 100);

// Helper function to stream chat responses
// Helper function to stream chat responses
async function streamOllamaResponse() {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5-coder:1.5b',
      messages: chatHistory,
      stream: true
    })
  });

  if (!response.ok) throw new Error("Ollama Server Error");

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let assistantResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message && parsed.message.content) {
          assistantResponse += parsed.message.content;
          
          // Render safely
          if (window.marked && window.hljs) {
            aiOutput.innerHTML = window.marked.parse(fullMarkdown + "\n" + assistantResponse);
            document.querySelectorAll('pre code').forEach((block) => window.hljs.highlightElement(block));
          }
          
          // Auto-scroll dynamically as text streams in
          aiOutput.scrollTop = aiOutput.scrollHeight;
          
          await updateWindowSize();
        }
      } catch (e) {}
    }
  }
  
  // Save the assistant's final generated message into history
  fullMarkdown += "\n" + assistantResponse;
  chatHistory.push({ role: 'assistant', content: assistantResponse });
}

// 1. Initial Solve Capture
solveBtn.onclick = async () => {
  try {
    solveBtn.innerText = "Scanning...";
    solveBtn.disabled = true;
    
    outputContainer.style.display = 'flex';
    chatBar.style.display = 'none'; // Hide chat bar during initial solve
    fullMarkdown = "";
    aiOutput.innerHTML = "<p><em>Extracting code from screen...</em></p>";
    await updateWindowSize();

    const extractedText = await invoke('extract_screen_text');
    aiOutput.innerHTML = "<p><em>Analyzing problem...</em></p>";
    await updateWindowSize();

    // Initialize Conversation History with Language Auto-Detection
    chatHistory = [{
      role: 'user',
      content: `You are an expert technical interviewer. Read the extracted text below to determine the programming language being used. Write the solution in that exact language. If it is unclear, default to python.\n\nOutput EXACTLY these sections:\n### Problem Statement\n(1-2 sentence summary)\n\n### My Thoughts\n- (step 1)\n- (step 2)\n\n### Solution\n\`\`\`[insert detected language]\n// Clean optimized code\n\`\`\`\n\n### Complexity\n- Time: O(...)\n- Space: O(...)\n\nExtracted Text:\n---\n${extractedText}`
    }];

    await streamOllamaResponse();

    // Generation done, show chat input!
    chatBar.style.display = 'flex';
    await updateWindowSize();
    solveBtn.innerHTML = "Screenshot";

  } catch (error) {
    aiOutput.innerHTML = `<p style="color: #ff4444;">Error: ${error.message}</p>`;
    await updateWindowSize();
    solveBtn.innerHTML = "❌ Failed";
  } finally {
    solveBtn.disabled = false;
  }
};

// 2. Follow-up Chat Message
chatSendBtn.onclick = async () => {
  const userText = chatInput.value.trim();
  if (!userText) return;

  chatInput.value = "";
  chatSendBtn.disabled = true;

  // Append user message using the clean, minimal structure
  fullMarkdown += `\n\n<div class="user-query">${userText}</div>\n\n`;
  aiOutput.innerHTML = window.marked.parse(fullMarkdown);
  
  // Force scroll to the bottom instantly
  aiOutput.scrollTop = aiOutput.scrollHeight;
  await updateWindowSize();

  // Push to history and fetch response
  chatHistory.push({ role: 'user', content: userText });
  
  try {
    await streamOllamaResponse();
  } catch (error) {
    fullMarkdown += `\n<p style="color: #ef4444;">Chat Error: ${error.message}</p>`;
    aiOutput.innerHTML = window.marked.parse(fullMarkdown);
  }

  chatSendBtn.disabled = false;
  await updateWindowSize();
};

// Allow 'Enter' key to send chat
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') chatSendBtn.click();
});

// 3. Reset
resetBtn.onclick = async () => {
  outputContainer.style.display = 'none';
  chatBar.style.display = 'none';
  aiOutput.innerHTML = "";
  fullMarkdown = "";
  chatHistory = []; // Wipe memory
  solveBtn.innerHTML = "Screenshot";
  await updateWindowSize();
};

hideBtn.onclick = async () => await appWindow.hide();