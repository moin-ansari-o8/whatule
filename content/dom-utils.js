(function () {
  function findChatInput() {
    // WhatsApp Web uses data-tab indexes for the composer; value may change over time.
    // This selector targets the main message input; review regularly for upstream DOM changes.
    return (
      document.querySelector("[data-tab='10'] div[contenteditable='true']") ||
      document.querySelector("[data-tab='6'] div[contenteditable='true']") ||
      document.querySelector("div[contenteditable='true'][role='textbox']")
    );
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
