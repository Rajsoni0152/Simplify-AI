# SimplifyAI
### Course Content Simplification Agent
**IBM SkillsBuild AICTE Internship — Project 19**

> Built by **Raj Soni** | BCA 2nd Year (AI & ML)

---

## 1. Project Overview

SimplifyAI is a browser-based educational tool that helps college students understand difficult course content. A student pastes any paragraph from a textbook, selects an explanation level, and receives five types of structured output — all generated instantly without any server or internet connection.

**Current version:** The application runs entirely in the browser using a built-in rule-based text processing engine. There is no live AI API active in this version. The engine uses sentence ranking, keyword frequency analysis, and pattern matching to produce its output.

---

## 2. Features

| Feature | Status | Notes |
|---------|--------|-------|
| Text input with word counter | ✅ Working | Updates live as you type |
| Clear / Reset button | ✅ Working | Clears input and output |
| Beginner level explanation | ✅ Working | Simple language, real-life analogy |
| Intermediate level explanation | ✅ Working | Concept + mechanism + exam tip |
| Expert level explanation | ✅ Working | Technical depth, implications |
| Simplified explanation tab | ✅ Working | 5 structured paragraphs |
| Key Words tab | ✅ Working | Difficult terms with definitions and examples |
| Summary tab | ✅ Working | 3 category-targeted sentences from text |
| Q&A tab | ✅ Working | 5 questions with answers from source text |
| Notes tab | ✅ Working | Tiered bullet points per level |
| Copy button per output section | ✅ Working | Uses Clipboard API with fallback |
| Mobile responsive design | ✅ Working | Works on phones and tablets |
| IBM watsonx.ai API hook | ⚙️ Optional | Disabled by default; see Section 5 |

---

## 3. Project Files

```
IBM_Major_Project/
│
├── index.html    →  Page structure — header, input panel, output tabs
├── style.css     →  All styling — layout, colours, responsive breakpoints
├── script.js     →  Rule-based engine, UI logic, event handlers
└── README.md     →  This file
```

---

## 4. How to Run

### Requirements
- A modern web browser (Chrome, Firefox, Edge, or Safari)
- No installation, no Python, no Node.js, no internet connection required

### Steps (Windows)
1. Open File Explorer and navigate to the `IBM_Major_Project` folder
2. Double-click `index.html`
3. The application opens in your default browser and is ready to use

> If the file does not open automatically, right-click `index.html` → **Open with** → choose your browser.

---

## 5. How to Test

1. Open `index.html` in your browser
2. Paste any study material paragraph into the text box
3. Select a difficulty level — start with **Beginner**
4. Click **✨ Simplify Content**
5. Five output tabs appear: Simplified · Key Words · Summary · Q&A · Notes
6. Click **⎘ Copy** on any section to copy it to clipboard
7. Repeat with Intermediate and Expert levels to compare the output

### Sample Test Input

```
Machine learning is a subset of artificial intelligence that provides
systems the ability to automatically learn and improve from experience
without being explicitly programmed. Machine learning focuses on the
development of computer programs that can access data and use it to
learn for themselves. The process begins with observations or data,
such as examples, direct experience, or instruction, to look for
patterns in data and make better decisions in the future.
It is used in healthcare, education and banking.
```

### Expected Results (Beginner level)

- **Simplified tab** — 5 paragraphs: topic introduction, text explanation, real-life analogy, a second key point, and a specific takeaway
- **Key Words tab** — terms found in the text (e.g. Machine, Learning, Algorithm) with plain-English definitions and examples
- **Summary tab** — definition sentence + mechanism sentence + application sentence from the text, followed by key concepts
- **Q&A tab** — 5 questions using "Machine Learning" as the topic; answers drawn directly from the pasted text
- **Notes tab** — 6 bullets covering topic, definition, key idea, reason, additional fact, and study tip

---

## 6. Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure and semantic layout |
| CSS3 | Styling, responsive grid, animations |
| Vanilla JavaScript (ES6+) | Rule-based engine, DOM manipulation, event handling |
| Google Fonts (Inter) | Typography |
| Clipboard API | Copy button functionality |

No external JavaScript libraries or frameworks are used. No backend server is required.

---

## 7. How the Built-in Engine Works

The engine processes text entirely in the browser through these steps:

