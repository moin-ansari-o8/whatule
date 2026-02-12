(function () {
  function findChatInput() {
    // WhatsApp Web uses data-tab indexes for the composer; value may change over time.
    // This selector targets the main message input; update if WhatsApp updates DOM.
    return document.querySelector("[data-tab='10'] div[contenteditable='true']");
  }

  function setNativeValue(el, value) {
    const input = el;
    const lastValue = input.textContent;
    input.textContent = value;
    const event = new InputEvent("input", { bubbles: true, inputType: "insertText", data: value });
    input.dispatchEvent(event);
    if (lastValue !== value) {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  window.WhatuleDom = { findChatInput, setNativeValue };
})();
