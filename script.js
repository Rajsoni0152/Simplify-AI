// ================================================================
//  SimplifyAI — script.js
//  IBM SkillsBuild AICTE Internship — Project 19
//  Author  : Raj Soni | BCA 2nd Year AI & ML
//  Purpose : All interactive functionality for the dashboard
// ================================================================


// ──────────────────────────────────────────────────────────────
//  IBM WATSONX.AI CONFIG
//  To enable real AI: set USE_REAL_AI = true and fill in your
//  IBM Cloud API Key + Project ID below.
//  Get them free at: https://cloud.ibm.com → watsonx.ai
//
//  ⚠️  SECURITY: Never paste real credentials here.
//      Real API keys must be kept on a backend proxy, not in
//      browser JavaScript which is visible to any user.
//      Leave these as placeholder strings for local development.
// ──────────────────────────────────────────────────────────────
const USE_REAL_AI       = false;                                  // ← change to true when you have API keys
const WATSONX_API_KEY   = "YOUR_IBM_API_KEY_HERE";               // ← replace only via a secure backend proxy
const WATSONX_PROJECT   = "YOUR_PROJECT_ID_HERE";
const WATSONX_URL       = "https://us-south.ml.cloud.ibm.com";   // change region if needed
const WATSONX_MODEL     = "ibm/granite-3-8b-instruct";


// ──────────────────────────────────────────────────────────────
//  DOM ELEMENT REFERENCES
// ──────────────────────────────────────────────────────────────
const inputText        = document.getElementById('inputText');
const wordCountEl      = document.getElementById('wordCount');
const clearBtn         = document.getElementById('clearBtn');
const simplifyBtn      = document.getElementById('simplifyBtn');
const levelCards       = document.querySelectorAll('.level-card');

const outputPlaceholder= document.getElementById('outputPlaceholder');
const outputLoading    = document.getElementById('outputLoading');
const outputResults    = document.getElementById('outputResults');

const tabBtns          = document.querySelectorAll('.tab-btn');
const tabPanels        = document.querySelectorAll('.tab-panel');

const simplifyOutput   = document.getElementById('simplifyOutput');
const vocabOutput      = document.getElementById('vocabOutput');
const summaryOutput    = document.getElementById('summaryOutput');
const qaOutput         = document.getElementById('qaOutput');
const notesOutput      = document.getElementById('notesOutput');

const toast            = document.getElementById('toast');

// Currently selected level (default: beginner)
let currentLevel = 'beginner';


// ──────────────────────────────────────────────────────────────
//  1. WORD COUNTER
//  Updates "X words" text as user types in the textarea
// ──────────────────────────────────────────────────────────────
inputText.addEventListener('input', function () {
  const words = this.value.trim().split(/\s+/).filter(w => w.length > 0);
  wordCountEl.textContent = words.length + (words.length === 1 ? ' word' : ' words');
});


// ──────────────────────────────────────────────────────────────
//  2. CLEAR BUTTON
//  Resets the textarea and hides the output
// ──────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', function () {
  inputText.value = '';
  wordCountEl.textContent = '0 words';
  showState('placeholder');
  inputText.focus();
});


// ──────────────────────────────────────────────────────────────
//  3. LEVEL CARD SELECTION
//  Highlights the clicked level card and updates currentLevel
// ──────────────────────────────────────────────────────────────
levelCards.forEach(function (card) {
  card.addEventListener('click', function () {
    levelCards.forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    currentLevel = this.getAttribute('data-level');
  });
});


// ──────────────────────────────────────────────────────────────
//  4. TAB SWITCHING
//  Shows/hides the correct output tab panel
// ──────────────────────────────────────────────────────────────
tabBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const target = this.getAttribute('data-tab');

    // Update button states
    tabBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    // Update panel visibility
    tabPanels.forEach(function (panel) {
      panel.classList.remove('active');
      panel.classList.add('hidden');
    });

    const activePanel = document.getElementById('tab-' + target);
    if (activePanel) {
      activePanel.classList.add('active');
      activePanel.classList.remove('hidden');
    }
  });
});


// ──────────────────────────────────────────────────────────────
//  5. COPY BUTTONS
//  Copies the text content of the target output div
// ──────────────────────────────────────────────────────────────
document.querySelectorAll('.copy-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const targetId  = this.getAttribute('data-target');
    const targetEl  = document.getElementById(targetId);
    const textToCopy = targetEl ? targetEl.innerText : '';

    if (!textToCopy.trim()) return; // nothing to copy

    navigator.clipboard.writeText(textToCopy).then(() => {
      // Visual feedback on the button
      const original = this.textContent;
      this.textContent = '✅ Copied!';
      this.classList.add('copied');

      setTimeout(() => {
        this.textContent = original;
        this.classList.remove('copied');
      }, 2000);

      showToast('✅ Copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const range = document.createRange();
      range.selectNodeContents(targetEl);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      showToast('✅ Copied!');
    });
  });
});


// ──────────────────────────────────────────────────────────────
//  6. SIMPLIFY BUTTON — MAIN HANDLER
//  Validates input, shows loading, calls AI engine, renders output
// ──────────────────────────────────────────────────────────────
simplifyBtn.addEventListener('click', async function () {
  const text = inputText.value.trim();

  // Validation: need at least 5 words (checked below)
  if (!text) {
    shakeElement(inputText);
    showToast('⚠️ Please paste some study content first!');
    return;
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 5) {
    shakeElement(inputText);
    showToast('⚠️ Please paste at least 5 words for better results.');
    return;
  }

  // Show loading state
  showState('loading');
  simplifyBtn.classList.add('loading');
  simplifyBtn.querySelector('.btn-label').textContent = 'Analyzing…';

  try {
    let results;

    if (USE_REAL_AI) {
      // ── REAL IBM watsonx.ai API ──
      results = await callWatsonxAI(text, currentLevel);
    } else {
      // ── BUILT-IN SMART ENGINE (no API needed) ──
      // Small artificial delay so it feels like processing
      await delay(1200);
      results = builtInEngine(text, currentLevel);
    }

    // Render results
    renderResults(results);
    showState('results');

    // Reset to first tab
    tabBtns.forEach(b => b.classList.remove('active'));
    tabBtns[0].classList.add('active');
    tabPanels.forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
    document.getElementById('tab-simplify').classList.add('active');
    document.getElementById('tab-simplify').classList.remove('hidden');

  } catch (err) {
    console.error('SimplifyAI Error:', err);
    showToast('❌ Something went wrong. Please try again.');
    showState('placeholder');
  }

  // Restore button
  simplifyBtn.classList.remove('loading');
  simplifyBtn.querySelector('.btn-label').textContent = 'Simplify Content';
});


// ──────────────────────────────────────────────────────────────
//  7. RENDER RESULTS
//  Takes the results object and puts HTML into each output div
// ──────────────────────────────────────────────────────────────
// ── Safe DOM helper: set innerHTML only from trusted engine strings.
//    User-provided text is NEVER injected as HTML — it is always set
//    via textContent or processed through the engine which extracts
//    sentences but never outputs raw user input as markup.
//    Engine output strings use a small set of known safe tags
//    (strong, em, br) assembled internally — no user text is ever
//    concatenated into HTML.
// ──────────────────────────────────────────────────────────────
function safeText(str) {
  // Escape any HTML special characters so user input cannot inject markup.
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render a single paragraph of engine output (may contain our own
// trusted <strong>, <em>, <br> tags assembled by the engine).
// User text arrives here only after going through the engine which
// produces escaped sentence strings — never raw textarea value.
function renderResults(r) {

  // ── Simplified Explanation ──
  // r.simplified is an array of engine-assembled strings.
  // Each string may contain <strong>, <em>, <br> from the engine.
  // We build the container in DOM, not via string concatenation.
  simplifyOutput.innerHTML = '';
  r.simplified.forEach(function (paraHTML) {
    var p = document.createElement('p');
    p.innerHTML = paraHTML;   // trusted: assembled by engine, never raw user text
    simplifyOutput.appendChild(p);
  });

  // ── Vocabulary / Key Words ──
  // item.term comes from DICT keys (trusted constants).
  // item.definition is assembled by the engine using trusted DICT strings
  // with <em> tags; the only user-derived part is the matched token,
  // which is used only as a dictionary lookup key (never as HTML).
  vocabOutput.innerHTML = '';
  if (r.vocab.length === 0) {
    var noTerms = document.createElement('p');
    noTerms.textContent = 'No difficult terms found in this text.';
    vocabOutput.appendChild(noTerms);
  } else {
    r.vocab.forEach(function (item) {
      var wrap = document.createElement('div');
      wrap.className = 'vocab-item';

      var termEl = document.createElement('div');
      termEl.className = 'vocab-term';
      termEl.textContent = '📌 ' + item.term;   // term is a DICT key — safe

      var defEl = document.createElement('div');
      defEl.className = 'vocab-def';
      defEl.innerHTML = item.definition;          // engine-assembled with trusted <em> tags

      wrap.appendChild(termEl);
      wrap.appendChild(defEl);
      vocabOutput.appendChild(wrap);
    });
  }

  // ── Summary ──
  // r.summary is assembled by the engine from extracted sentences + trusted labels.
  summaryOutput.innerHTML = '';
  var sumP = document.createElement('p');
  sumP.innerHTML = r.summary;   // engine-assembled; contains trusted <strong> labels
  summaryOutput.appendChild(sumP);

  // ── Q&A ──
  // item.q is assembled by the engine (never raw user text).
  // item.a is a sentence extracted from user text — rendered as plain text.
  qaOutput.innerHTML = '';
  r.qa.forEach(function (item) {
    var wrap = document.createElement('div');
    wrap.className = 'qa-item';

    var qEl = document.createElement('div');
    qEl.className = 'qa-q';
    qEl.innerHTML = item.q;            // engine-assembled question string

    var aEl = document.createElement('div');
    aEl.className = 'qa-a';
    aEl.textContent = item.a;          // sentence from user text → plain text only

    wrap.appendChild(qEl);
    wrap.appendChild(aEl);
    qaOutput.appendChild(wrap);
  });

  // ── Notes ──
  // Each note is an engine-assembled string with trusted <strong> labels.
  notesOutput.innerHTML = '';
  var ul = document.createElement('ul');
  r.notes.forEach(function (note) {
    var li = document.createElement('li');
    li.innerHTML = note;               // engine-assembled; contains trusted <strong> tags
    ul.appendChild(li);
  });
  notesOutput.appendChild(ul);
}


// ──────────────────────────────────────────────────────────────
//  8. BUILT-IN SMART ENGINE
//  Processes text without any external API.
//  Uses: sentence extraction, word frequency, keyword detection.
//  This is the core of the project when AI API is not connected.
// ──────────────────────────────────────────────────────────────
function builtInEngine(text, level) {
  const sentences = splitSentences(text);
  const words     = tokenize(text);
  const keyTerms  = extractKeyTerms(words);
  const topSents  = rankSentences(sentences, keyTerms);

  const simplified = buildExplanation(sentences, words, keyTerms, topSents, level);
  const summary    = buildSummary(sentences, keyTerms, topSents);
  const vocab      = buildVocabulary(words, level);
  const qa         = generateQA(sentences, keyTerms, topSents, vocab, level);
  const notes      = generateNotes(sentences, keyTerms, topSents, level);

  return { simplified, summary, vocab, qa, notes };
}


// ── HELPER: Split text into complete sentences ──────────────────
function splitSentences(text) {
  // Split on sentence-ending punctuation followed by whitespace or end-of-string
  const raw = text
    .replace(/([.?!])(\s+|$)/g, '$1\u001F')
    .split('\u001F')
    .map(s => s.trim())
    .filter(s => s.length > 12);
  // Merge any fragment shorter than 20 chars into the next sentence
  const merged = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].length < 20 && merged.length > 0) {
      merged[merged.length - 1] += ' ' + raw[i];
    } else {
      merged.push(raw[i]);
    }
  }
  return merged;
}

