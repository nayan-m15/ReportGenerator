/**
 * TeXReport — LaTeX Report Generator
 * Handles tab switching, dynamic form building,
 * validation, LaTeX generation, and file download.
 */

/* ═══════════════════════════════════════════════
   UTILITY: LaTeX Escaping
   ═══════════════════════════════════════════════ */

/**
 * Escapes special LaTeX characters in a string so
 * user input doesn't break the generated document.
 * @param {string} str - Raw user input
 * @returns {string} LaTeX-safe string
 */
function escLaTeX(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g,  '\\textbackslash{}')
    .replace(/&/g,   '\\&')
    .replace(/%/g,   '\\%')
    .replace(/\$/g,  '\\$')
    .replace(/#/g,   '\\#')
    .replace(/_/g,   '\\_')
    .replace(/\{/g,  '\\{')
    .replace(/\}/g,  '\\}')
    .replace(/~/g,   '\\textasciitilde{}')
    .replace(/\^/g,  '\\textasciicircum{}');
}

/**
 * Formats a date string (YYYY-MM-DD) into a readable format.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/* ═══════════════════════════════════════════════
   TAB SYSTEM
   ═══════════════════════════════════════════════ */

const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    // Update button states
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    // Update panel visibility
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(`tab-${target}`);
    if (targetPanel) targetPanel.classList.add('active');

    // Hide output whenever switching tabs
    hideOutput();
  });
});

/* ═══════════════════════════════════════════════
   DYNAMIC LIST HELPERS
   ═══════════════════════════════════════════════ */

/**
 * Creates a new dynamic list item (single text input + remove button).
 * @param {string} inputClass  - CSS class for the input
 * @param {string} placeholder - Placeholder text
 * @returns {HTMLElement}
 */
function createDynamicItem(inputClass, placeholder) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = `field-input ${inputClass}`;
  input.placeholder = placeholder;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-remove';
  removeBtn.setAttribute('aria-label', 'Remove item');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => {
    div.remove();
  });

  div.appendChild(input);
  div.appendChild(removeBtn);
  return div;
}

/**
 * Collects non-empty values from inputs of a given class within a container.
 * @param {string} selector - CSS selector for the inputs
 * @param {Element} [container=document] - Parent container
 * @returns {string[]}
 */
function collectList(selector, container = document) {
  return [...container.querySelectorAll(selector)]
    .map(el => el.value.trim())
    .filter(Boolean);
}

/* ─── Attendees ────────────────────────────────── */
document.getElementById('add-attendee').addEventListener('click', () => {
  document.getElementById('attendees-list').appendChild(
    createDynamicItem('attendee-input', 'Full name')
  );
});

setupRemovable('attendees-list');

/* ─── Decisions ────────────────────────────────── */
document.getElementById('add-decision').addEventListener('click', () => {
  document.getElementById('decisions-list').appendChild(
    createDynamicItem('decision-input', 'Describe a decision made…')
  );
});

setupRemovable('decisions-list');

/* ─── Risks ─────────────────────────────────────── */
document.getElementById('add-risk').addEventListener('click', () => {
  document.getElementById('risks-list').appendChild(
    createDynamicItem('risk-input', 'Describe an issue or risk…')
  );
});

setupRemovable('risks-list');

/* ─── Next Steps ──────────────────────────────── */
document.getElementById('add-nextstep').addEventListener('click', () => {
  document.getElementById('nextsteps-list').appendChild(
    createDynamicItem('nextstep-input', 'Describe a next step…')
  );
});

setupRemovable('nextsteps-list');

/** Wire up existing remove buttons inside a list container. */
function setupRemovable(containerId) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.dynamic-item').remove());
  });
}

/* ═══════════════════════════════════════════════
   DISCUSSION TOPICS (nested dynamic structure)
   ═══════════════════════════════════════════════ */

const topicsList = document.getElementById('topics-list');

