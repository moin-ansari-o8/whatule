import { scheduler } from "./scheduler.js";
import { storageManager } from "./storage-manager.js";
import { generateDraft } from "./ai-manager.js";

chrome.runtime.onInstalled.addListener(async () => {
  await storageManager.setState(await storageManager.getState());
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  await scheduler.handleAlarm(alarm);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = async () => {
    switch (message.type) {
      case "GET_STATE": {
        const state = await storageManager.getState();
        sendResponse(state);
        break;
      }
      case "SCHEDULE_MESSAGE": {
        const result = await scheduler.schedule(message.payload || {});
        const state = await storageManager.getState();
        sendResponse({ ok: true, message: result, messages: state.messages });
        break;
      }
      case "AI_GENERATE": {
        const text = await generateDraft(message.payload || {});
        sendResponse({ ok: true, text });
        break;
      }
      case "SAVE_SETTINGS": {
        const state = await storageManager.getState();
        const next = { ...state, settings: { ...state.settings, ...(message.payload || {}) } };
        await storageManager.setState(next);
        sendResponse({ ok: true });
        break;
      }
      case "CANCEL_MESSAGE": {
        await scheduler.cancel(message.payload?.id);
        const state = await storageManager.getState();
        sendResponse({ ok: true, messages: state.messages });
        break;
      }
      default:
        sendResponse({ ok: false, reason: "Unknown message" });
    }
  };

  handler();
  return true;
});
