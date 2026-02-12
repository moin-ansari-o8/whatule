(function () {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const handler = async () => {
      if (message.type === "SEND_WHATSAPP_MESSAGE") {
        const result = await window.WhatuleSender?.sendMessage(message.payload || {});
        sendResponse(result || { ok: false, reason: "Sender unavailable" });
      }
    };
    handler();
    return true;
  });
})();