/** Creates a full topic block with title + bullets */
function createTopicBlock() {
  const block = document.createElement('div');
  block.className = 'topic-block';

  // ── Topic header (title + remove block button)
  const header = document.createElement('div');
  header.className = 'topic-block-header';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'field-input topic-title';
  titleInput.placeholder = 'Topic title (e.g. Budget Review)';

  const removeBlock = document.createElement('button');
  removeBlock.type = 'button';
  removeBlock.className = 'btn-remove';
  removeBlock.setAttribute('aria-label', 'Remove topic');
  removeBlock.textContent = '✕';
  removeBlock.addEventListener('click', () => block.remove());

  header.appendChild(titleInput);
  header.appendChild(removeBlock);

  // ── Bullets container
  const bulletsContainer = document.createElement('div');
  bulletsContainer.className = 'topic-bullets dynamic-list';

  const firstBullet = createDynamicItem('bullet-input', 'Discussion point…');
  bulletsContainer.appendChild(firstBullet);

  // ── Add bullet button
  const addBulletBtn = document.createElement('button');
  addBulletBtn.type = 'button';
  addBulletBtn.className = 'btn-add-item';
  addBulletBtn.innerHTML = '<span>+</span> Add Bullet Point';
  addBulletBtn.addEventListener('click', () => {
    bulletsContainer.appendChild(
      createDynamicItem('bullet-input', 'Discussion point…')
    );
  });

  block.appendChild(header);
  block.appendChild(bulletsContainer);
  block.appendChild(addBulletBtn);

  return block;
}

// Initialize with one topic block
topicsList.appendChild(createTopicBlock());

document.getElementById('add-topic').addEventListener('click', () => {
  topicsList.appendChild(createTopicBlock());
});

/* ═══════════════════════════════════════════════
   ACTION ITEMS (table-like rows)
   ═══════════════════════════════════════════════ */

const actionsList = document.getElementById('actions-list');

/** Creates a single action item row */
function createActionRow() {
  const row = document.createElement('div');
  row.className = 'action-row';

  const taskInput = document.createElement('input');
  taskInput.type = 'text';
  taskInput.className = 'field-input action-task';
  taskInput.placeholder = 'Describe the task…';

  const personInput = document.createElement('input');
  personInput.type = 'text';
  personInput.className = 'field-input action-person';
  personInput.placeholder = 'Name';

  const deadlineInput = document.createElement('input');
  deadlineInput.type = 'date';
  deadlineInput.className = 'field-input action-deadline';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-remove';
  removeBtn.setAttribute('aria-label', 'Remove action');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(taskInput);
  row.appendChild(personInput);
  row.appendChild(deadlineInput);
  row.appendChild(removeBtn);

  return row;
}

// Initialize with two action rows
actionsList.appendChild(createActionRow());
actionsList.appendChild(createActionRow());

document.getElementById('add-action').addEventListener('click', () => {
  actionsList.appendChild(createActionRow());
});

/* ═══════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════ */

/**
 * Validates a required field. Shows/clears error message.
 * @param {string} fieldId   - Input element ID
 * @param {string} errorId   - Error span element ID
 * @param {string} message   - Error message to display
 * @returns {boolean} true if valid
 */
function validateRequired(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);
  const value = field.value.trim();

  if (!value) {
    field.classList.add('error');
    error.textContent = message;
    return false;
  }

  field.classList.remove('error');
  error.textContent = '';
  return true;
}

/** Clears all validation errors inside a form */
function clearErrors(formEl) {
  formEl.querySelectorAll('.field-input, .field-textarea').forEach(el => {
    el.classList.remove('error');
  });
  formEl.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
  });
}

/* ═══════════════════════════════════════════════
   OUTPUT PANEL HELPERS
   ═══════════════════════════════════════════════ */

const outputPanel  = document.getElementById('output-panel');
const latexOutput  = document.getElementById('latex-output');
const outputLabel  = document.getElementById('output-label');
const btnCopy      = document.getElementById('btn-copy');
const btnDownload  = document.getElementById('btn-download');

let currentFilename = 'document.tex';

