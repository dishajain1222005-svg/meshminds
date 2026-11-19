// js/admin-common.js — MeshMinds Admin Logic
import { auth, db, ADMIN_UID } from './firebase.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc, setDoc, collection, addDoc,
  serverTimestamp, query, getDocs,
  orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ── CONFIG ─────────────────────────────────────── */
const COURSES  = ["B.Tech"];
const BRANCHES = ["CSE","IT","AIML","AIDS","VLSI"];

const COMMON_SEM12 = [
  "Applied Chemistry","Applied Mathematics I","Applied Physics I",
  "Communication Skills","Engineering Graphics","Engineering Mechanics",
  "Electrical Science","Environmental Science","Human Values and Professional Ethics",
  "Indian Constitution","Manufacturing Processes","Programming in C","Workshop Practice"
];

const SUBJECTS_BY_BRANCH = {
  CSE:{
    3:["Digital Logic Design","Discrete Mathematics","Data Structures","Object Oriented Programming",
       "Probability, Statistics & Linear Algebra","Foundation of Data Science","Principles of Artificial Intelligence",
       "Computational Methods","Universal Human Values II"],
    4:["Design and Analysis of Algorithms","Database Management Systems","Computer Organization",
       "Operating Systems","Computer Networks","Software Engineering","Numerical Methods"]
  },
  IT:{
    3:["Digital Logic Design","Discrete Mathematics","Data Structures","Object Oriented Programming",
       "Probability, Statistics & Linear Algebra","Foundation of Data Science","Principles of Artificial Intelligence",
       "Computational Methods","Universal Human Values II"],
    4:["Database Management Systems","Operating Systems","Computer Networks",
       "Web Technologies","Software Engineering","Internet of Things (Intro)"]
  },
  AIML:{
    3:["Data Structures","Discrete Mathematics","Probability, Statistics & Linear Algebra",
       "Object Oriented Programming","Foundation of Data Science","Principles of Artificial Intelligence",
       "Machine Learning Basics","Universal Human Values II"],
    4:["Machine Learning I","Data Mining","Linear Algebra for ML","Statistics for ML","Python for Data Science"]
  },
  AIDS:{
    3:["Data Structures","Discrete Mathematics","Probability, Statistics & Linear Algebra",
       "Object Oriented Programming","Foundation of Data Science","Principles of Artificial Intelligence",
       "Data Analysis Basics","Universal Human Values II"],
    4:["Machine Learning I","Data Visualization","APIs & Data Engineering Basics","Intro to Neural Networks"]
  },
  VLSI:{
    3:["Digital Logic Design","Electronic Devices and Circuits","Signals and Systems (Intro)",
       "Fundamentals of VLSI","Discrete Mathematics","Computational Methods"],
    4:["VLSI Design Basics","CMOS Technology","Microprocessors and Interfacing","Analog Circuits"]
  }
};

/* ── DOM REFS ───────────────────────────────────── */
const selCourse       = document.getElementById('selCourse');
const selBranch       = document.getElementById('selBranch');
const selSemester     = document.getElementById('selSemester');
const selSubject      = document.getElementById('selSubject');
const addSubjectBtn   = document.getElementById('addSubjectBtn');
const newSubjectInput = document.getElementById('newSubject');
const currentPath     = document.getElementById('currentPath');
const loginBtn        = document.getElementById('loginBtn');
const logoutBtn       = document.getElementById('logoutBtn');
const signedAs        = document.getElementById('signedAs');
const manageBtn       = document.getElementById('manageBtn');

/* ── STATUS HELPER ──────────────────────────────── */
function showMsg(id, text, isOk = true) {
  // Try the page-level helper first (admin.html exposes window.showMsg)
  if (typeof window.showMsg === 'function') {
    window.showMsg(id, text, isOk);
    return;
  }
  // Fallback: set text directly
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'status-msg ' + (isOk ? 'ok' : 'err');
  setTimeout(() => { el.textContent = ''; el.className = 'status-msg'; }, 4000);
}

/* ── POPULATE SELECTS ───────────────────────────── */
function populateCourses()   { selCourse.innerHTML   = COURSES.map(v  => `<option>${v}</option>`).join(''); }
function populateBranches()  { selBranch.innerHTML   = BRANCHES.map(v => `<option>${v}</option>`).join(''); }
function populateSemesters() { selSemester.innerHTML = [1,2,3,4].map(n => `<option value="${n}">Semester ${n}</option>`).join(''); }

function populateSubjects() {
  const branch = selBranch.value;
  const sem    = Number(selSemester.value);
  let arr = (sem === 1 || sem === 2) ? [...COMMON_SEM12] : (SUBJECTS_BY_BRANCH[branch]?.[sem] || []);

  selSubject.innerHTML = '';
  arr.forEach(s => {
    const op = document.createElement('option');
    op.value = op.textContent = s;
    selSubject.appendChild(op);
  });
  const other = document.createElement('option');
  other.value = '__other__'; other.textContent = '— Add / Choose other —';
  selSubject.appendChild(other);
  updatePath();
}

