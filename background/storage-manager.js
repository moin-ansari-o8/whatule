const DEFAULT_STATE = {
  messages: [],
  templates: [],
  contacts: [],
  settings: {
    sendDelay: 10,
    provider: "openai",
  },
};

function normalizeState(state) {
  return {
    ...DEFAULT_STATE,
    ...state,
    messages: Array.isArray(state?.messages) ? state.messages : [],
    templates: Array.isArray(state?.templates) ? state.templates : [],
    contacts: Array.isArray(state?.contacts) ? state.contacts : [],
    settings: { ...DEFAULT_STATE.settings, ...(state?.settings || {}) },
  };
}

export class StorageManager {
  async getState() {
    const stored = await chrome.storage.local.get("whatule_state");
    return normalizeState(stored.whatule_state || DEFAULT_STATE);
  }

  async setState(next) {
    const state = normalizeState(next);
    await chrome.storage.local.set({ whatule_state: state });
    return state;
  }

  async upsertMessage(message) {
    const state = await this.getState();
    const idx = state.messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      state.messages[idx] = { ...state.messages[idx], ...message };
    } else {
      state.messages.push(message);
    }
    await this.setState(state);
    return message;
  }
}

export const storageManager = new StorageManager();
