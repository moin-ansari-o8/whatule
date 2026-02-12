const qs = (selector) => document.querySelector(selector);
const state = {
  messages: [],
  draft: null,
  settings: {
    sendDelay: 10,
    provider: "openai",
  },
};

async function sendMessage(message) {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    console.warn("Running outside extension context; returning mock data.");
    return { messages: state.messages, settings: state.settings, text: "Sample draft" };
  }
  return chrome.runtime.sendMessage(message);
}

function formatTime(value) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function switchSection(target) {
  document.querySelectorAll(".nav__item").forEach((btn) => btn.classList.toggle("active", btn.dataset.section === target));
  document.querySelectorAll(".section").forEach((section) => section.classList.toggle("active", section.id === `section-${target}`));
}

function renderStats() {
  const queued = state.messages.filter((m) => m.status === "scheduled").length;
  const sent = state.messages.filter((m) => m.status === "sent").length;
  const drafts = state.draft ? 1 : 0;
  qs("#stat-queued").textContent = queued;
  qs("#stat-sent").textContent = sent;
  qs("#stat-ai").textContent = drafts;
}

function renderHomeQueue() {
  const list = qs("#home-queue");
  list.innerHTML = "";
  if (!state.messages.length) {
    const li = document.createElement("li");
    li.className = "list__item";
    li.textContent = "No messages scheduled yet.";
    list.appendChild(li);
    return;
  }
  state.messages
    .slice()
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 4)
    .forEach((msg) => {
      const li = document.createElement("li");
      li.className = "list__item";
      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${msg.contactName || msg.contactPhone || "Contact"}</strong>
            <p class="muted">${formatTime(msg.scheduledTime)}</p>
          </div>
          <span class="status status--${msg.status ?? "scheduled"}">${msg.status ?? "scheduled"}</span>
        </div>
        <p class="muted">${msg.message}</p>
      `;
      list.appendChild(li);
    });
}

function renderScheduleTable() {
  const body = qs("#schedule-table tbody");
  body.innerHTML = "";
  state.messages
    .slice()
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .forEach((msg) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${msg.contactName || msg.contactPhone || "Contact"}</td>
        <td>${msg.message}</td>
        <td>${formatTime(msg.scheduledTime)}</td>
        <td><span class="status status--${msg.status ?? "scheduled"}">${msg.status ?? "scheduled"}</span></td>
      `;
      body.appendChild(tr);
    });
}

async function hydrate() {
  const response = await sendMessage({ type: "GET_STATE" });
  state.messages = response?.messages ?? [];
  state.settings = response?.settings ?? state.settings;
  renderStats();
  renderHomeQueue();
  renderScheduleTable();
  if (state.settings) {
    qs("#setting-delay").value = state.settings.sendDelay ?? 10;
    qs("#setting-provider").value = state.settings.provider ?? "openai";
  }
}

async function generateDraft(event) {
  event.preventDefault();
  const form = qs("#ai-draft-form");
  const data = new FormData(form);
  qs("#ai-draft-status").textContent = "Generating…";
  const response = await sendMessage({
    type: "AI_GENERATE",
    payload: {
      prompt: data.get("prompt"),
      tone: data.get("tone"),
      length: data.get("length"),
    },
  });
  state.draft = response?.text ?? "";
  qs("#ai-draft-status").textContent = state.draft ? "Draft ready" : "Draft unavailable";
  if (state.draft) {
    qs("#ai-draft-preview").hidden = false;
    qs("#ai-draft-text").textContent = state.draft;
  }
  renderStats();
}

async function saveSettings() {
  const settings = {
    sendDelay: Number(qs("#setting-delay").value) || 0,
    provider: qs("#setting-provider").value,
  };
  state.settings = settings;
  await sendMessage({ type: "SAVE_SETTINGS", payload: settings });
  qs("#settings-status").textContent = "Saved";
  setTimeout(() => (qs("#settings-status").textContent = ""), 2000);
}

function wireNav() {
  document.querySelectorAll(".nav__item").forEach((btn) =>
    btn.addEventListener("click", () => switchSection(btn.dataset.section)),
  );
}

function wireActions() {
  qs("#ai-draft-form")?.addEventListener("submit", generateDraft);
  qs("#draft-use")?.addEventListener("click", () => {
    alert("Draft applied. Use the popup to schedule with this content.");
  });
  qs("#draft-dismiss")?.addEventListener("click", () => {
    state.draft = null;
    qs("#ai-draft-preview").hidden = true;
    renderStats();
  });
  qs("#refresh-home")?.addEventListener("click", hydrate);
  qs("#refresh-schedule")?.addEventListener("click", hydrate);
  qs("#save-settings")?.addEventListener("click", saveSettings);
  qs("#new-quick")?.addEventListener("click", () => switchSection("schedule"));
  qs("#new-ai")?.addEventListener("click", () => switchSection("ai"));
  qs("#sync-now")?.addEventListener("click", hydrate);
}

document.addEventListener("DOMContentLoaded", async () => {
  wireNav();
  wireActions();
  await hydrate();
});