addSubjectBtn?.addEventListener('click', () => {
  const v = newSubjectInput.value.trim();
  if (!v) return alert('Enter a subject name');
  const op = document.createElement('option');
  op.value = op.textContent = v;
  const other = [...selSubject.options].find(o => o.value === '__other__');
  selSubject.insertBefore(op, other);
  selSubject.value = v;
  newSubjectInput.value = '';
  updatePath();
});

/* ── PATH LABEL ─────────────────────────────────── */
function updatePath() {
  const sub = selSubject.value === '__other__' ? '(choose subject)' : selSubject.value;
  currentPath.innerText = `${selCourse.value} · ${selBranch.value} · Semester ${selSemester.value} · ${sub}`;
}

selCourse.addEventListener('change', updatePath);
selBranch.addEventListener('change',   () => { populateSubjects(); });
selSemester.addEventListener('change', () => { populateSubjects(); });
selSubject.addEventListener('change', updatePath);

populateCourses();
populateBranches();
populateSemesters();
populateSubjects();

/* ── AUTH ───────────────────────────────────────── */
loginBtn.onclick = async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPass').value;
  if (!email || !pass) return alert('Enter email and password');
  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    alert('Login error: ' + e.message);
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
};

logoutBtn.onclick = async () => { await signOut(auth); };

onAuthStateChanged(auth, user => {
  if (user) {
    signedAs.innerText = user.email;
    loginBtn.style.display  = 'none';
    logoutBtn.style.display = 'inline-flex';
    if (user.uid === ADMIN_UID) {
      manageBtn.style.display = 'inline-flex';
      manageBtn.onclick = () => location.href = 'manage.html';
    }
  } else {
    signedAs.innerText = 'Not signed in';
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
    loginBtn.style.display  = 'inline-flex';
    logoutBtn.style.display = 'none';
    manageBtn.style.display = 'none';
  }
});

/* ── LINK HELPERS ───────────────────────────────── */
function normalizeDriveLink(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('drive.google.com')) {
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
      const id = u.searchParams.get('id');
      if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  } catch(_) {}
  return url;
}

function normalizeYouTube(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) return url;
  } catch(_) {}
  return url;
}

/* ── DOC ID ─────────────────────────────────────── */
function currentDocId() {
  const sub = selSubject.value === '__other__' ? '' : selSubject.value;
  return `${selCourse.value}__${selBranch.value}__Semester ${selSemester.value}__${sub}`;
}

function checkDoc(docId, msgId) {
  if (docId.endsWith('__')) { showMsg(msgId, 'Select all dropdowns first', false); return false; }
  return true;
}

/* ── SAVE: SYLLABUS ─────────────────────────────── */
document.getElementById('s_save')?.addEventListener('click', async () => {
  const docId = currentDocId();
  if (!checkDoc(docId, 's_msg')) return;
  const btn = document.getElementById('s_save');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    await setDoc(doc(db, 'syllabus', docId), {
      unit1: document.getElementById('s_u1').value || '',
      unit2: document.getElementById('s_u2').value || '',
      unit3: document.getElementById('s_u3').value || '',
      unit4: document.getElementById('s_u4').value || '',
      updatedBy: auth.currentUser?.email || '',
      updatedAt: serverTimestamp()
    });
    showMsg('s_msg', '✓ Syllabus saved', true);
  } catch(e) { showMsg('s_msg', 'Error: ' + e.message, false); }
  btn.textContent = 'Save Syllabus'; btn.disabled = false;
});

