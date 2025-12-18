// js/admin-common.js
// Unified Admin Logic — Dropdowns + Save Operations + Manage/Delete
import { auth, db, ADMIN_UID } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  doc, setDoc, collection, addDoc,
  serverTimestamp, query, getDocs,
  orderBy, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------------------------------------
   CONFIG
----------------------------------------*/
const COURSES = ["B.Tech"];
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
    3:["Digital Logic Design","Electronic Devices and Circuits","Signals and Systems (intro)",
       "Fundamentals of VLSI","Discrete Mathematics","Computational Methods"],
    4:["VLSI Design Basics","CMOS Technology","Microprocessors and Interfacing","Analog Circuits"]
  }
};

/* ---------------------------------------
   DOM ELEMENTS
----------------------------------------*/
const selCourse   = document.getElementById('selCourse');
const selBranch   = document.getElementById('selBranch');
const selSemester = document.getElementById('selSemester');
const selSubject  = document.getElementById('selSubject');

const addSubjectBtn   = document.getElementById('addSubjectBtn');
const newSubjectInput = document.getElementById('newSubject');
const currentPath     = document.getElementById('currentPath');

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const signedAs  = document.getElementById('signedAs');
const manageBtn = document.getElementById('manageBtn');

/* ---------------------------------------
   POPULATE SELECTS
----------------------------------------*/
function populateCourses(){
  selCourse.innerHTML = COURSES.map(v=>`<option value="${v}">${v}</option>`).join('');
}
function populateBranches(){
  selBranch.innerHTML = BRANCHES.map(v=>`<option value="${v}">${v}</option>`).join('');
}
function populateSemesters(){
  selSemester.innerHTML = [1,2,3,4].map(n=>`<option value="${n}">Semester ${n}</option>`).join('');
}

function populateSubjects(){
  const branch = selBranch.value;
  const sem = Number(selSemester.value);

  let arr = [];
  if(sem === 1 || sem === 2) arr = [...COMMON_SEM12];
  else arr = SUBJECTS_BY_BRANCH[branch]?.[sem] || [];

  selSubject.innerHTML = '';
  arr.forEach(s=>{
    const op = document.createElement("option");
    op.value = s;
    op.textContent = s;
    selSubject.appendChild(op);
  });

  const other = document.createElement("option");
  other.value = "__other__";
  other.textContent = "— Add / Choose other —";
  selSubject.appendChild(other);

  updatePath();
}

/* NEW SUBJECT BUTTON */
addSubjectBtn?.addEventListener("click",()=>{
  const v = newSubjectInput.value.trim();
  if(!v) return alert("Enter subject");
  const op = document.createElement("option");
  op.value = v;
  op.textContent = v;

  const other = [...selSubject.options].find(o=>o.value==="__other__");
  selSubject.insertBefore(op, other);
  selSubject.value = v;
  newSubjectInput.value = "";
  updatePath();
});

/* ---------------------------------------
   UPDATE PATH LABEL
----------------------------------------*/
function updatePath(){
  const c = selCourse.value;
  const b = selBranch.value;
  const s = selSubject.value === "__other__" ? "(choose subject)" : selSubject.value;

  currentPath.innerText = `${c} • ${b} • Semester ${selSemester.value} • ${s}`;
}

/* CHANGE EVENTS */
selCourse.addEventListener('change', updatePath);
selBranch.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSemester.addEventListener('change', ()=>{ populateSubjects(); updatePath(); });
selSubject.addEventListener('change', updatePath);

/* INITIAL */
populateCourses();
populateBranches();
populateSemesters();
populateSubjects();

/* ---------------------------------------
   AUTH
----------------------------------------*/
loginBtn.onclick = async ()=>{
  const email = document.getElementById('adminEmail').value;
  const pass  = document.getElementById('adminPass').value;

  if(!email || !pass) return alert("Enter email + password");

  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch(e){ alert("Login error: "+e.message); }
};

logoutBtn.onclick = async ()=>{ await signOut(auth); };

