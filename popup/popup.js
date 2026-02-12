const qs = (selector) => document.querySelector(selector);

const state = {
  queue: [],
  draft: null,
};

async function sendMessage(message) {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    console.warn("Running outside extension context; returning mock data.");
    return { ok: true, data: [], message: "mock" };
  }
  return chrome.runtime.sendMessage(message);
}

function formatTime(value) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function renderQueue() {
  const list = qs("#queue");
  list.innerHTML = "";
  if (!state.queue.length) {
    const empty = document.createElement("li");
    empty.textContent = "Nothing scheduled yet. Plan your first message!";
    empty.className = "list__item";
    list.appendChild(empty);
    return;
  }

  state.queue
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 5)
    .forEach((item) => {
      const li = document.createElement("li");
      li.className = "list__item";
      li.innerHTML = `
        <header>
          <div>
            <strong>${item.contactName || item.contactPhone || "Unknown contact"}</strong>
            <div class="list__meta">${formatTime(item.scheduledTime)} · ${item.priority ?? "normal"}</div>
          </div>
          <span class="status status--${item.status ?? "scheduled"}">${item.status ?? "scheduled"}</span>
        </header>
        <p>${item.message}</p>
      `;
      list.appendChild(li);
    });
}

async function loadQueue() {
  const response = await sendMessage({ type: "GET_STATE" });
  state.queue = response?.messages ?? [];
  renderQueue();
}

async function handleSchedule(event, immediate = false) {
  event?.preventDefault();
  const form = qs("#schedule-form");
  const data = new FormData(form);
  const payload = {
    contact: data.get("contact"),
    message: data.get("message"),
    priority: data.get("priority"),
    scheduledTime: immediate ? new Date().toISOString() : data.get("time"),
    immediate,
  };

  if (!payload.contact || !payload.message || !payload.scheduledTime) {
    alert("Please fill in all required fields: contact, message, and schedule time.");
    return;
  }

  await sendMessage({ type: "SCHEDULE_MESSAGE", payload });
  form.reset();
  await loadQueue();
}

async function handleAiGenerate(event) {
  event.preventDefault();
  const form = qs("#ai-form");
  const data = new FormData(form);
  const aiStatus = qs("#ai-status");
  aiStatus.textContent = "Drafting with AI…";
  const response = await sendMessage({
    type: "AI_GENERATE",
    payload: {
      prompt: data.get("prompt"),
      tone: data.get("tone"),
      length: data.get("length"),
    },
  });
  state.draft = response?.text ?? "";
  aiStatus.textContent = response?.text ? "Draft ready" : "Unable to draft";
  if (state.draft) {
    qs("#ai-preview").hidden = false;
    qs("#ai-preview-text").textContent = state.draft;
  }
}

function wireEvents() {
  qs("#schedule-form")?.addEventListener("submit", (e) => handleSchedule(e, false));
  qs("#schedule-now")?.addEventListener("click", (e) => handleSchedule(e, true));
  qs("#ai-form")?.addEventListener("submit", handleAiGenerate);
  qs("#refresh")?.addEventListener("click", loadQueue);
  qs("#use-draft")?.addEventListener("click", () => {
    if (!state.draft) return;
    qs("#schedule-form textarea[name='message']").value = state.draft;
    qs("#ai-preview").hidden = true;
  });
  qs("#dismiss-draft")?.addEventListener("click", () => {
    state.draft = null;
    qs("#ai-preview").hidden = true;
  });
  qs("#open-dashboard")?.addEventListener("click", () => {
    if (chrome?.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("../dashboard/index.html", "_blank");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  wireEvents();
  await loadQueue();
});
