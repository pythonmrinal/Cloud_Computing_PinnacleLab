import { firebaseConfig } from "./firebase-config.js";

const STORAGE_KEY = "cloudAttendanceSystem";
const cloudEnabled = firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

const state = {
  members: [],
  attendance: {},
  selectedDate: getToday(),
  db: null
};

const els = {
  cloudStatus: document.querySelector("#cloudStatus"),
  memberForm: document.querySelector("#memberForm"),
  memberName: document.querySelector("#memberName"),
  memberGroup: document.querySelector("#memberGroup"),
  memberList: document.querySelector("#memberList"),
  memberCount: document.querySelector("#memberCount"),
  attendanceDate: document.querySelector("#attendanceDate"),
  attendanceBody: document.querySelector("#attendanceBody"),
  saveAttendance: document.querySelector("#saveAttendance"),
  exportCsv: document.querySelector("#exportCsv"),
  totalCount: document.querySelector("#totalCount"),
  presentCount: document.querySelector("#presentCount"),
  absentCount: document.querySelector("#absentCount"),
  lateCount: document.querySelector("#lateCount"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

async function boot() {
  els.attendanceDate.value = state.selectedDate;

  if (cloudEnabled) {
    await connectFirebase();
  } else {
    els.cloudStatus.textContent = "Local demo mode";
    loadLocal();
  }

  bindEvents();
  render();
}

async function connectFirebase() {
  try {
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

    const app = appModule.initializeApp(firebaseConfig);
    state.db = firestoreModule.getFirestore(app);
    state.firestore = firestoreModule;

    await loadCloud();
    els.cloudStatus.textContent = "Connected to Firebase Firestore";
  } catch (error) {
    console.error(error);
    els.cloudStatus.textContent = "Cloud unavailable, using local mode";
    loadLocal();
  }
}

function bindEvents() {
  els.memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = els.memberName.value.trim();
    const group = els.memberGroup.value.trim();

    if (!name || !group) return;

    state.members.push({
      id: crypto.randomUUID(),
      name,
      group,
      createdAt: new Date().toISOString()
    });

    els.memberForm.reset();
    await persist();
    render();
  });

  els.attendanceDate.addEventListener("change", () => {
    state.selectedDate = els.attendanceDate.value;
    render();
  });

  els.saveAttendance.addEventListener("click", async () => {
    await persist();
    els.saveAttendance.textContent = "Saved";
    window.setTimeout(() => {
      els.saveAttendance.textContent = "Save Attendance";
    }, 1200);
  });

  els.exportCsv.addEventListener("click", exportCsv);
}

function render() {
  renderMembers();
  renderAttendance();
  renderSummary();
}

function renderMembers() {
  els.memberList.innerHTML = "";
  els.memberCount.textContent = `${state.members.length} member${state.members.length === 1 ? "" : "s"}`;

  if (state.members.length === 0) {
    els.memberList.append(els.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.members.forEach((member) => {
    const card = document.createElement("article");
    card.className = "member-card";
    card.innerHTML = `
      <div>
        <strong></strong>
        <span></span>
      </div>
      <button class="delete-button" type="button" aria-label="Delete member">x</button>
    `;

    card.querySelector("strong").textContent = member.name;
    card.querySelector("span").textContent = member.group;
    card.querySelector("button").addEventListener("click", async () => {
      removeMember(member.id);
      await persist();
      render();
    });

    els.memberList.append(card);
  });
}

function renderAttendance() {
  els.attendanceBody.innerHTML = "";

  if (state.members.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4">Add members to begin attendance tracking.</td>`;
    els.attendanceBody.append(row);
    return;
  }

  const dayRecord = getDayRecord();

  state.members.forEach((member) => {
    if (!dayRecord[member.id]) {
      dayRecord[member.id] = "present";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td></td>
      <td></td>
      <td>
        <select class="status-select" aria-label="Attendance status">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
        </select>
      </td>
      <td></td>
    `;

    const select = row.querySelector("select");
    select.value = dayRecord[member.id];
    select.classList.add(select.value);
    select.addEventListener("change", async () => {
      select.className = `status-select ${select.value}`;
      dayRecord[member.id] = select.value;
      await persist();
      renderSummary();
    });

    row.children[0].textContent = member.name;
    row.children[1].textContent = member.group;
    row.children[3].textContent = `${calculateAttendancePercentage(member.id)}%`;

    els.attendanceBody.append(row);
  });
}

function renderSummary() {
  const dayRecord = getDayRecord();
  const total = state.members.length;
  const present = countStatus(dayRecord, "present");
  const absent = countStatus(dayRecord, "absent");
  const late = countStatus(dayRecord, "late");

  els.totalCount.textContent = total;
  els.presentCount.textContent = present;
  els.absentCount.textContent = absent;
  els.lateCount.textContent = late;
}

function getDayRecord() {
  if (!state.attendance[state.selectedDate]) {
    state.attendance[state.selectedDate] = {};
  }

  return state.attendance[state.selectedDate];
}

function countStatus(dayRecord, status) {
  return state.members.filter((member) => dayRecord[member.id] === status).length;
}

function calculateAttendancePercentage(memberId) {
  const dates = Object.keys(state.attendance);
  if (dates.length === 0) return 100;

  const markedDates = dates.filter((date) => state.attendance[date][memberId]);
  if (markedDates.length === 0) return 100;

  const positiveDays = markedDates.filter((date) => {
    const status = state.attendance[date][memberId];
    return status === "present" || status === "late";
  }).length;

  return Math.round((positiveDays / markedDates.length) * 100);
}

function removeMember(memberId) {
  state.members = state.members.filter((member) => member.id !== memberId);

  Object.keys(state.attendance).forEach((date) => {
    delete state.attendance[date][memberId];
  });
}

async function persist() {
  if (cloudEnabled && state.db) {
    await saveCloud();
    return;
  }

  saveLocal();
}

function saveLocal() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      members: state.members,
      attendance: state.attendance
    })
  );
}

function loadLocal() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  state.members = Array.isArray(saved.members) ? saved.members : [];
  state.attendance = saved.attendance || {};
}

async function loadCloud() {
  const { doc, getDoc } = state.firestore;
  const ref = doc(state.db, "attendanceApp", "main");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const data = snapshot.data();
  state.members = Array.isArray(data.members) ? data.members : [];
  state.attendance = data.attendance || {};
}

async function saveCloud() {
  const { doc, setDoc } = state.firestore;
  const ref = doc(state.db, "attendanceApp", "main");

  await setDoc(ref, {
    members: state.members,
    attendance: state.attendance,
    updatedAt: new Date().toISOString()
  });
}

function exportCsv() {
  const rows = [["Date", "Name", "Group", "Status"]];

  Object.entries(state.attendance).forEach(([date, records]) => {
    state.members.forEach((member) => {
      rows.push([
        date,
        member.name,
        member.group,
        records[member.id] || "not marked"
      ]);
    });
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${state.selectedDate}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

boot();