/* ── SAVE: NOTES ────────────────────────────────── */
document.getElementById('n_save')?.addEventListener('click', async () => {
  const title = document.getElementById('n_title').value.trim();
  if (!title) return showMsg('n_msg', 'Enter a title', false);
  const docId = currentDocId();
  if (!checkDoc(docId, 'n_msg')) return;
  const btn = document.getElementById('n_save');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    await addDoc(collection(db, 'notes', docId, 'items'), {
      title,
      description: document.getElementById('n_desc').value.trim(),
      driveLink:   normalizeDriveLink(document.getElementById('n_link').value.trim()),
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    showMsg('n_msg', '✓ Note saved', true);
    document.getElementById('n_title').value = '';
    document.getElementById('n_desc').value  = '';
    document.getElementById('n_link').value  = '';
  } catch(e) { showMsg('n_msg', 'Error: ' + e.message, false); }
  btn.textContent = 'Save Note'; btn.disabled = false;
});

/* ── SAVE: PYQ ──────────────────────────────────── */
document.getElementById('p_save')?.addEventListener('click', async () => {
  const title = document.getElementById('p_title').value.trim();
  if (!title) return showMsg('p_msg', 'Enter a title', false);
  const docId = currentDocId();
  if (!checkDoc(docId, 'p_msg')) return;
  const btn = document.getElementById('p_save');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    await addDoc(collection(db, 'pyq', docId, 'items'), {
      title,
      driveLink:   normalizeDriveLink(document.getElementById('p_link').value.trim()),
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    showMsg('p_msg', '✓ PYQ saved', true);
    document.getElementById('p_title').value = '';
    document.getElementById('p_link').value  = '';
  } catch(e) { showMsg('p_msg', 'Error: ' + e.message, false); }
  btn.textContent = 'Save PYQ'; btn.disabled = false;
});

/* ── SAVE: VIDEOS ───────────────────────────────── */
document.getElementById('v_save')?.addEventListener('click', async () => {
  const title = document.getElementById('v_title').value.trim();
  if (!title) return showMsg('v_msg', 'Enter a title', false);
  const docId = currentDocId();
  if (!checkDoc(docId, 'v_msg')) return;
  const btn = document.getElementById('v_save');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    await addDoc(collection(db, 'videos', docId, 'items'), {
      title,
      youtubeUrl: normalizeYouTube(document.getElementById('v_link').value.trim()),
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    showMsg('v_msg', '✓ Video saved', true);
    document.getElementById('v_title').value = '';
    document.getElementById('v_link').value  = '';
  } catch(e) { showMsg('v_msg', 'Error: ' + e.message, false); }
  btn.textContent = 'Save Video'; btn.disabled = false;
});

/* ── SAVE: PRACTICALS ───────────────────────────── */
document.getElementById('r_save')?.addEventListener('click', async () => {
  const title = document.getElementById('r_title').value.trim();
  if (!title) return showMsg('r_msg', 'Enter a title', false);
  const docId = currentDocId();
  if (!checkDoc(docId, 'r_msg')) return;
  const btn = document.getElementById('r_save');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    await addDoc(collection(db, 'practicals', docId, 'items'), {
      title,
      description: document.getElementById('r_desc').value.trim(),
      driveLink:   normalizeDriveLink(document.getElementById('r_link').value.trim()),
      uploaderName: auth.currentUser?.email || 'Admin',
      timestamp: serverTimestamp()
    });
    showMsg('r_msg', '✓ Practical saved', true);
    document.getElementById('r_title').value = '';
    document.getElementById('r_desc').value  = '';
    document.getElementById('r_link').value  = '';
  } catch(e) { showMsg('r_msg', 'Error: ' + e.message, false); }
  btn.textContent = 'Save Practical'; btn.disabled = false;
});

/* ── MANAGE HELPERS (used by manage.html) ───────── */
export async function listUploadsFor(docId, containerId = 'manageList') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const cols = ['notes','pyq','videos','practicals'];
  let count = 0;
  for (const col of cols) {
    const snap = await getDocs(query(collection(db, col, docId, 'items'), orderBy('timestamp','desc')));
    snap.forEach(d => {
      count++;
      const data = d.data();
      container.appendChild(renderLegacyCard(col.toUpperCase(), data.title, data.uploaderName, data.driveLink || data.youtubeUrl, () => deleteItem(col, docId, d.id)));
    });
  }
  if (!count) container.innerHTML = '<div class="card padded"><div class="empty-state"><div class="empty-icon">📭</div><p>No uploads found.</p></div></div>';
}

function renderLegacyCard(type, title, uploader, link, onDelete) {
  const wrap = document.createElement('div');
  wrap.className = 'item-card';
  wrap.innerHTML = `
    <div style="flex:1;min-width:0">
      <div class="item-type-badge">${type}</div>
      <div class="item-title">${title || '—'}</div>
      <div class="item-meta">${uploader || ''}</div>
    </div>
    <div class="item-actions"></div>`;
  const actions = wrap.querySelector('.item-actions');
  if (link) {
    const a = document.createElement('a');
    a.className = 'glow-btn secondary btn-sm';
    a.href = link; a.target = '_blank'; a.textContent = 'Open';
    actions.appendChild(a);
  }
  const del = document.createElement('button');
  del.className = 'glow-btn danger btn-sm';
  del.textContent = 'Delete';
  del.onclick = onDelete;
  actions.appendChild(del);
  return wrap;
}

async function deleteItem(col, docId, itemId) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  await deleteDoc(doc(db, col, docId, 'items', itemId));
  if (window.manageRefresh) window.manageRefresh();
}

window.adminHelpers = { listUploadsFor, deleteItem, normalizeDriveLink, currentDocId };
