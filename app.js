const STORAGE_KEY = "songahmQuestGithubV1";

const BELT_COLORS = {
  White: "#f8fafc",
  Orange: "#f97316",
  Yellow: "#facc15",
  Camouflage: "#6b7d3c",
  Green: "#22c55e",
  Purple: "#8b5cf6",
  Blue: "#3b82f6",
  Brown: "#8b5a2b",
  Red: "#ef4444",
  Black: "#111827"
};

const RANKS = Object.keys(BELT_COLORS);

const TABS = [
  { key: "Profile", icon: "👤" },
  { key: "Rank", icon: "🥋" },
  { key: "Forms", icon: "🥷" },
  { key: "Skills", icon: "👊" },
  { key: "Events", icon: "📅" },
  { key: "Local Events", icon: "📍" },
  { key: "MVPs", icon: "🏆" },
  { key: "Class History", icon: "📊" }
];

let state = loadState();
let activeTab = "Profile";
let editingProfile = false;
let draftProfile = { ...state.profile };

function defaultState() {
  return {
    profile: {
      firstName: "",
      lastName: "",
      ataNumber: "",
      dojang: "",
      rank: "White",
      xp: 0,
      level: 1,
      points: 0,
      streak: 0
    },
    classCheckIns: [],
    content: {
      rank: [],
      forms: [],
      skills: [],
      events: [],
      localEvents: [],
      mvps: []
    },
    unlocked: {
      rank: [],
      forms: [],
      skills: [],
      events: [],
      localEvents: [],
      mvps: []
    }
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : defaultState();

    return {
      ...defaultState(),
      ...parsed,
      profile: {
        ...defaultState().profile,
        ...(parsed.profile || {})
      },
      classCheckIns: parsed.classCheckIns || []
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hasCheckedInToday() {
  return state.classCheckIns.some((checkIn) => checkIn.date === todayKey());
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function render() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <main class="app">
      <section class="phone">
        ${renderTopBar()}
        <img class="logo" src="images/logo.png" alt="Songahm Quest" />
        ${editingProfile ? renderEditProfile() : renderProfileHero()}
        ${renderDailyQuest()}
        ${renderTabs()}
        <section class="main-content">
          ${renderTabContent()}
        </section>
        ${renderBottomNav()}
      </section>
    </main>
  `;
}

function renderTopBar() {
  return `
    <header class="top-bar">
      <button class="icon-button" type="button">☰</button>
      <button class="icon-button notification" type="button">🔔</button>
    </header>
  `;
}

function renderProfileHero() {
  const profile = state.profile;
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "Create Profile";
  const beltColor = BELT_COLORS[profile.rank] || BELT_COLORS.White;

  return `
    <section class="profile">
      <div class="avatar-wrap" style="--belt-color:${beltColor}">
        <div class="avatar">🥋</div>
        <button class="camera" type="button">📷</button>
      </div>

      <h1 class="name">${escapeHtml(fullName)}</h1>

      <div class="belt-pill">
        <span>🎗️</span>
        ${escapeHtml(profile.rank)} Belt
      </div>

      <p class="student-details">
        ATA # ${escapeHtml(profile.ataNumber || "Not Set")}
        &nbsp;•&nbsp;
        ${escapeHtml(profile.dojang || "No Dojang Selected")}
      </p>

      <button class="edit-profile" type="button" onclick="startEditProfile()">Edit Profile</button>
    </section>
  `;
}

function renderEditProfile() {
  const profile = draftProfile;
  const beltColor = BELT_COLORS[profile.rank] || BELT_COLORS.White;

  return `
    <section class="edit-panel">
      <h2>Create Profile</h2>

      <div class="avatar-wrap" style="--belt-color:${beltColor}; width:110px; height:110px; margin-bottom:14px;">
        <div class="avatar" style="font-size:48px;">🥋</div>
      </div>

      <label>
        First Name
        <input id="firstName" value="${escapeHtml(profile.firstName)}" />
      </label>

      <label>
        Last Name
        <input id="lastName" value="${escapeHtml(profile.lastName)}" />
      </label>

      <label>
        ATA #
        <input id="ataNumber" value="${escapeHtml(profile.ataNumber)}" />
      </label>

      <label>
        Dojang
        <input id="dojang" value="${escapeHtml(profile.dojang)}" />
      </label>

      <label>
        Current Rank
        <select id="rank">
          ${RANKS.map((rank) => `
            <option ${profile.rank === rank ? "selected" : ""}>${rank}</option>
          `).join("")}
        </select>
      </label>

      <button class="save-button" type="button" onclick="saveProfile()">Save Profile</button>
    </section>
  `;
}

function renderDailyQuest() {
  const checkedIn = hasCheckedInToday();

  return `
    <section class="quest-card ${checkedIn ? "checked" : ""}">
      <div class="quest-icon">🎯</div>

      <div>
        <div class="quest-label-row">
          <div class="quest-label">Daily Quest</div>
          <div class="streak">🔥 ${state.profile.streak} Day Streak</div>
        </div>

        <h2 class="quest-title">${checkedIn ? "Class checked in" : "Check in to class"}</h2>

        <p class="quest-description">
          ${checkedIn
            ? "You already earned today's class credit."
            : "Attend a class and check in to earn your daily credit!"}
        </p>
      </div>

      <button class="checkin-button" type="button" ${checkedIn ? "disabled" : ""} onclick="checkInForClass()">
        📍 ${checkedIn ? "DONE" : "CHECK IN"}
      </button>
    </section>
  `;
}

function renderTabs() {
  return `
    <nav class="tabs">
      ${TABS.map((tab) => `
        <button
          class="tab ${activeTab === tab.key ? "active" : ""}"
          type="button"
          onclick="setTab('${tab.key}')"
        >
          <span class="tab-icon">${tab.icon}</span>
          <span class="tab-label">${tab.key}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderTabContent() {
  if (activeTab === "Profile") return renderProfileTab();
  if (activeTab === "Class History") return renderClassHistoryTab();
  return renderEmptyTab(activeTab);
}

function renderProfileTab() {
  return `
    <section class="profile-grid">
      <div class="panel">
        <div class="panel-title-row">
          <h2>About Me</h2>
          <button class="edit-small" type="button" onclick="startEditProfile()">✎</button>
        </div>

        <p>This is your space! Tell everyone about your martial arts journey.</p>

        <div class="about-lines">
          <p>Favorite Form:</p>
          <p>Favorite Move:</p>
          <p>Goals:</p>
        </div>
      </div>

      <div class="panel">
        <h2>Achievements</h2>

        <div class="trophy">
          <div>
            <div class="trophy-icon">🏆</div>
            <p>Your achievements will appear here.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderClassHistoryTab() {
  if (state.classCheckIns.length === 0) {
    return `
      <section class="panel">
        <h2>Class History</h2>
        <div class="empty">
          <div>
            <strong>No class check-ins yet.</strong>
            <p>Use the daily check-in button when you attend class.</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel">
      <h2>Class History</h2>

      <div class="history-list">
        ${state.classCheckIns.map((checkIn) => `
          <div class="history-item">
            <div>
              <strong>Class Check-In</strong>
              <p>${escapeHtml(checkIn.dojang)}</p>
            </div>
            <span>${formatDateTime(checkIn.createdAt)}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderEmptyTab(tabName) {
  return `
    <section class="panel">
      <h2>${escapeHtml(tabName)}</h2>

      <div class="empty">
        <div>
          <strong>No ${escapeHtml(tabName.toLowerCase())} added yet.</strong>
          <p>This tab is ready for the real content we add next.</p>
        </div>
      </div>
    </section>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      <button class="active" type="button">🏠<span>Home</span></button>
      <button type="button">🎁<span>Rewards</span></button>
      <button type="button">⛩️<span>Dojang</span></button>
      <button type="button">💬<span>Messages</span></button>
      <button type="button">•••<span>More</span></button>
    </nav>
  `;
}

function startEditProfile() {
  draftProfile = { ...state.profile };
  editingProfile = true;
  render();
}

function saveProfile() {
  state.profile.firstName = document.getElementById("firstName").value;
  state.profile.lastName = document.getElementById("lastName").value;
  state.profile.ataNumber = document.getElementById("ataNumber").value;
  state.profile.dojang = document.getElementById("dojang").value;
  state.profile.rank = document.getElementById("rank").value;

  editingProfile = false;
  saveState();
  render();
}

function checkInForClass() {
  if (hasCheckedInToday()) return;

  const nextXp = state.profile.xp + 25;

  state.profile.xp = nextXp;
  state.profile.points += 1;
  state.profile.level = Math.floor(nextXp / 100) + 1;
  state.profile.streak += 1;

  state.classCheckIns.unshift({
    id: crypto.randomUUID(),
    type: "class",
    date: todayKey(),
    createdAt: new Date().toISOString(),
    dojang: state.profile.dojang || "Current Dojang"
  });

  saveState();
  render();
}

function setTab(tabName) {
  activeTab = tabName;
  render();
}

render();
