(function () {
  async function sendMessage({ message }) {
    const input = window.WhatuleDom?.findChatInput();
    if (!input) {
      console.warn("WhatuLe: chat input not found");
      return { ok: false, reason: "Chat input not available" };
    }
    window.WhatuleDom.setNativeValue(input, message);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    return { ok: true };
  }

  window.WhatuleSender = { sendMessage };
})();