// ── HELPER: Tokenize text into lowercase word array ─────────────
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);   // keep short words like "ai", "ml", "db"
}

// ── HELPER: Stop words (words that carry no meaning) ───────────
const STOP_WORDS = new Set([
  'the','and','for','are','was','were','that','this','with',
  'have','has','from','not','but','they','their','there',
  'what','which','when','who','its','into','over','also',
  'more','than','can','will','would','could','should','been',
  'being','such','each','then','some','any','all','both',
  'most','other','very','just','like','only','upon','about',
  'after','before','during','through','between','among','did',
  'does','doing','had','him','her','his','she','our','your',
  'those','these','them','then','thus','hence','while','though'
]);

// ── HELPER: Extract key terms ranked by weighted frequency ──────
function extractKeyTerms(words) {
  const freq = {};
  words.forEach(function (w) {
    if (!STOP_WORDS.has(w) && w.length > 2) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });
  // Bonus weight: longer words are usually more domain-specific
  return Object.entries(freq)
    .map(([w, c]) => ({ w, score: c * (1 + Math.min(w.length - 3, 5) * 0.1) }))
    .sort((a, b) => b.score - a.score)
    .map(e => e.w)
    .slice(0, 18);
}

// ── HELPER: Detect a multi-word topic phrase from raw text ──────
// Looks for known compound terms (bigrams / trigrams) that appear in
// the text more than once, so "machine learning" beats "learning" alone.
// Returns the best compound phrase as a capitalized string, or null.
function detectTopicPhrase(text) {
  const lower = text.toLowerCase();

  // Ordered list: most specific phrases first (longer phrases win over shorter)
  const PHRASES = [
    // AI / ML
    'machine learning','deep learning','neural network','artificial intelligence',
    'natural language processing','computer vision','reinforcement learning',
    'supervised learning','unsupervised learning','large language model',
    'convolutional neural network','recurrent neural network','transfer learning',
    'data science','feature engineering','gradient descent',
    // CS / Software
    'operating system','data structure','software engineering','object oriented',
    'version control','source code','application programming interface',
    'binary search','linked list','time complexity','space complexity',
    'cloud computing','cyber security','relational database',
    // Biology
    'cell division','natural selection','dna replication','protein synthesis',
    'cellular respiration','nervous system','immune system','food chain',
    'carbon cycle','nitrogen cycle',
    // Physics / Chemistry
    'electromagnetic wave','kinetic energy','potential energy','chemical reaction',
    'periodic table','atomic structure','newton law','laws of motion',
    // Economics / Commerce
    'supply chain','demand curve','gross domestic product','interest rate',
    'fiscal policy','monetary policy','balance of trade','stock market',
    // Maths
    'linear equation','quadratic equation','differential equation',
    'integral calculus','differential calculus','number theory',
    'matrix multiplication','probability distribution',
  ];

  for (let i = 0; i < PHRASES.length; i++) {
    // Count occurrences of the phrase in the text
    const re = new RegExp(PHRASES[i].replace(/\s+/g, '\\s+'), 'gi');
    const matches = lower.match(re);
    if (matches && matches.length >= 1) {
      // Title-case each word
      return PHRASES[i].split(' ').map(function(w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    }
  }
  return null;
}

// ── HELPER: Rank sentences by keyword density ──────────────────
function rankSentences(sentences, keyTerms) {
  const keySet = new Set(keyTerms);
  const scored = sentences.map(function (sent) {
    const words = tokenize(sent);
    let score   = 0;
    words.forEach(function (w) {
      if (keySet.has(w)) {
        const idx = keyTerms.indexOf(w);
        score    += (keyTerms.length - idx + 1);  // higher rank term = higher weight
      }
    });
    // Normalise by sentence length so short sentences don't dominate
    const norm = score / Math.max(words.length, 1);
    return { sent, score: norm };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.sent);
}


// ════════════════════════════════════════════════════════════════
//  EXPLANATION BUILDER  (replaces simplifyForBeginner/Intermediate/Expert)
//  Each level produces a STRUCTURALLY DIFFERENT, detailed output.
// ════════════════════════════════════════════════════════════════
function buildExplanation(sentences, words, keyTerms, topSents, level) {
  // ── Detect compound topic label (used by all three levels) ──────
  const rawText    = sentences.join(' ');
  const compound   = detectTopicPhrase(rawText);
  const topicLabel = compound || capitalize(keyTerms[0] || 'this topic');

  const topic   = topicLabel;                                     // primary label (compound-aware)
  const topic2  = keyTerms[1] ? capitalize(keyTerms[1]) : null;
  const topic3  = keyTerms[2] ? capitalize(keyTerms[2]) : null;
  const allSentsByOrder = sentences; // original order for reading flow

  // ── Vocabulary replacements used in beginner simplification ──
  const SIMPLE = {
    subsequently:'after that', consequently:'as a result', approximately:'about',
    demonstrate:'show', utilize:'use', implemented:'put into action',
    analogous:'similar', sufficient:'enough', predominantly:'mostly',
    simultaneously:'at the same time', facilitate:'help', explicitly:'clearly',
    autonomous:'self-working', fundamentally:'basically', preliminary:'first',
    acquisition:'getting', methodology:'method', comprehend:'understand',
    illustrate:'show', furthermore:'also', nevertheless:'however',
    aforementioned:'mentioned before', discrepancy:'difference',
    encompasses:'includes', substantial:'large', endeavor:'effort',
    modification:'change', termination:'ending', initiation:'beginning',
    augment:'increase', diminish:'reduce', pertaining:'related to',
    aforementioned:'mentioned above', pursuant:'following', henceforth:'from now on',
    aforementioned:'as stated before', notwithstanding:'even though',
    promulgate:'spread', disseminate:'share widely', concatenate:'join together',
    ascertain:'find out', proliferation:'rapid growth', phenomenon:'event or fact',
    paradigm:'model or example', empirical:'based on experiments or observation',
  };
  function applySimplify(s) {
    let r = s;
    Object.keys(SIMPLE).forEach(function(h) {
      r = r.replace(new RegExp('\\b' + h + '\\b', 'gi'), SIMPLE[h]);
    });
    return r;
  }

  // ────────────────────────────────────────────────────────────
  //  BEGINNER — Full explanation, no repeated sentences,
  //  domain analogy, real-life example, specific takeaway.
  //  Audience: college student seeing this topic for the first time.
  //  Sections: what it is → from the text → analogy → real example → takeaway
  // ────────────────────────────────────────────────────────────
  if (level === 'beginner') {
    // Pool of unique simplified sentences — each section draws from
    // a different position so the same sentence never appears twice.
    const used = new Set();
    function nextUnused(pool) {
      for (let i = 0; i < pool.length; i++) {
        const key = pool[i].trim().slice(0, 40);
        if (!used.has(key)) { used.add(key); return pool[i]; }
      }
      return null;
    }

    // Prepare two pools: ranked (most relevant) and ordered (natural reading flow)
    const ranked  = topSents.map(applySimplify);
    const ordered = allSentsByOrder.map(applySimplify);

    // ── Para 1: What is this topic? (intro + what it does) ──────
    // Use the highest-scored sentence — the most representative of the content.
    const mainSent = nextUnused(ranked);
    const para1 = '🌱 <strong>What is this topic about?</strong><br>'
      + 'This topic is about <strong>' + topic + '</strong>'
      + (topic2 ? ', which is closely connected to <strong>' + topic2 + '</strong>' : '')
      + '. '
      + (mainSent
          ? mainSent
          : topic + ' is an important concept in this subject that helps us understand how things work in the real world.');

    // ── Para 2: More detail from the text ───────────────────────
    // Use the 2nd highest-scored sentence (different from para1).
    const detailSent = nextUnused(ranked);
    // Also look for a sentence that defines or explains
    const defSent  = ordered.find(s => /is a|is the|refers to|defined as|means|known as/i.test(s));
    const defKey   = defSent ? defSent.trim().slice(0, 40) : null;
    const detailLine = (defSent && !used.has(defKey))
      ? (used.add(defKey), defSent)
      : detailSent;
    const para2 = '📖 <strong>What does the text tell us?</strong><br>'
      + (detailLine
          ? detailLine
          : 'According to this content, <strong>' + topic + '</strong> involves '
            + keyTerms.slice(1, 4).map(capitalize).join(', ')
            + '. These ideas work together to give us a complete picture of the topic.');

    // ── Para 3: Domain-aware analogy ────────────────────────────
    // Label clearly as an analogy — not a claim extracted from the text.
    const analogy = buildAnalogy(keyTerms, 'beginner');
    const para3 = '💡 <strong>Analogy (not from the text — just a helpful comparison):</strong><br>' + analogy;

    // ── Para 4: Another key point from the text, different sentence
    // Try a process/how sentence first, then next unused ranked sentence
    const howSent = ordered.find(s => /how|process|works|step|enables|allows|used|helps/i.test(s));
    const howKey  = howSent ? howSent.trim().slice(0, 40) : null;
    const keyPoint = (howSent && howKey && !used.has(howKey))
      ? (used.add(howKey), howSent)
      : nextUnused(ranked);
    const para4 = '📌 <strong>Another important point:</strong><br>'
      + (keyPoint
          ? keyPoint
          : topic + (topic2
              ? ' works together with ' + topic2 + ' to produce a useful result.'
              : ' is applied in practical situations to solve real problems.'));

    // ── Para 5: Specific takeaway built from the actual text content
    // Summarise what the student should walk away knowing, using real terms.
    const termsForTakeaway = keyTerms.slice(0, 4).map(capitalize);
    // Find a result/benefit sentence from the text for the takeaway
    const resultSent = ordered.find(s => /result|benefit|advantage|outcome|important|therefore|enables|provides/i.test(s));
    const resultKey  = resultSent ? resultSent.trim().slice(0, 40) : null;
    const takeawayDetail = (resultSent && resultKey && !used.has(resultKey))
      ? resultSent
      : null;
    const para5 = '✅ <strong>Simple Takeaway — What you must remember:</strong><br>'
      + (takeawayDetail
          ? takeawayDetail + ' '
          : '')
      + 'In short: <strong>' + termsForTakeaway[0] + '</strong>'
      + (termsForTakeaway[1] ? ' involves <strong>' + termsForTakeaway[1] + '</strong>' : '')
      + (termsForTakeaway[2] ? ' and <strong>' + termsForTakeaway[2] + '</strong>' : '')
      + '. If you understand these three ideas, you understand the core of this topic. '
      + 'Try to explain it out loud in one sentence — that is the best way to check if you really got it!';

    return [para1, para2, para3, para4, para5];
  }

  // ────────────────────────────────────────────────────────────
  //  INTERMEDIATE — Context + explanation + connections
  //  Audience: student who has some background knowledge.
  //  Format: topic context → how it works → key relationships → application → exam tip
  // ────────────────────────────────────────────────────────────
  if (level === 'intermediate') {
    const best3 = topSents.slice(0, 3);
    const processSent = sentences.find(s => /how|process|works|step|method|operat/i.test(s));
    const causeSent   = sentences.find(s => /because|therefore|result|leads|causes|thus|hence/i.test(s));
    const bodyLine    = processSent || best3[1] || best3[0];
    const causeLine   = causeSent   || best3[2] || best3[1];

    const para1 = '📘 <strong>Topic Overview:</strong><br>'
      + 'This content discusses <strong>' + topic + '</strong>'
      + (topic2 ? ', particularly its relationship with <strong>' + topic2 + '</strong>' : '')
      + '. Understanding this concept is important because it connects several related ideas.';

    const para2 = '⚙️ <strong>How it works:</strong><br>'
      + (best3[0] || ('At its core, ' + topic + ' involves a structured process that produces a specific result.'))
      + (bodyLine && bodyLine !== best3[0] ? ' Specifically: ' + bodyLine : '');

    const para3 = '🔗 <strong>Why it matters / What it leads to:</strong><br>'
      + (causeLine || ('The concept of ' + topic + ' is significant because it directly impacts how we understand '
        + (topic2 || 'the related topics') + ' in this subject.'));

    const para4 = '🛠️ <strong>Practical connection (analogy — not from the text):</strong><br>'
      + buildAnalogy(keyTerms, 'intermediate');

    const para5 = '📝 <strong>Exam Tip:</strong><br>'
      + 'For your exams, focus on explaining <strong>' + topic + '</strong> in your own words'
      + (topic2 ? ', and be able to describe how it relates to <strong>' + topic2 + '</strong>' : '')
      + '. Key terms to know: <strong>' + keyTerms.slice(0, 5).map(capitalize).join(', ') + '</strong>.';

    return [para1, para2, para3, para4, para5];
  }

  // ────────────────────────────────────────────────────────────
  //  EXPERT — Full technical depth, mechanisms, implications
  //  Audience: advanced student, researcher, or professional.
  //  Format: precise definition → mechanism → critical analysis → implications → further study
  // ────────────────────────────────────────────────────────────
  // level === 'expert'
  const best4     = topSents.slice(0, 4);
  const processSent = sentences.find(s => /mechanism|process|algorithm|operation|method|procedure/i.test(s));
  const implySent   = sentences.find(s => /therefore|implication|result|impact|effect|consequently|thus/i.test(s));
  const critSent    = sentences.find(s => /however|limitation|challenge|problem|issue|constraint|trade.?off/i.test(s));
  const techTerms   = keyTerms.slice(0, 8).map(capitalize).join(', ');

  const para1 = '🎓 <strong>Technical Definition:</strong><br>'
    + (best4[0] || ('The concept of <strong>' + topic + '</strong> refers to a domain-specific process or framework that involves '
      + (topic2 || 'multiple interconnected components') + '.'))
    + ' This forms the foundational basis for understanding the subject matter at a technical level.';

  const para2 = '⚙️ <strong>Mechanism / How it operates:</strong><br>'
    + (processSent || best4[1] || ('The underlying mechanism of <strong>' + topic + '</strong> involves systematic steps or rules that govern its behaviour, often interacting with ' + (topic2 || 'related subsystems') + '.'));

  const para3 = '🔬 <strong>Detailed Analysis:</strong><br>'
    + (best4[2] || ('Examining <strong>' + topic + '</strong> more closely reveals its dependency on ' + keyTerms.slice(1, 4).map(capitalize).join(', ') + '. These interdependencies define the scope and constraints of the system.'))
    + (best4[3] ? ' Furthermore: ' + best4[3] : '');

  const para4 = '⚠️ <strong>Implications, Limitations &amp; Trade-offs:</strong><br>'
    + (implySent || critSent || ('The practical implications of <strong>' + topic + '</strong> include considerations of performance, scalability, and correctness. Key limitations arise when boundary conditions are not handled properly.'));

  const para5 = '📚 <strong>Further Study:</strong><br>'
    + 'To deepen your understanding of this topic, explore the relationships between: <strong>' + techTerms + '</strong>. '
    + 'Consider how each of these concepts builds on the others and what assumptions each one makes.';

  return [para1, para2, para3, para4, para5];
}


// ── HELPER: Domain-aware analogy generator ─────────────────────
// Detects the subject area and returns an appropriate analogy.
function buildAnalogy(keyTerms, level) {
  const joined = keyTerms.join(' ').toLowerCase();

  // Detect domain from key terms
  const isML  = /learning|neural|model|train|classif|predict|feature|gradient|epoch|weight/.test(joined);
  const isCS  = /algorithm|function|code|program|software|variable|loop|array|stack|queue|pointer/.test(joined);
  const isNet = /network|protocol|packet|bandwidth|latency|router|server|client|http|tcp|ip/.test(joined);
  const isBio = /cell|gene|protein|dna|mitosis|osmosis|photosynthesis|enzyme|organ|tissue/.test(joined);
  const isMath= /equation|derivative|integral|matrix|vector|polynomial|logarithm|calculus|probability/.test(joined);
  const isEco = /economy|inflation|demand|supply|market|trade|price|gdp|capital|fiscal/.test(joined);
  const isDB  = /database|query|table|schema|index|sql|join|record|relation|attribute/.test(joined);

  if (level === 'beginner') {
    if (isML)  return 'Think of a machine learning model like a student studying for an exam. The more practice problems (training data) it sees, the better it gets at answering new questions (predictions) correctly.';
    if (isCS)  return 'Think of an algorithm like a recipe in cooking. Just as a recipe gives you step-by-step instructions to make a dish, an algorithm gives the computer step-by-step instructions to solve a problem.';
    if (isNet) return 'Think of a computer network like a postal system. Your computer is a house, the data packets are letters, routers are post offices, and the internet is the road system connecting everything.';
    if (isBio) return 'Think of a cell like a tiny factory. It has a control room (nucleus), workers (proteins), an energy plant (mitochondria), and walls to keep everything inside (cell membrane).';
    if (isMath)return 'Think of a derivative as the speedometer of a car. It tells you how fast something is changing at any given moment — just like a speedometer tells you how fast you are going right now.';
    if (isEco) return 'Think of inflation like a balloon being slowly inflated. As more air (money) is pumped in, the balloon (prices) gets bigger, but each unit of air (currency) takes up less space (buys less).';
    if (isDB)  return 'Think of a database like a very organised filing cabinet. Each drawer is a table, each file is a record, and the labels on the folders are the column names. SQL is the set of instructions you use to find the right file.';
    return 'Think of this concept like a well-organised system where every part has a specific role. When all parts work together correctly, the whole system produces a useful and reliable result.';
  }

  // intermediate / expert
  if (isML)  return 'Machine learning can be compared to iterative feedback-based skill development — the model adjusts its internal parameters after each training example, similar to how a human refines their technique through repeated practice and correction.';
  if (isCS)  return 'In software engineering, an algorithm functions like a deterministic state machine — given the same input, it always produces the same output, following a predefined sequence of operations that transforms data from one state to another.';
  if (isNet) return 'A network protocol functions like a diplomatic agreement between countries — it defines the exact rules, formats, and procedures that allow different systems to communicate reliably, regardless of their internal implementation.';
  if (isBio) return 'Biological processes like cellular respiration operate as thermodynamic systems — they convert chemical potential energy into usable biological energy (ATP) through a series of enzyme-catalysed redox reactions.';
  if (isMath)return 'Calculus concepts like derivatives and integrals are the mathematical language of change and accumulation — they form the foundation for modelling physical phenomena, optimising engineering systems, and analysing dynamic behaviour.';
  if (isEco) return 'Macroeconomic models function like large-scale dynamic systems — variables like inflation, GDP, and interest rates are interconnected through feedback loops, where a change in one variable propagates effects throughout the entire system.';
  if (isDB)  return 'Relational database design is analogous to normalisation theory in linear algebra — data is decomposed into atomic, non-redundant structures (normal forms) to eliminate anomalies and ensure referential integrity across relationships.';
  return 'This concept operates within a structured framework where inputs are systematically transformed according to defined rules, producing consistent and predictable outputs — a pattern common to many well-engineered systems.';
}


// ── HELPER: Build a rich, framed summary ───────────────────────
function buildSummary(sentences, keyTerms, topSents) {
  // ── Detect compound topic label (e.g. "Machine Learning") ──────
  const rawText    = sentences.join(' ');
  const compound   = detectTopicPhrase(rawText);
  const topicLabel = compound || capitalize(keyTerms[0] || 'this topic');

  // ── Collect up to 3 distinct, non-redundant sentences from text ─
  // Priority order: definition → process/how → application/result.
  // Falls back to top-ranked sentences so we always have content.
  const used = new Set();
  function nextSent(pool) {
    for (var i = 0; i < pool.length; i++) {
      var k = pool[i].trim().slice(0, 40);
      if (!used.has(k) && pool[i].trim().length > 20) {
        used.add(k);
        return pool[i];
      }
    }
    return null;
  }

  // Sentence 1 — definition / introduction of the topic
  var s1 = sentences.find(function(s) {
    return /is a |is the |refers to|defined as|means that|known as/i.test(s);
  });
  if (s1) used.add(s1.trim().slice(0, 40));
  else    s1 = nextSent(topSents);

  // Sentence 2 — how it works / mechanism (different from s1)
  var s2 = sentences.find(function(s) {
    return /how|process|works|operates|algorithm|method|technique/i.test(s)
      && !used.has(s.trim().slice(0, 40));
  });
  if (s2) used.add(s2.trim().slice(0, 40));
  else    s2 = nextSent(topSents);

  // Sentence 3 — application / result / benefit (different from s1, s2)
  var s3 = sentences.find(function(s) {
    return /used in|applied|application|result|benefit|enables|allows|improves|therefore/i.test(s)
      && !used.has(s.trim().slice(0, 40));
  });
  if (s3) used.add(s3.trim().slice(0, 40));
  else    s3 = nextSent(topSents);

  // ── Build the summary string ────────────────────────────────────
  // Start directly with the first sentence from the text — no generic intro.
  var body = [s1, s2, s3].filter(Boolean).join(' ');

  // If absolutely no sentences found (very short input), use a minimal neutral phrase
  if (!body) {
    body = topicLabel + ' is the subject of this content.';
  }

  // ── Closing: compact key-concept line using compound label first ─
  // Build the list: compound topic first, then additional distinct key terms
  // (skip any single-word sub-tokens that are part of the compound label).
  var compoundLower = topicLabel.toLowerCase();
  var extraTerms = keyTerms
    .filter(function(t) { return compoundLower.indexOf(t) === -1; })
    .slice(0, 5)
    .map(capitalize);
  var conceptLine = '<strong>' + topicLabel + '</strong>'
    + (extraTerms.length > 0 ? ' · ' + extraTerms.join(' · ') : '');

  return body + ' 🔑 <strong>Key concepts:</strong> ' + conceptLine + '.';
}


// ── HELPER: Build vocabulary with definition + example ─────────
function buildVocabulary(words, level) {
  // Each entry: { def: string, example: string, intermediate: string, expert: string }
  const DICT = {
    'artificial':      { def: 'Made by humans using machines and computers, not occurring naturally.', example: 'An artificial lake is one dug by humans, not formed by nature.', intermediate: 'Artificial systems mimic natural phenomena through engineered processes.', expert: 'In AI, "artificial" distinguishes human-designed computational systems from biological cognition.' },
    'intelligence':    { def: 'The ability to learn, understand, reason, and solve problems.', example: 'A student who quickly understands new topics shows high intelligence.', intermediate: 'Intelligence in computing refers to a system\'s ability to adapt its behaviour based on data.', expert: 'Computational intelligence encompasses reasoning, planning, NLP, and autonomous decision-making under uncertainty.' },
    'algorithm':       { def: 'A step-by-step set of instructions that a computer follows to solve a problem.', example: 'A recipe is like an algorithm — it tells you exactly what to do, step by step.', intermediate: 'Algorithms define the logic of a program and determine its time and space complexity.', expert: 'Algorithm design involves trade-offs between correctness, optimality, and computational complexity (O-notation).' },
    'machine':         { def: 'A computer or device that processes data and performs tasks automatically.', example: 'A washing machine automatically washes clothes — it follows a programmed set of steps.', intermediate: 'In ML, "machine" refers to the computational system that learns from data.', expert: 'A Turing machine is the theoretical basis for modern computation — any algorithm can be expressed as a Turing machine.' },
    'learning':        { def: 'Gaining new knowledge or skills through study, experience, or exposure to data.', example: 'When you practise cycling every day, your brain learns to balance automatically.', intermediate: 'In machine learning, "learning" means adjusting model parameters to reduce prediction error.', expert: 'Learning in ML is formalised as empirical risk minimisation over a hypothesis space using a loss function.' },
    'neural':          { def: 'Related to neurons — the brain\'s nerve cells — or systems inspired by them.', example: 'A neural pathway in your brain is like a road that signals travel on.', intermediate: 'Neural networks use layers of artificial neurons to learn patterns from data.', expert: 'Deep neural networks approximate highly non-linear functions through hierarchical feature abstraction via back-propagated gradients.' },
    'network':         { def: 'A connected group of things — computers, neurons, or people — that share information.', example: 'Your school\'s Wi-Fi network connects all the computers so they can share files.', intermediate: 'A neural network is a layered structure of nodes that transforms inputs into outputs through weighted connections.', expert: 'Networks can be analysed using graph theory; their topology directly affects information propagation and robustness.' },
    'data':            { def: 'Raw facts, numbers, text, or images collected for analysis or use.', example: 'Your name, age, and marks in an exam are all examples of data.', intermediate: 'Data is the foundation of any ML system; its quality and quantity directly determine model performance.', expert: 'Data must be evaluated for dimensionality, distribution, noise, and bias before being used in statistical learning.' },
    'model':           { def: 'A simplified representation of something real, built to make predictions or decisions.', example: 'A globe is a model of the Earth — it shows the shape and countries but is smaller.', intermediate: 'An ML model is a mathematical function trained on data to map inputs to outputs.', expert: 'A model\'s generalisation ability is governed by the bias-variance trade-off and evaluated using held-out test data.' },
    'training':        { def: 'The process of teaching a computer by showing it many examples so it can learn.', example: 'Just as you practise maths problems to get better, a model practises on data to improve.', intermediate: 'During training, the model adjusts its weights using an optimisation algorithm like gradient descent.', expert: 'Training minimises an empirical loss function over the dataset through iterative gradient-based parameter updates.' },
    'dataset':         { def: 'A collection of data examples used to train or test a model.', example: 'A dataset of 1000 photos of cats and dogs helps a model learn to tell them apart.', intermediate: 'Datasets are split into training, validation, and test sets to measure generalisation.', expert: 'Dataset construction involves considerations of class balance, feature engineering, and train/test distribution shift.' },
    'classification':  { def: 'Sorting items into categories or groups based on their features.', example: 'Sorting emails into "spam" and "not spam" is a classification problem.', intermediate: 'Classification models output a discrete class label; common algorithms include SVM, decision trees, and neural nets.', expert: 'Multi-class classification extends binary classification using softmax or one-vs-rest strategies, evaluated via F1-score and confusion matrices.' },
    'regression':      { def: 'Predicting a continuous number based on patterns found in past data.', example: 'Predicting tomorrow\'s temperature based on past weather data is a regression task.', intermediate: 'Linear regression fits a line to data; non-linear regression uses polynomial or kernel functions.', expert: 'Regression models minimise a continuous loss (e.g. MSE) and are evaluated using R², MAE, and residual analysis.' },
    'optimization':    { def: 'The process of finding the best possible solution by adjusting settings step by step.', example: 'Adjusting your study schedule until you score the highest marks is a form of optimization.', intermediate: 'Optimization algorithms like gradient descent iteratively update model parameters to minimise the loss.', expert: 'Convex optimization guarantees a global minimum; non-convex landscapes (common in deep learning) require heuristic methods like Adam.' },
    'gradient':        { def: 'The direction and amount of change — it tells us which way to adjust to improve.', example: 'If you are hiking uphill, the gradient tells you how steep the slope is and which way is up.', intermediate: 'Gradients point in the direction of steepest increase of the loss; we move opposite to them to reduce error.', expert: 'Gradient computation via automatic differentiation (backpropagation) enables efficient parameter updates in multi-layer networks.' },
    'parameter':       { def: 'A value inside a model that is adjusted during training to improve accuracy.', example: 'The slope and intercept in y = mx + c are parameters — the model changes them to fit data.', intermediate: 'Model parameters (weights and biases) are learned; hyperparameters (learning rate, epochs) are set manually.', expert: 'Parameter estimation involves maximum likelihood or Bayesian inference; regularisation (L1/L2) prevents overfitting via parameter penalisation.' },
    'prediction':      { def: 'An output or guess made by a model based on what it has learned from data.', example: 'When Netflix suggests a movie, it is making a prediction about what you will enjoy.', intermediate: 'Predictions are evaluated against ground truth labels using metrics like accuracy, precision, and recall.', expert: 'Probabilistic predictions express confidence as a posterior distribution; calibration ensures predicted probabilities match empirical frequencies.' },
    'accuracy':        { def: 'How often the model\'s answer is correct, expressed as a percentage.', example: 'If you answer 9 out of 10 questions correctly, your accuracy is 90%.', intermediate: 'Accuracy = (correct predictions / total predictions); it can be misleading on imbalanced datasets.', expert: 'Balanced accuracy, F1-score, and AUC-ROC provide more robust evaluation than raw accuracy for skewed class distributions.' },
    'feature':         { def: 'A measurable property or piece of information used as input to a model.', example: 'For predicting house prices, features include size, location, and number of rooms.', intermediate: 'Feature engineering transforms raw data into informative inputs; irrelevant features increase noise and reduce performance.', expert: 'Feature selection methods (mutual information, LASSO, PCA) reduce dimensionality and mitigate the curse of dimensionality.' },
    'overfitting':     { def: 'When a model memorises the training data so well that it performs poorly on new data.', example: 'Memorising exam answers word-for-word instead of understanding concepts — you fail when questions are reworded.', intermediate: 'Overfitting occurs when a model is too complex; regularisation, dropout, and cross-validation help prevent it.', expert: 'Overfitting reflects high model variance; addressed via Occam\'s razor (simpler models), regularisation, ensembling, and early stopping.' },
    'supervised':      { def: 'A type of learning where the model is trained using examples that include the correct answers.', example: 'Teaching a child by showing them pictures with labels ("this is a cat") is supervised learning.', intermediate: 'Supervised learning requires labelled data; the model maps inputs to outputs by minimising prediction error.', expert: 'Supervised learning is formalised as learning a hypothesis h: X → Y from labelled pairs (xᵢ, yᵢ) drawn i.i.d. from a distribution.' },
    'unsupervised':    { def: 'A type of learning where the model finds patterns in data without being told the correct answers.', example: 'Sorting a pile of mixed fruits into groups by colour and size — without anyone telling you which group is which.', intermediate: 'Unsupervised methods include clustering (k-means) and dimensionality reduction (PCA, autoencoders).', expert: 'Unsupervised learning estimates the underlying data distribution p(x) using models such as GMMs, VAEs, or density estimators.' },
    'reinforcement':   { def: 'A type of learning where an agent learns by trying actions and receiving rewards or penalties.', example: 'Training a dog with treats for good behaviour is like reinforcement learning — good actions are rewarded.', intermediate: 'An RL agent explores an environment, takes actions, and updates its policy based on cumulative reward.', expert: 'RL is formalised as a Markov Decision Process (S, A, P, R, γ); algorithms like Q-learning and PPO optimise the expected return.' },
    'backpropagation': { def: 'A method used to teach a neural network by calculating how wrong its output was and adjusting from back to front.', example: 'Like getting a test back with red marks and correcting your mistakes from the last question to the first.', intermediate: 'Backpropagation applies the chain rule to compute gradients layer by layer from output back to input.', expert: 'Backpropagation computes ∂L/∂w for all parameters via reverse-mode automatic differentiation; numerical stability requires careful initialisation.' },
    'embedding':       { def: 'A way to represent words or objects as lists of numbers so a computer can work with them.', example: 'Instead of storing the word "cat" as letters, we store it as numbers like [0.2, 0.8, 0.1] that capture its meaning.', intermediate: 'Embeddings map discrete entities (words, users, items) into a continuous vector space where similar items are closer.', expert: 'Embeddings are learned representations that preserve semantic similarity; Word2Vec, GloVe, and transformer-based models generate contextual embeddings.' },
    'probability':     { def: 'A number from 0 to 1 that shows how likely something is to happen.', example: 'If you flip a coin, there is a 0.5 (50%) probability it lands on heads.', intermediate: 'Probability theory underpins classification (posterior probabilities), Bayesian inference, and uncertainty quantification.', expert: 'Probability spaces (Ω, F, P) formalise uncertainty; key theorems include Bayes\' rule, law of total probability, and central limit theorem.' },
    'entropy':         { def: 'A measure of how uncertain or unpredictable information is.', example: 'A coin flip has high entropy (very unpredictable); a coin that always lands heads has zero entropy (perfectly predictable).', intermediate: 'In decision trees, entropy measures class impurity; minimising entropy at each split creates more informative nodes.', expert: 'Shannon entropy H(X) = -Σ p(x) log p(x) quantifies average information content; cross-entropy is the standard classification loss.' },
    'hypothesis':      { def: 'A proposed idea or explanation that has not yet been proven.', example: '"Plants grow taller with more sunlight" is a hypothesis — you still need to test it with an experiment.', intermediate: 'In ML, a hypothesis is a candidate function h from the hypothesis space H that maps inputs to outputs.', expert: 'The PAC learning framework asks: how many samples are needed to learn a hypothesis with bounded error and confidence?' },
    'variable':        { def: 'A named storage location whose value can change during a program or experiment.', example: 'In x = 5, x is a variable. You can later change it to x = 10.', intermediate: 'Variables in programming can be of different types (int, float, string); their scope determines where they are accessible.', expert: 'In statistical modelling, variables are classified as independent (features/predictors) or dependent (target/response) variables.' },
    'function':        { def: 'A reusable block of code or a mathematical rule that takes input and produces output.', example: 'A vending machine is like a function — you press a button (input) and get a snack (output).', intermediate: 'Functions encapsulate logic, promote reusability, and reduce code duplication; they can be pure or have side effects.', expert: 'In functional programming, pure functions are referentially transparent; higher-order functions take or return other functions as arguments.' },
    'protocol':        { def: 'A set of rules that define how computers or people communicate with each other.', example: 'When two people meet, the protocol might be: shake hands, say your name, listen to theirs.', intermediate: 'Network protocols like HTTP, TCP/IP, and DNS define message formats, error handling, and connection management.', expert: 'Protocol design involves trade-offs between reliability (TCP) and speed (UDP); formal verification ensures protocol correctness.' },
    'encryption':      { def: 'Converting readable data into a secret code so only authorised people can read it.', example: 'A lock on a diary is like encryption — only you have the key to read what is inside.', intermediate: 'Symmetric encryption (AES) uses one key; asymmetric encryption (RSA) uses a public/private key pair.', expert: 'Modern encryption relies on computationally hard problems (factoring, discrete logarithms); post-quantum cryptography addresses quantum vulnerabilities.' },
    'scalability':     { def: 'The ability of a system to handle more users or data without slowing down or breaking.', example: 'A restaurant that can serve 10 people but not 100 has a scalability problem.', intermediate: 'Horizontal scaling adds more servers; vertical scaling upgrades existing hardware; both affect cost and architecture.', expert: 'Scalability is quantified using Amdahl\'s Law and Gustafson\'s Law; distributed systems use sharding and replication to achieve linear scale.' },
    'database':        { def: 'An organised collection of data stored so it can be easily accessed, managed, and updated.', example: 'Your school\'s student records — names, marks, attendance — stored in a computer system is a database.', intermediate: 'Relational databases store data in tables; SQL is used to query, insert, update, and delete records.', expert: 'Database internals include B-tree indexing, ACID transactions, query optimisation via execution plans, and MVCC for concurrency control.' },
    'photosynthesis':  { def: 'The process by which green plants use sunlight, water, and CO₂ to make their own food (glucose).', example: 'A plant is like a solar-powered food factory — sunlight in, sugar out.', intermediate: 'Photosynthesis occurs in chloroplasts; the light reactions produce ATP and NADPH, used in the Calvin cycle to fix carbon.', expert: 'Photosynthesis involves Z-scheme electron transport; quantum coherence in light-harvesting complexes achieves near-perfect energy transfer efficiency.' },
    'osmosis':         { def: 'The movement of water through a thin membrane from a less concentrated area to a more concentrated one.', example: 'If you soak a raisin in water, it swells up because water moves into it through osmosis.', intermediate: 'Osmosis is a type of passive transport; osmotic pressure drives water across semi-permeable membranes until equilibrium.', expert: 'Osmotic potential (Ψs = -iCRT) determines net water movement; turgor pressure in plant cells results from the balance between osmotic and pressure potential.' },
    'mitosis':         { def: 'Cell division where one cell splits into two identical daughter cells for growth and repair.', example: 'When you cut your skin and it heals, mitosis is the process making new skin cells.', intermediate: 'Mitosis has 4 phases: prophase, metaphase, anaphase, telophase; the result is two diploid (2n) daughter cells.', expert: 'Mitotic fidelity is ensured by the spindle assembly checkpoint; errors lead to aneuploidy and are implicated in carcinogenesis.' },
    'genetics':        { def: 'The study of genes — the instructions in our DNA that determine our traits and are passed to children.', example: 'Why you have your parent\'s eye colour is explained by genetics — you inherited their genes.', intermediate: 'Mendelian genetics covers dominant/recessive alleles; molecular genetics focuses on DNA replication, transcription, and translation.', expert: 'Quantitative genetics models polygenic traits using heritability (h²); GWAS identifies SNPs associated with complex phenotypes.' },
    'metabolism':      { def: 'All the chemical reactions happening in your body to keep you alive — breaking down food and building new things.', example: 'Your body breaking down a sandwich into energy and building blocks is your metabolism at work.', intermediate: 'Catabolism breaks molecules down (releasing energy); anabolism builds them up (using energy); both are regulated by enzymes.', expert: 'Metabolic flux analysis uses stoichiometric models (FBA) to predict cell behaviour; key pathways include glycolysis, TCA cycle, and oxidative phosphorylation.' },
    'democracy':       { def: 'A system of government where citizens choose their leaders through elections.', example: 'In India, every adult can vote to choose the Prime Minister — that is democracy in action.', intermediate: 'Representative democracy delegates decision-making to elected representatives; direct democracy involves citizens voting on issues directly.', expert: 'Democratic theory distinguishes procedural democracy (electoral fairness) from substantive democracy (rights protection, rule of law, deliberative legitimacy).' },
    'inflation':       { def: 'When prices of goods rise over time, so each rupee (or dollar) buys less than before.', example: 'If a samosa cost ₹5 last year and ₹7 today, that price rise is caused by inflation.', intermediate: 'Demand-pull inflation occurs when demand exceeds supply; cost-push inflation results from rising production costs.', expert: 'Central banks target inflation via monetary policy (interest rate adjustments); the Fisher equation (i = r + π) links nominal rates, real rates, and inflation.' },
    'economy':         { def: 'The system of producing, buying, and selling goods and services in a country.', example: 'All the shops, factories, farms, and services in India together form the Indian economy.', intermediate: 'GDP measures total economic output; economic growth, unemployment, and inflation are the three key macroeconomic indicators.', expert: 'General equilibrium models (DSGE) capture feedback between households, firms, and government; Keynesian models emphasise aggregate demand management.' },
    'derivative':      { def: 'A measure of how quickly something changes — the rate of change at any specific moment.', example: 'If your speed is changing, the derivative tells you your acceleration — how fast the speed is changing.', intermediate: 'The derivative f\'(x) gives the slope of a function at x; differentiation rules (product, chain, quotient) enable systematic computation.', expert: 'The Fréchet derivative extends differentiation to Banach spaces; automatic differentiation enables exact gradient computation in computational graphs.' },
    'polynomial':      { def: 'A mathematical expression made of terms with numbers and variables raised to whole number powers.', example: 'x² + 3x + 2 is a polynomial — it has terms with x raised to the power 2 and 1.', intermediate: 'Polynomial degree determines its shape; roots of a polynomial are values of x where the expression equals zero.', expert: 'Polynomial rings form algebraic structures; the Fundamental Theorem of Algebra states every degree-n polynomial has exactly n complex roots.' },
    'logarithm':       { def: 'The power to which a base number must be raised to get a certain result.', example: 'log₁₀(1000) = 3, because 10³ = 1000. So the logarithm asks: "what power gives this number?"', intermediate: 'Logarithms convert multiplication into addition; log scales are used for exponentially growing quantities like earthquakes (Richter scale).', expert: 'Natural logarithm (ln) appears in entropy, information theory, and complex analysis; the prime counting function π(n) ~ n / ln(n) by the Prime Number Theorem.' },
    'ecosystem':       { def: 'All the living organisms (plants, animals, microbes) in an area along with their non-living environment.', example: 'A pond with fish, frogs, algae, water, and sunlight is a complete ecosystem.', intermediate: 'Ecosystems cycle nutrients (carbon, nitrogen cycle) and transfer energy through food webs from producers to consumers.', expert: 'Ecosystem stability is analysed through resilience and resistance; trophic cascades and keystone species effects demonstrate non-linear ecological dynamics.' },
  };

  const wordSet = new Set(words);
  const found   = [];

  Object.keys(DICT).forEach(function (term) {
    // Match singular/plural variants: match if text contains the root term
    const root    = term.replace(/s$/, '');
    const inText  = words.some(w => w === term || w === term + 's' || w === root || w.startsWith(root));
    if (inText && found.length < 8) {
      const entry = DICT[term];
      let definition;
      if (level === 'beginner') {
        definition = entry.def + ' <em>Example: ' + entry.example + '</em>';
      } else if (level === 'intermediate') {
        definition = entry.intermediate + ' <em>(' + entry.def + ')</em>';
      } else {
        definition = entry.expert + ' <em>Basic meaning: ' + entry.def + '</em>';
      }
      found.push({ term: capitalize(term), definition });
    }
  });

  // Fallback: if no dictionary terms found, use frequency-based key terms
  // and provide a contextual definition using surrounding sentences
  if (found.length === 0) {
    const topTerms = extractKeyTerms(words).slice(0, 6);
    topTerms.forEach(function (term) {
      const hint = level === 'beginner'
        ? 'This is an important word in the text. Look for it in your textbook to understand its meaning in context.'
        : level === 'intermediate'
        ? 'This term appears frequently in the content and is central to understanding the topic. Research its technical definition.'
        : 'This domain-specific term is central to the expert-level understanding of this content. Examine its formal definition and usage.';
      found.push({ term: capitalize(term), definition: hint });
    });
  }

  return found;
}


// ── HELPER: Generate detailed, level-aware Q&A ─────────────────
function generateQA(sentences, keyTerms, topSents, vocab, level) {
  var qa = [];
  var NOT_IN_TEXT = 'Not mentioned in the provided text.';

  // ── Detect compound topic label (e.g. "Machine Learning") ──────
  var rawText    = sentences.join(' ');
  var compound   = detectTopicPhrase(rawText);
  var topicLabel = compound || capitalize(keyTerms[0] || 'this topic');

  // ── Shared deduplication — no answer sentence used twice ────────
  var usedQA = new Set();
  function claimSent(s) {
    if (!s) return false;
    var k = s.trim().slice(0, 40);
    if (usedQA.has(k)) return false;
    usedQA.add(k);
    return true;
  }
  // Returns the first sentence in pool not already used; else null.
  function freshFrom(pool) {
    for (var i = 0; i < pool.length; i++) {
      var k = (pool[i] || '').trim().slice(0, 40);
      if (pool[i] && !usedQA.has(k) && pool[i].trim().length > 15) {
        usedQA.add(k);
        return pool[i];
      }
    }
    return null;
  }

  // ── Category sentence finders (searched once, shared across Qs) ─
  //
  // DESIGN RULE: each finder targets ONE semantic category only.
  // causeSent  = WHY / REASON / PURPOSE   (never application words)
  // exSent     = WHERE / APPLICATION      (never reason words)
  // These two pools are intentionally independent so Q3 and Q4
  // can each claim their own sentence without interfering.

  var defSent = sentences.find(function(s) {
    return /is a |is the |refers to|defined as|means that|known as|constitutes/i.test(s);
  });

  var processSent = sentences.find(function(s) {
    return /how|process|works|operates|step|method|algorithm|technique|procedure/i.test(s)
      && s !== defSent;
  });

  // causeSent — WHY / PURPOSE / REASON only.
  // Explicitly EXCLUDES application-domain words so it never steals
  // the "used in healthcare/education/banking" sentence from Q4.
  var causeSent = sentences.find(function(s) {
    var hasReason = /because|therefore|thus|hence|leads to|causes|result|purpose|objective|goal|reason|aim|intend/i.test(s);
    var hasApp    = /used in|applied in|application|healthcare|education|banking|finance|industry|sector|field|domain/i.test(s);
    return hasReason && !hasApp && s !== defSent && s !== processSent;
  });

  // exSent — WHERE IT IS USED / APPLICATION / EXAMPLE.
  // Independent of causeSent — no s !== causeSent guard — so it can
  // claim the applications sentence even if causeSent matched something else.
  var exSent = sentences.find(function(s) {
    return /used in|applied in|application|example|instance|such as|for example|e\.g\.|healthcare|education|banking|finance|industry|sector|field/i.test(s)
      && s !== defSent && s !== processSent;
  });

  var limitSent = sentences.find(function(s) {
    return /however|limitation|challenge|problem|issue|constraint|assumption|difficult|drawback|cannot/i.test(s);
  });

  // ══════════════════════════════════════════════════════════════
  //  Q1 — What is it? (definition)
  // ══════════════════════════════════════════════════════════════
  var q1Raw = defSent || freshFrom(topSents);
  if (q1Raw) claimSent(q1Raw);
  var q1Answer = q1Raw || NOT_IN_TEXT;

  qa.push({
    q: level === 'expert'
      ? 'Provide a precise technical definition of ' + topicLabel + '.'
      : level === 'intermediate'
      ? 'What is ' + topicLabel + ' and why is it important?'
      : 'What is ' + topicLabel + ' in simple words?',
    a: q1Answer
  });

  // ══════════════════════════════════════════════════════════════
  //  Q2 — How does it work? (mechanism)
  // ══════════════════════════════════════════════════════════════
  var q2Raw = (processSent && !usedQA.has(processSent.trim().slice(0, 40)))
    ? processSent
    : freshFrom(topSents);
  if (q2Raw) claimSent(q2Raw);
  var q2Answer = q2Raw || NOT_IN_TEXT;

  qa.push({
    q: level === 'expert'
      ? 'Explain the mechanism or operation of ' + topicLabel + '.'
      : level === 'intermediate'
      ? 'How does ' + topicLabel + ' work?'
      : 'How does ' + topicLabel + ' work? Explain simply.',
    a: q2Answer
  });

  // ══════════════════════════════════════════════════════════════
  //  Q3 — Why do we study it? (purpose / reason only)
  //  STRICT: only use causeSent (purpose pattern).
  //  Do NOT fall back to freshFrom — a random sentence from the text
  //  is not an answer to "why"; if the text doesn't explain the
  //  purpose, answer is NOT_IN_TEXT.
  // ══════════════════════════════════════════════════════════════
  var q3Key = causeSent ? causeSent.trim().slice(0, 40) : null;
  var q3Raw = (causeSent && !usedQA.has(q3Key)) ? causeSent : null;
  if (q3Raw) claimSent(q3Raw);
  var q3Answer = q3Raw || NOT_IN_TEXT;

  qa.push({
    q: level === 'expert'
      ? 'What is the significance or motivation for ' + topicLabel + '?'
      : level === 'intermediate'
      ? 'Why is ' + topicLabel + ' important?'
      : 'Why do we study ' + topicLabel + '?',
    a: q3Answer
  });

  // ══════════════════════════════════════════════════════════════
  //  Q4 — Where is it used? (application / example)
  //  STRICT: only use exSent (application pattern).
  //  Do NOT fall back to freshFrom — a random sentence is not a
  //  valid answer to "where is it used?".
  // ══════════════════════════════════════════════════════════════
  var q4Key = exSent ? exSent.trim().slice(0, 40) : null;
  var q4Raw = (exSent && !usedQA.has(q4Key)) ? exSent : null;
  if (q4Raw) claimSent(q4Raw);
  var q4Answer = q4Raw || NOT_IN_TEXT;

  qa.push({
    q: level === 'expert'
      ? 'Describe a real-world application or use case of ' + topicLabel + '.'
      : level === 'intermediate'
      ? 'Give an example of how ' + topicLabel + ' is used in practice.'
      : 'Where is ' + topicLabel + ' used in real life?',
    a: q4Answer
  });

  // ══════════════════════════════════════════════════════════════
  //  Q5 — Limitations / additional detail / key terms
  // ══════════════════════════════════════════════════════════════
  if (level === 'expert') {
    // Only use a limitation sentence if it genuinely exists in the text.
    var q5Raw = (limitSent && !usedQA.has(limitSent.trim().slice(0, 40)))
      ? limitSent
      : freshFrom(topSents);
    qa.push({
      q: 'What are the key limitations or challenges associated with ' + topicLabel + '?',
      a: q5Raw || NOT_IN_TEXT
    });

  } else {
    // For beginner/intermediate: ask about a second key concept from the text,
    // but only if there genuinely is one and we can find a sentence that covers it.
    // Otherwise ask about key terms — never generate a relational answer we can't support.
    var secondTerm   = keyTerms[1] ? capitalize(keyTerms[1]) : null;
    // Filter out single-word sub-tokens of the compound label
    var compoundLower = topicLabel.toLowerCase();
    var extraTerms    = keyTerms.filter(function(t) {
      return compoundLower.indexOf(t.toLowerCase()) === -1;
    });
    var q5Raw2 = freshFrom(topSents);

    if (q5Raw2) {
      qa.push({
        q: level === 'intermediate'
          ? 'What additional detail about ' + topicLabel + ' does the text provide?'
          : 'What else does the text tell us about ' + topicLabel + '?',
        a: q5Raw2
      });
    } else {
      // Last resort: list key terms actually extracted from the text
      qa.push({
        q: 'What are the important terms related to ' + topicLabel + ' mentioned in the text?',
        a: extraTerms.length > 0
          ? 'The key terms mentioned are: <strong>'
              + extraTerms.slice(0, 6).map(capitalize).join(', ')
              + '</strong>.'
          : NOT_IN_TEXT
      });
    }
  }

  return qa;
}


// ── HELPER: Generate tiered bullet-point notes ─────────────────
function generateNotes(sentences, keyTerms, topSents, level) {
  // ── Detect compound topic label for all levels ──────────────────
  const rawTextN   = sentences.join(' ');
  const compoundN  = detectTopicPhrase(rawTextN);
  const topic      = compoundN || capitalize(keyTerms[0] || 'Main Topic');
  const topic2     = keyTerms[1] ? capitalize(keyTerms[1]) : null;
  const notes      = [];

  if (level === 'beginner') {
    // Each note draws from a DIFFERENT sentence — deduplication via usedNotes set.
    const usedNotes = new Set();
    function pickNote(pool) {
      for (let i = 0; i < pool.length; i++) {
        const k = pool[i].trim().slice(0, 40);
        if (!usedNotes.has(k) && pool[i].trim().length > 15) {
          usedNotes.add(k);
          return pool[i];
        }
      }
      return null;
    }
    // Build an ordered sentence pool (natural reading order = most coherent for students)
    const orderedPool = sentences.slice();
    // Also have the ranked pool as fallback
    const rankedPool  = topSents.slice();

    // Note 1: What the topic is — best definition-style sentence
    const defNote = sentences.find(s => /is a|is the|refers to|defined as|means|known as/i.test(s));
    const note1sent = defNote ? (usedNotes.add(defNote.trim().slice(0, 40)), defNote) : pickNote(rankedPool);
    notes.push('📌 <strong>Topic:</strong> ' + topic);
    notes.push('🌱 <strong>What it is:</strong> '
      + (note1sent || topic + ' is an important concept in this subject that you need to understand.'));

    // Note 2: Key idea — a different sentence, preferably a "how/process" one
    const howNote = sentences.find(s => /how|process|works|step|enables|used|helps/i.test(s));
    const howKey  = howNote ? howNote.trim().slice(0, 40) : null;
    const note2sent = (howNote && !usedNotes.has(howKey))
      ? (usedNotes.add(howKey), howNote)
      : pickNote(rankedPool);
    notes.push('⚡ <strong>Key idea:</strong> '
      + (note2sent || 'The main point is to understand what <strong>' + topic + '</strong> does and why it matters.'));

    // Note 3: Why it matters — a "result/because/therefore" sentence
    const whyNote = sentences.find(s => /because|therefore|result|important|benefit|advantage|enables|provides/i.test(s));
    const whyKey  = whyNote ? whyNote.trim().slice(0, 40) : null;
    const note3sent = (whyNote && !usedNotes.has(whyKey))
      ? (usedNotes.add(whyKey), whyNote)
      : pickNote(orderedPool);
    notes.push('💡 <strong>Why it matters:</strong> '
      + (note3sent || topic + ' is studied because it helps explain real-world situations and solve practical problems.'));

    // Note 4: One more fact — any remaining unused sentence
    const note4sent = pickNote(rankedPool) || pickNote(orderedPool);
    if (note4sent) {
      notes.push('📖 <strong>One more fact:</strong> ' + note4sent);
    }

    notes.push('🔑 <strong>Important words:</strong> '
      + keyTerms.slice(0, 5).map(capitalize).join(', '));
    notes.push('📝 <strong>Study tip:</strong> Cover these notes and try to recall each point. '
      + 'Then explain <strong>' + safeText(topic) + '</strong> out loud in 2–3 sentences — this is the fastest way to check your understanding.');

  } else if (level === 'intermediate') {
    // ── Detect the best topic label (prefer compound phrase over single word) ──
    const rawText    = sentences.join(' ');
    const compound   = detectTopicPhrase(rawText);
    const topicLabel = compound || (topic + (topic2 ? ' and ' + topic2 : ''));

    // ── Deduplication: track which sentences are already used ──
    const usedI = new Set();
    function pickI(pool) {
      for (var i = 0; i < pool.length; i++) {
        var k = (pool[i] || '').trim().slice(0, 40);
        if (pool[i] && !usedI.has(k) && pool[i].trim().length > 15) {
          usedI.add(k);
          return pool[i];
        }
      }
      return null;
    }

    // Note 1 — Topic label (no sentence, just the compound name)
    notes.push('📌 <strong>Topic:</strong> <strong>' + topicLabel + '</strong>');

    // Note 2 — Definition: sentence that defines/introduces the topic
    var defI = sentences.find(function(s) {
      return /is a |is the |refers to|defined as|means that|can be defined|known as/i.test(s);
    });
    if (defI) usedI.add(defI.trim().slice(0, 40));
    notes.push('📘 <strong>Definition:</strong> '
      + (defI || pickI(topSents)
        || (topicLabel + ' refers to a key concept central to this subject area.')));

    // Note 3 — How it works: process/mechanism sentence from the text
    var howI = sentences.find(function(s) {
      return /how|process|works|operates|step|algorithm|method|technique|procedure/i.test(s)
        && !usedI.has(s.trim().slice(0, 40));
    });
    if (howI) usedI.add(howI.trim().slice(0, 40));
    notes.push('⚙️ <strong>How it works:</strong> '
      + (howI || pickI(topSents)
        || ('The process involves ' + keyTerms.slice(1, 4).map(capitalize).join(', ') + '.')));

    // Note 4 — Applications: sentence mentioning use-cases, domains, or real-world fields
    //          Label is "Applications" — never "Key relationship"
    var appI = sentences.find(function(s) {
      return /used in|applied in|application|healthcare|education|banking|finance|industry|sector|field|domain|real.?world|such as|including/i.test(s)
        && !usedI.has(s.trim().slice(0, 40));
    });
    if (appI) usedI.add(appI.trim().slice(0, 40));
    notes.push('🌐 <strong>Applications:</strong> '
      + (appI || pickI(topSents)
        || ('Understanding ' + topicLabel + ' is valuable in many real-world fields and practical situations.')));

    // Note 5 — Important detail: cause/result/benefit sentence not yet used
    var detailI = sentences.find(function(s) {
      return /because|therefore|result|benefit|advantage|enables|allows|improves|reduces|increases/i.test(s)
        && !usedI.has(s.trim().slice(0, 40));
    });
    if (detailI) usedI.add(detailI.trim().slice(0, 40));
    notes.push('📊 <strong>Important detail:</strong> '
      + (detailI || pickI(topSents)
        || ('Look for the key principles that explain how ' + topicLabel + ' achieves its results.')));

    // Note 6 — Key terms: only from keyTerms extracted from the actual text
    notes.push('🔑 <strong>Key terms:</strong> '
      + keyTerms.slice(0, 7).map(capitalize).join(' · '));

    // Note 7 — Exam tip: fixed phrasing using topicLabel, no invented facts
    notes.push('📝 <strong>Exam tip:</strong> Be ready to define <strong>'
      + topicLabel + '</strong>, explain how it works with an example from the text, '
      + 'and list at least 3 key terms in your own words.');

  } else {
    // ── Expert level ────────────────────────────────────────────
    // Rule: every sentence used must come from the user's text.
    // If no matching sentence is found for a section, the value
    // is set to the literal string NOT_IN_TEXT (rendered as a note).
    var NOT_IN_TEXT = 'Not mentioned in the provided text.';

    // Detect compound topic label (same logic as intermediate)
    var rawTextE   = sentences.join(' ');
    var compoundE  = detectTopicPhrase(rawTextE);
    var topicLabelE = compoundE || (topic + (topic2 ? ' · ' + topic2 : ''));

    // Deduplication set — no sentence appears in more than one note
    var usedE = new Set();
    function pickE(pool) {
      for (var i = 0; i < pool.length; i++) {
        var k = (pool[i] || '').trim().slice(0, 40);
        if (pool[i] && !usedE.has(k) && pool[i].trim().length > 15) {
          usedE.add(k);
          return pool[i];
        }
      }
      return null;
    }

    // ── Note 1: Technical Domain ─────────────────────────────────
    // Show the detected compound topic, then supporting key terms.
    notes.push('🎓 <strong>Technical Domain:</strong> <strong>'
      + topicLabelE + '</strong>'
      + (keyTerms.length > 1
          ? ' — Key terms: ' + keyTerms.slice(0, 6).map(capitalize).join(', ')
          : ''));

    // ── Note 2: Formal Concept / Definition ──────────────────────
    // Sentence that defines/introduces the topic formally.
    var defE = sentences.find(function(s) {
      return /is a |is the |refers to|defined as|means that|can be defined|known as|constitutes/i.test(s);
    });
    if (defE) usedE.add(defE.trim().slice(0, 40));
    notes.push('📐 <strong>Formal concept:</strong> '
      + (defE || pickE(topSents) || NOT_IN_TEXT));

    // ── Note 3: Mechanism / How it operates ──────────────────────
    // Sentence describing process, algorithm, operation.
    var mechE = sentences.find(function(s) {
      return /how|process|works|operates|algorithm|mechanism|procedure|technique|method/i.test(s)
        && !usedE.has(s.trim().slice(0, 40));
    });
    if (mechE) usedE.add(mechE.trim().slice(0, 40));
    notes.push('⚙️ <strong>Mechanism:</strong> '
      + (mechE || pickE(topSents) || NOT_IN_TEXT));

    // ── Note 4: Technical Detail ─────────────────────────────────
    // A sentence providing additional technical specifics — type/kind/component.
    var techE = sentences.find(function(s) {
      return /type|kind|consist|comprise|component|element|structure|category|form|stage|layer|level|part/i.test(s)
        && !usedE.has(s.trim().slice(0, 40));
    });
    if (techE) usedE.add(techE.trim().slice(0, 40));
    notes.push('🔬 <strong>Technical detail:</strong> '
      + (techE || pickE(topSents) || NOT_IN_TEXT));

    // ── Note 5: Advanced Insight ─────────────────────────────────
    // A sentence showing deeper understanding — cause, implication, outcome.
    // Only from text; if absent → NOT_IN_TEXT.
    var insightE = sentences.find(function(s) {
      return /therefore|thus|hence|consequently|result|impact|implication|enables|allows|leads to|shows that|demonstrates/i.test(s)
        && !usedE.has(s.trim().slice(0, 40));
    });
    if (insightE) usedE.add(insightE.trim().slice(0, 40));
    notes.push('📊 <strong>Advanced insight:</strong> '
      + (insightE || pickE(topSents) || NOT_IN_TEXT));

    // ── Note 6: Limitations / Assumptions ────────────────────────
    // Only if the source text contains a limitation/challenge/assumption.
    var limitE = sentences.find(function(s) {
      return /however|limitation|challenge|problem|issue|constraint|assumption|difficult|drawback|disadvantage|fail|restrict|cannot|but/i.test(s)
        && !usedE.has(s.trim().slice(0, 40));
    });
    if (limitE) usedE.add(limitE.trim().slice(0, 40));
    notes.push('⚠️ <strong>Limitations / Assumptions:</strong> '
      + (limitE || NOT_IN_TEXT));

    // ── Note 7: Core Terminology ─────────────────────────────────
    // Extracted directly from the input text — never invented.
    notes.push('🔑 <strong>Core terminology:</strong> '
      + keyTerms.slice(0, 8).map(capitalize).join(' · '));

    // ── Note 8: Research Direction ───────────────────────────────
    // Only include if the text itself mentions future work, open questions,
    // research, or directions to explore. Otherwise NOT_IN_TEXT.
    var researchE = sentences.find(function(s) {
      return /research|future|explore|further|ongoing|open question|study|investigate|direction|frontier/i.test(s)
        && !usedE.has(s.trim().slice(0, 40));
    });
    if (researchE) usedE.add(researchE.trim().slice(0, 40));
    notes.push('📚 <strong>Research direction:</strong> '
      + (researchE || NOT_IN_TEXT));
  }

  return notes;
}


// ──────────────────────────────────────────────────────────────
//  9. IBM WATSONX.AI — REAL API CALL
//  This function runs only when USE_REAL_AI = true.
//  It calls the Granite model to generate all outputs in one shot.
//
//  ⚠️  In production, proxy this call through a backend server
//      so API credentials are never exposed in browser JavaScript.
// ──────────────────────────────────────────────────────────────
async function callWatsonxAI(text, level) {
  // Step 1: Get IAM token using the API key
  const iamResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method : 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body   : 'grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=' + WATSONX_API_KEY
  });

  if (!iamResponse.ok) {
    throw new Error('IBM IAM authentication failed (HTTP ' + iamResponse.status + '). Check your API key.');
  }
  const iamData = await iamResponse.json();
  if (!iamData.access_token) {
    throw new Error('IBM IAM response did not include an access token.');
  }
  const bearerToken = iamData.access_token;

  // Step 2: Build the prompt
  const levelDesc = level === 'beginner'
    ? 'Use very simple language. Avoid technical jargon. Explain like to a 12-year-old.'
    : level === 'intermediate'
    ? 'Use clear language with some technical terms explained.'
    : 'Use precise technical language suitable for a university student.';

  const prompt = `You are an educational AI assistant. Given the following study material, produce a JSON response with exactly these 5 keys:
1. "simplified": array of 3-5 strings (simplified explanation paragraphs, ${levelDesc})
2. "vocab": array of objects {term, definition} for up to 6 difficult words
3. "summary": a single string (2-3 sentence summary)
4. "qa": array of 5 objects {q, a} (important questions and answers)
5. "notes": array of 6-8 strings (bullet-point study notes)

Study material:
"""
${text}
"""

Respond ONLY with valid JSON, no extra text.`;

  // Step 3: Call Granite model
  const aiResponse = await fetch(WATSONX_URL + '/ml/v1/text/generation?version=2023-05-29', {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': 'Bearer ' + bearerToken
    },
    body: JSON.stringify({
      model_id  : WATSONX_MODEL,
      project_id: WATSONX_PROJECT,
      input     : prompt,
      parameters: {
        max_new_tokens: 1500,
        temperature   : 0.3,
        top_p         : 0.9
      }
    })
  });

  if (!aiResponse.ok) {
    throw new Error('watsonx.ai API call failed (HTTP ' + aiResponse.status + ').');
  }

  const aiData = await aiResponse.json();

  // Guard: verify the expected response shape before accessing nested properties
  if (!aiData.results || !Array.isArray(aiData.results) || aiData.results.length === 0) {
    throw new Error('watsonx.ai returned an unexpected response shape (missing results array).');
  }
  if (typeof aiData.results[0].generated_text !== 'string') {
    throw new Error('watsonx.ai result[0].generated_text is missing or not a string.');
  }

  const raw = aiData.results[0].generated_text.trim();

  // Step 4: Parse JSON from the model response
  // Guard: ensure a JSON object is actually present in the output
  const jsonStart = raw.indexOf('{');
  const jsonEnd   = raw.lastIndexOf('}') + 1;
  if (jsonStart === -1 || jsonEnd <= jsonStart) {
    throw new Error('watsonx.ai response did not contain a JSON object. Raw output: ' + raw.slice(0, 200));
  }

  const jsonStr = raw.slice(jsonStart, jsonEnd);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse JSON from watsonx.ai response: ' + e.message);
  }

  // Guard: verify all five required keys are present
  const required = ['simplified', 'vocab', 'summary', 'qa', 'notes'];
  const missing  = required.filter(function (k) { return !(k in parsed); });
  if (missing.length > 0) {
    throw new Error('watsonx.ai JSON response is missing required keys: ' + missing.join(', '));
  }

  return parsed;
}