function showOutput(latex, title, filename) {
  latexOutput.textContent = latex;
  outputLabel.textContent = title;
  currentFilename = filename;
  outputPanel.classList.add('visible');
  // Smooth scroll to output
  setTimeout(() => {
    outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function hideOutput() {
  outputPanel.classList.remove('visible');
}

/* ─── Copy Button ──────────────────────────────── */
btnCopy.addEventListener('click', () => {
  const text = latexOutput.textContent;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    btnCopy.textContent = '✓ Copied!';
    btnCopy.classList.add('copied');
    setTimeout(() => {
      btnCopy.textContent = 'Copy';
      btnCopy.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btnCopy.textContent = '✓ Copied!';
    btnCopy.classList.add('copied');
    setTimeout(() => {
      btnCopy.textContent = 'Copy';
      btnCopy.classList.remove('copied');
    }, 2000);
  });
});

/* ─── Download Button ──────────────────────────── */
btnDownload.addEventListener('click', () => {
  const text = latexOutput.textContent;
  if (!text) return;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = currentFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* ═══════════════════════════════════════════════
   LATEX TEMPLATE: MINUTES OF MEETING
   ═══════════════════════════════════════════════ */

/**
 * Collects all form data for the Minutes form and
 * builds a valid LaTeX document string.
 * @returns {string|null} LaTeX string or null if invalid
 */
function generateMinutesLaTeX() {
  const form = document.getElementById('form-minutes');
  clearErrors(form);

  // ── Validate required fields
  const v1 = validateRequired('m-title',   'err-m-title',   'Meeting title is required.');
  const v2 = validateRequired('m-date',    'err-m-date',    'Date is required.');
  const v3 = validateRequired('m-lead',    'err-m-lead',    'Meeting lead name is required.');
  const v4 = validateRequired('m-purpose', 'err-m-purpose', 'Meeting purpose is required.');

  if (!v1 || !v2 || !v3 || !v4) {
    // Scroll to first error
    form.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return null;
  }

  // ── Collect values
  const title    = escLaTeX(document.getElementById('m-title').value.trim());
  const date     = escLaTeX(formatDate(document.getElementById('m-date').value));
  const time     = escLaTeX(document.getElementById('m-time').value || 'Not specified');
  const location = escLaTeX(document.getElementById('m-location').value.trim() || 'Not specified');
  const lead     = escLaTeX(document.getElementById('m-lead').value.trim());
  const purpose  = escLaTeX(document.getElementById('m-purpose').value.trim());

  // ── Attendees
  const attendees = collectList('.attendee-input').map(escLaTeX);
  const attendeeItems = attendees.length > 0
    ? attendees.map(a => `    \\item ${a}`).join('\n')
    : '    \\item N/A';

  // ── Topics
  const topicBlocks = document.querySelectorAll('.topic-block');
  let topicsLaTeX = '';
  topicBlocks.forEach(block => {
    const topicTitle = escLaTeX(block.querySelector('.topic-title')?.value.trim() || 'Untitled Topic');
    const bullets = [...block.querySelectorAll('.bullet-input')]
      .map(el => el.value.trim())
      .filter(Boolean)
      .map(escLaTeX);

    const bulletItems = bullets.length > 0
      ? bullets.map(b => `    \\item ${b}`).join('\n')
      : '    \\item —';

    topicsLaTeX += `\\subsection*{${topicTitle}}\n`;
    topicsLaTeX += `\\begin{itemize}\n${bulletItems}\n\\end{itemize}\n\n`;
  });

  if (!topicsLaTeX) {
    topicsLaTeX = '\\subsection*{General Discussion}\n\\begin{itemize}\n    \\item —\n\\end{itemize}\n';
  }

  // ── Decisions
  const decisions = collectList('.decision-input').map(escLaTeX);
  const decisionItems = decisions.length > 0
    ? decisions.map(d => `    \\item ${d}`).join('\n')
    : '    \\item No decisions recorded.';

  // ── Action Items
  const actionRows = document.querySelectorAll('.action-row');
  let actionTableRows = '';
  actionRows.forEach(row => {
    const task     = escLaTeX(row.querySelector('.action-task')?.value.trim()   || '—');
    const person   = escLaTeX(row.querySelector('.action-person')?.value.trim() || '—');
    const deadline = escLaTeX(formatDate(row.querySelector('.action-deadline')?.value) || '—');
    if (task !== '—' || person !== '—') {
      actionTableRows += `${task} & ${person} & ${deadline} \\\\\n\\hline\n`;
    }
  });

  if (!actionTableRows) {
    actionTableRows = '— & — & — \\\\\n\\hline\n';
  }

  // ── Risks
  const risks = collectList('.risk-input').map(escLaTeX);
  const riskItems = risks.length > 0
    ? risks.map(r => `    \\item ${r}`).join('\n')
    : '    \\item No issues or risks identified.';

  // ── Next Steps
  const steps = collectList('.nextstep-input').map(escLaTeX);
  const stepItems = steps.length > 0
    ? steps.map(s => `    \\item ${s}`).join('\n')
    : '    \\item —';

  // ── Next Meeting
  const nextDate    = escLaTeX(formatDate(document.getElementById('m-next-date').value) || 'TBD');
  const nextPurpose = escLaTeX(document.getElementById('m-next-purpose').value.trim() || 'TBD');

  // ── Assemble LaTeX document
  return `\\documentclass[12pt]{article}
\\usepackage[a4paper, margin=1in]{geometry}
\\usepackage{setspace}
\\usepackage{longtable}
\\usepackage{titlesec}
\\setstretch{1.2}
\\titleformat{\\section}{\\large\\bfseries}{\\thesection}{1em}{}
\\begin{document}

\\begin{center}
    \\LARGE \\textbf{Meeting Minutes} \\\\
    \\vspace{0.3cm}
    \\large \\textbf{${title}} \\\\
\\end{center}

\\vspace{0.5cm}
\\section{Meeting Details}
\\textbf{Date:} ${date} \\\\
\\textbf{Time:} ${time} \\\\
\\textbf{Location:} ${location} \\\\
\\textbf{Meeting Lead:} ${lead}

\\vspace{0.3cm}
\\textbf{Attendees:}
\\begin{itemize}
${attendeeItems}
\\end{itemize}

\\section{Purpose of the Meeting}
${purpose}

\\section{Key Discussion Points}
${topicsLaTeX.trimEnd()}

\\section{Decisions Made}
\\begin{itemize}
${decisionItems}
\\end{itemize}

\\section{Action Items}
\\begin{longtable}{|p{7cm}|p{3cm}|p{3cm}|}
\\hline
\\textbf{Task} & \\textbf{Responsible} & \\textbf{Deadline} \\\\
\\hline
${actionTableRows.trimEnd()}
\\end{longtable}

\\section{Issues and Risks}
\\begin{itemize}
${riskItems}
\\end{itemize}

\\section{Next Steps}
\\begin{itemize}
${stepItems}
\\end{itemize}

\\section{Next Meeting}
\\textbf{Date:} ${nextDate} \\\\
\\textbf{Purpose:} ${nextPurpose}

\\end{document}`;
}

/* ═══════════════════════════════════════════════
   LATEX TEMPLATE: SPRINT RETROSPECTIVE
   ═══════════════════════════════════════════════ */

/**
 * Collects all form data for the Retrospective form and
 * builds a valid LaTeX document string.
 * @returns {string|null} LaTeX string or null if invalid
 */
function generateRetroLaTeX() {
  const form = document.getElementById('form-retro');
  clearErrors(form);

  // ── Validate required fields
  const v1 = validateRequired('r-sprint',        'err-r-sprint',        'Sprint number is required.');
  const v2 = validateRequired('r-date',          'err-r-date',          'Date is required.');
  const v3 = validateRequired('r-name',          'err-r-name',          'Your name is required.');
  const v4 = validateRequired('r-course',        'err-r-course',        'Course / module is required.');
  const v5 = validateRequired('r-contributions', 'err-r-contributions', 'Overview of contributions is required.');

  if (!v1 || !v2 || !v3 || !v4 || !v5) {
    form.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return null;
  }

  // ── Collect values
  const sprint   = escLaTeX(document.getElementById('r-sprint').value.trim());
  const date     = escLaTeX(formatDate(document.getElementById('r-date').value));
  const name     = escLaTeX(document.getElementById('r-name').value.trim());
  const course   = escLaTeX(document.getElementById('r-course').value.trim());

  const contributions = escLaTeX(document.getElementById('r-contributions').value.trim());
  const challenges    = escLaTeX(document.getElementById('r-challenges').value.trim()
    || 'No specific challenges recorded.');
  const differently   = escLaTeX(document.getElementById('r-differently').value.trim()
    || 'No reflections recorded.');
  const system        = escLaTeX(document.getElementById('r-system').value.trim()
    || 'No system contribution recorded.');

  // ── Assemble LaTeX document
  return `\\documentclass[11pt,a4paper]{article}
% Packages
\\usepackage[margin=1in]{geometry}
\\usepackage{titlesec}
\\usepackage{setspace}
\\usepackage{parskip}
\\usepackage{xcolor}
\\usepackage{helvet}
\\usepackage{fancyhdr}
\\usepackage{tikz}
\\usetikzlibrary{calc}
\\renewcommand{\\familydefault}{\\sfdefault}

% Colors
\\definecolor{primary}{HTML}{1F4E79}
\\definecolor{secondary}{HTML}{555555}

% Section formatting
\\titleformat{\\section}
  {\\large\\bfseries\\color{primary}}
  {}
  {0em}
  {}

% Line spacing
\\setstretch{1.2}

% Footer setup
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot[C]{\\color{secondary} Sprint Retrospective \\textbar\\ 2026 \\textbar\\ Page \\thepage}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Border using TikZ
\\usepackage{eso-pic}
\\AddToShipoutPictureBG{%
\\begin{tikzpicture}[remember picture, overlay]
\\draw[line width=1.5pt, color=primary]
    ($(current page.north west) + (1cm,-1cm)$)
    rectangle
    ($(current page.south east) + (-1cm,1cm)$);
\\end{tikzpicture}%
}

\\begin{document}

% Header
\\begin{center}
    {\\Huge \\bfseries \\color{primary} Sprint \\#${sprint} Retrospective} \\\\[10pt]
    {\\large \\color{secondary} ${name}} \\\\[5pt]
    {\\small \\color{secondary} ${course} \\quad | \\quad ${date}}
\\end{center}

\\vspace{20pt}

% Sections
\\section*{Overview of Contributions}
${contributions}

\\vspace{10pt}

\\section*{Challenges Encountered}
${challenges}

\\vspace{10pt}

\\section*{What I Would Do Differently}
${differently}

\\vspace{10pt}

\\section*{Contribution to the Overall System}
${system}

\\vspace{20pt}
\\hrule
\\vspace{5pt}
{\\small \\color{secondary} This document reflects individual contributions and learning during the sprint.}

\\end{document}`;
}

/* ═══════════════════════════════════════════════
   FORM SUBMIT HANDLERS
   ═══════════════════════════════════════════════ */

document.getElementById('form-minutes').addEventListener('submit', (e) => {
  e.preventDefault();
  const latex = generateMinutesLaTeX();
  if (!latex) return;

  const title = document.getElementById('m-title').value.trim();
  showOutput(latex, `Meeting Minutes — ${title}`, `minutes_${sanitizeFilename(title)}.tex`);
});

document.getElementById('form-retro').addEventListener('submit', (e) => {
  e.preventDefault();
  const latex = generateRetroLaTeX();
  if (!latex) return;

  const sprint = document.getElementById('r-sprint').value.trim();
  const name   = document.getElementById('r-name').value.trim();
  showOutput(latex, `Sprint #${sprint} Retrospective — ${name}`, `retro_sprint${sprint}_${sanitizeFilename(name)}.tex`);
});

/* ═══════════════════════════════════════════════
   FILENAME SANITISATION
   ═══════════════════════════════════════════════ */

/**
 * Converts a human-readable string into a safe filename.
 * @param {string} str
 * @returns {string}
 */
function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '')
    .slice(0, 40);
}

/* ═══════════════════════════════════════════════
   CLEAR ERROR ON INPUT
   ═══════════════════════════════════════════════ */

// Automatically clear error state when user types into a field
document.querySelectorAll('.field-input, .field-textarea').forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('error');
    const errorId = `err-${el.id}`;
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.textContent = '';
  });
});
