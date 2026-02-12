import { storageManager } from "./storage-manager.js";
import { uid } from "../lib/utils.js";

const ALARM_PREFIX = "whatule-";

function buildMessage(payload) {
  const now = new Date();
  const time = payload.immediate ? now : new Date(payload.scheduledTime || now);
  const id = payload.id || uid("msg");
  // Basic heuristic for phone-like input; replace with robust parser for production.
  const isLikelyPhone = typeof payload.contact === "string" && /^\+\d[\d\s()-]{6,}$/.test(payload.contact);
  const [contactPhone, contactName] = isLikelyPhone ? [payload.contact, null] : [null, payload.contact];

  return {
    id,
    contactPhone,
    contactName,
    message: payload.message,
    priority: payload.priority || "normal",
    scheduledTime: time.toISOString(),
    createdAt: now.toISOString(),
    status: payload.immediate ? "sending" : "scheduled",
    metadata: payload.metadata || {},
    delivery: {},
  };
}

async function getWhatsAppTab() {
  const tabs = await chrome.tabs.query({ url: "*://web.whatsapp.com/*" });
  return tabs[0];
}

async function dispatchToContent(message) {
  const tab = await getWhatsAppTab();
  if (!tab) return { ok: false, reason: "No WhatsApp tab open" };
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "SEND_WHATSAPP_MESSAGE",
      payload: message,
    });
    return response || { ok: true };
  } catch (err) {
    console.warn("Dispatch failed", err);
    return { ok: false, reason: "Content script unavailable" };
  }
}

export class Scheduler {
  async schedule(payload) {
    const msg = buildMessage(payload);
    await storageManager.upsertMessage(msg);

    if (payload.immediate) {
      await this.processSend(msg.id);
      return msg;
    }

    const when = new Date(msg.scheduledTime).getTime();
    chrome.alarms.create(`${ALARM_PREFIX}${msg.id}`, { when });
    return msg;
  }

  async handleAlarm(alarm) {
    if (!alarm?.name?.startsWith(ALARM_PREFIX)) return;
    const id = alarm.name.replace(ALARM_PREFIX, "");
    await this.processSend(id);
  }

  async processSend(id) {
    const state = await storageManager.getState();
    const message = state.messages.find((m) => m.id === id);
    if (!message) return;

    await storageManager.upsertMessage({ ...message, status: "sending" });
    const delayMs = Math.max(0, (state.settings?.sendDelay ?? 0) * 1000);
    if (delayMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    const result = await dispatchToContent(message);
    const success = result?.ok !== false;
    const status = success ? "sent" : "failed";
    const delivery = {
      sentAt: new Date().toISOString(),
      error: success ? null : result?.reason || "Send failed",
    };
    await storageManager.upsertMessage({ ...message, status, delivery });
  }

  async cancel(id) {
    chrome.alarms.clear(`${ALARM_PREFIX}${id}`);
    const state = await storageManager.getState();
    await storageManager.setState({
      ...state,
      messages: state.messages.filter((m) => m.id !== id),
    });
  }
}

export const scheduler = new Scheduler();