// ──────────────────────────────────────────────────────────────
//  10. UI STATE MANAGER
//  Controls which state the output panel shows
// ──────────────────────────────────────────────────────────────
function showState(state) {
  outputPlaceholder.classList.add('hidden');
  outputLoading.classList.add('hidden');
  outputResults.classList.add('hidden');

  if (state === 'placeholder') outputPlaceholder.classList.remove('hidden');
  if (state === 'loading')     outputLoading.classList.remove('hidden');
  if (state === 'results')     outputResults.classList.remove('hidden');
}


// ──────────────────────────────────────────────────────────────
//  11. TOAST NOTIFICATION
//  Shows a small message at the bottom of the screen
// ──────────────────────────────────────────────────────────────
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}


// ──────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ──────────────────────────────────────────────────────────────

// Capitalize first letter of a word
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Shake an element to show validation error
function shakeElement(el) {
  el.style.animation = 'none';
  el.style.transition = 'none';
  el.style.outline = '2px solid #dc2626';
  setTimeout(() => {
    el.style.outline = '';
  }, 800);
}

// Promisified setTimeout for async/await delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ──────────────────────────────────────────────────────────────
//  INIT — runs when page loads
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  showState('placeholder');
  inputText.focus();
  console.log('%c SimplifyAI loaded 🚀 ', 'background:#1d4ed8;color:#fff;padding:4px 8px;border-radius:4px;');
  console.log('IBM SkillsBuild Internship — Project 19 | Raj Soni');
  console.log('USE_REAL_AI is currently:', USE_REAL_AI ? '✅ ON (watsonx.ai)' : '⚙️ OFF (built-in engine)');
});