onAuthStateChanged(auth, user=>{
  if(user){
    signedAs.innerText = `${user.email}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    if(user.uid === ADMIN_UID){
      manageBtn.style.display = "inline-block";

      // ✔ FIXED PATH
      manageBtn.onclick = ()=> location.href = "manage.html";
    }
  } else {
    signedAs.innerText = "Not signed in";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    manageBtn.style.display = "none";
  }
});

/* ---------------------------------------
   LINK NORMALIZATION
----------------------------------------*/
function normalizeDriveLink(url){
  if(!url) return "";
  try{
    const u = new URL(url);
    if(u.hostname.includes("drive.google.com")){
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if(match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      const id = u.searchParams.get("id");
      if(id) return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }catch(e){}
  return url;
}

function normalizeYouTube(url){
  if(!url) return "";
  try{
    const u = new URL(url);
    if(u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) return url;
  }catch(e){}
  return url;
}

/* ---------------------------------------
   DOC ID BUILDER
----------------------------------------*/
function currentDocId(){
  const c = selCourse.value;
  const b = selBranch.value;
  const s = selSubject.value === "__other__" ? "" : selSubject.value;
  return `${c}__${b}__Semester ${selSemester.value}__${s}`;
}

/* ---------------------------------------
   SAVE HANDLERS
----------------------------------------*/
function checkDoc(docId,msgEl){
  if(docId.endsWith("__")){ msgEl.innerText = "Please select all dropdowns"; return false; }
  return true;
}

/* SYLLABUS */
document.getElementById("s_save")?.addEventListener("click",async()=>{
  const docId = currentDocId();
  const msg = document.getElementById("s_msg");
  if(!checkDoc(docId,msg)) return;

  await setDoc(doc(db,"syllabus",docId),{
    unit1: document.getElementById("s_u1").value || "",
    unit2: document.getElementById("s_u2").value || "",
    unit3: document.getElementById("s_u3").value || "",
    unit4: document.getElementById("s_u4").value || "",
    updatedBy: auth.currentUser?.email || "",
    updatedAt: serverTimestamp()
  });
  msg.innerText = "Saved";
});

/* NOTES */
document.getElementById("n_save")?.addEventListener("click",async()=>{
  const title = document.getElementById("n_title").value.trim();
  if(!title) return document.getElementById("n_msg").innerText="Enter title";

  const docId = currentDocId();
  const msg = document.getElementById("n_msg");
  if(!checkDoc(docId,msg)) return;

  await addDoc(collection(db,"notes",docId,"items"),{
    title,
    description: document.getElementById("n_desc").value.trim(),
    driveLink: normalizeDriveLink(document.getElementById("n_link").value.trim()),
    uploaderName: auth.currentUser?.email || "Admin",
    timestamp: serverTimestamp()
  });

  msg.innerText="Saved";
});

/* PYQ */
document.getElementById("p_save")?.addEventListener("click",async()=>{
  const title = document.getElementById("p_title").value.trim();
  if(!title) return document.getElementById("p_msg").innerText="Enter title";

  const docId = currentDocId();
  const msg = document.getElementById("p_msg");
  if(!checkDoc(docId,msg)) return;

  await addDoc(collection(db,"pyq",docId,"items"),{
    title,
    driveLink: normalizeDriveLink(document.getElementById("p_link").value.trim()),
    uploaderName: auth.currentUser?.email || "Admin",
    timestamp: serverTimestamp()
  });

  msg.innerText="Saved";
});

/* VIDEOS */
document.getElementById("v_save")?.addEventListener("click",async()=>{
  const title = document.getElementById("v_title").value.trim();
  if(!title) return document.getElementById("v_msg").innerText="Enter title";

  const docId = currentDocId();
  const msg = document.getElementById("v_msg");
  if(!checkDoc(docId,msg)) return;

  await addDoc(collection(db,"videos",docId,"items"),{
    title,
    youtubeUrl: normalizeYouTube(document.getElementById("v_link").value.trim()),
    uploaderName: auth.currentUser?.email || "Admin",
    timestamp: serverTimestamp()
  });

  msg.innerText="Saved";
});

/* PRACTICALS */
document.getElementById("r_save")?.addEventListener("click",async()=>{
  const title = document.getElementById("r_title").value.trim();
  if(!title) return document.getElementById("r_msg").innerText="Enter title";

  const docId = currentDocId();
  const msg = document.getElementById("r_msg");
  if(!checkDoc(docId,msg)) return;

  await addDoc(collection(db,"practicals",docId,"items"),{
    title,
    description: document.getElementById("r_desc").value.trim(),
    driveLink: normalizeDriveLink(document.getElementById("r_link").value.trim()),
    uploaderName: auth.currentUser?.email || "Admin",
    timestamp: serverTimestamp()
  });

  msg.innerText="Saved";
});

/* ---------------------------------------
   MANAGE PAGE HELPERS
----------------------------------------*/
export async function listUploadsFor(docId, containerId="manageList"){
  const container = document.getElementById(containerId);
  container.innerHTML="";

  const cols = ["notes","pyq","videos","practicals"];

  let count = 0;

  for(const col of cols){
    const q = query(collection(db,col,docId,"items"), orderBy("timestamp","desc"));
    const snap = await getDocs(q);

    snap.forEach(d=>{
      count++;
      const data = d.data();
      container.appendChild(renderCard(
        col.toUpperCase(),
        data.title,
        data.uploaderName,
        data.driveLink || data.youtubeUrl,
        ()=> deleteItem(col,docId,d.id)
      ));
    });
  }

  if(count===0){
    container.innerHTML = `<div class="card"><p class="card-desc">No uploads found.</p></div>`;
  }
}

function renderCard(type,title,uploader,link,onDelete){
  const wrap = document.createElement("div");
  wrap.className="card";

  wrap.innerHTML = `
    <div>
      <div class="card-title">${title}</div>
      <div class="card-desc">${uploader||""}</div>
    </div>
    <div class="card-footer"></div>
  `;

  const foot = wrap.querySelector(".card-footer");

  if(link){
    const a = document.createElement("a");
    a.className="glow-btn";
    a.href = link;
    a.target="_blank";
    a.textContent="Open";
    foot.appendChild(a);
  }

  const del = document.createElement("button");
  del.className="glow-btn";
  del.style.background="#ff6b6b";
  del.textContent="Delete";
  del.onclick = onDelete;
  foot.appendChild(del);

  return wrap;
}

async function deleteItem(col,docId,itemId){
  if(!confirm("Delete this item?")) return;
  await deleteDoc(doc(db,col,docId,"items",itemId));
  alert("Deleted");
  if(window.manageRefresh) window.manageRefresh();
}

/* expose globally */
window.adminHelpers = {
  listUploadsFor,
  deleteItem,
  normalizeDriveLink,
  currentDocId
};