1. **Sentence splitting** — splits input on `.`, `?`, `!` with fragment merging
2. **Tokenisation** — converts text to lowercase word tokens, filters stop words
3. **Keyword extraction** — ranks terms by weighted frequency (longer terms score higher as they tend to be more domain-specific)
4. **Sentence ranking** — scores each sentence by keyword density normalised by sentence length
5. **Compound topic detection** — scans for known two-word phrases (e.g. "Machine Learning", "Neural Network") to use as the topic label
6. **Category-targeted selection** — each output section selects sentences matching specific semantic patterns (definition, mechanism, application, limitation) so sections do not repeat each other
7. **Vocabulary lookup** — matches text tokens against a built-in dictionary of ~46 academic and technical terms; returns definition + example + level-appropriate depth

All output is grounded in the pasted text. The engine does not invent facts. If a section's required type of sentence is not present in the input, it outputs: *"Not mentioned in the provided text."*

---

## 8. Optional: Connecting IBM watsonx.ai (Future Enhancement)

The application includes a disabled API hook for IBM watsonx.ai. This is **not active** in the current version and is provided as a future enhancement path.

### What is IBM watsonx.ai?

IBM watsonx.ai is an enterprise AI platform that provides access to large language models (LLMs), including IBM's own Granite family of models, through a REST API.

### Steps to enable (for future development)

**Step 1 — Create an IBM Cloud account**
Visit [cloud.ibm.com](https://cloud.ibm.com) and register for a free account.

**Step 2 — Set up a watsonx.ai project**
Navigate to watsonx.ai, create a project, and note down:
- API Key
- Project ID
- Region URL (e.g. `https://us-south.ml.cloud.ibm.com`)

**Step 3 — Update `script.js`**
At the top of `script.js`, locate the config block:

```javascript
const USE_REAL_AI     = false;               // change to true to enable
const WATSONX_API_KEY = "YOUR_IBM_API_KEY_HERE";
const WATSONX_PROJECT = "YOUR_PROJECT_ID_HERE";
const WATSONX_URL     = "https://us-south.ml.cloud.ibm.com";
const WATSONX_MODEL   = "ibm/granite-3-8b-instruct";
```

Replace the placeholder strings with your real credentials and set `USE_REAL_AI = true`.

**Step 4 — CORS consideration**
Direct browser-to-API requests may be blocked by browser security (CORS). A small server-side proxy (e.g. a Node.js or Python Flask wrapper) is needed for production use. For a local demo with CORS disabled in the browser, direct calls may work.

> **Note:** The Granite model name shown above (`ibm/granite-3-8b-instruct`) is the identifier used in the code. Availability depends on your IBM Cloud region and account tier. Verify current model availability in the watsonx.ai documentation before enabling.

---

## 9. Limitations

- **Rule-based output quality** — the built-in engine relies on pattern matching and keyword frequency. It cannot reason about content the way a language model can. Outputs may be less coherent on very short or poorly structured input.
- **Dictionary coverage** — the vocabulary section matches against ~46 predefined terms. Words not in the dictionary are listed with a generic prompt to check the textbook.
- **No context memory** — each click on Simplify Content processes the current text independently; there is no session history.
- **Browser Clipboard API** — the copy function uses `navigator.clipboard`, which requires a secure context (HTTPS or localhost). A `document.execCommand` fallback is included for older browsers.
- **No file upload** — only pasted text is supported in this version; PDF or document upload is not implemented.

---

## 10. Future Scope

The following enhancements are planned for future versions:

1. **Live IBM watsonx.ai integration** — connect the existing API hook to the Granite model for LLM-quality output
2. **PDF and document upload** — allow students to upload a file instead of pasting text
3. **Download output** — save all five sections as a formatted `.txt` or `.pdf` file
4. **History panel** — remember previous simplifications within the session
5. **Language support** — multilingual input and output for students whose first language is not English
6. **Quiz mode** — turn the Q&A output into an interactive self-test

---

## 11. About the Developer

| | |
|---|---|
| **Name** | Raj Soni |
| **Course** | BCA 2nd Year — Artificial Intelligence & Machine Learning |
| **Internship** | IBM SkillsBuild AICTE Internship |
| **Project** | \#19 — Course Content Simplification Agent |

---

## 12. License

This project is built for educational purposes as part of the IBM SkillsBuild AICTE Internship programme. It is not intended for commercial use.
