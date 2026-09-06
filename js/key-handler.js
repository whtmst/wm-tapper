/* =========================================================
   WM TAPPER
   Tap Key Handler
   ========================================================= */

/* =========================================================
   IMPORTS
   ========================================================= */

import { settings, isAllowedTapKey } from "./settings.js";

import { getTranslations } from "./i18n.js";

/* =========================================================
   KEY DISPLAY NAME
   ========================================================= */

/**
 * Convert KeyboardEvent.code to a readable label.
 *
 * @param {string} code
 * @returns {string}
 */
export function getKeyDisplayName(code) {
    /* Letters */

    if (/^Key[A-Z]$/.test(code)) {
        return code.replace("Key", "");
    }

    /* Numbers */

    if (/^Digit[0-9]$/.test(code)) {
        return code.replace("Digit", "");
    }

    /* Numpad numbers */

    if (/^Numpad[0-9]$/.test(code)) {
        return `NUM ${code.replace("Numpad", "")}`;
    }

    const specialNames = {
        Space: "SPACE",

        Enter: "ENTER",

        Tab: "TAB",

        F1: "F1",
        F2: "F2",
        F3: "F3",
        F4: "F4",
        F5: "F5",
        F6: "F6",
        F7: "F7",
        F8: "F8",
        F9: "F9",
        F10: "F10",
        F11: "F11",
        F12: "F12",

        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",

        Home: "HOME",
        End: "END",

        PageUp: "PAGE UP",
        PageDown: "PAGE DOWN",

        Insert: "INSERT",
        Delete: "DELETE",

        NumpadAdd: "NUM +",
        NumpadSubtract: "NUM −",
        NumpadMultiply: "NUM ×",
        NumpadDivide: "NUM ÷",
        NumpadDecimal: "NUM .",
        NumpadEnter: "NUM ENTER",
    };

    return specialNames[code] || code.toUpperCase();
}

/* =========================================================
   TAP KEY CONTROLLER
   ========================================================= */

export class TapKeyController {
    /**
     * @param {Object} elements
     * @param {HTMLElement} elements.control
     * @param {HTMLElement} elements.value
     */
    constructor(elements) {
        this.control = elements.control;

        this.value = elements.value;

        this.isCapturing = false;

        this.previousKey = settings.get("tapKey");

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Get current language.
     *
     * @returns {string}
     */
    getLanguage() {
        return settings.get("language");
    }

    /**
     * Update displayed key.
     */
    updateDisplay() {
        if (this.isCapturing) {
            return;
        }

        const key = settings.get("tapKey");

        this.value.textContent = getKeyDisplayName(key);
    }

    /**
     * Start capture mode.
     */
    startCapture() {
        if (this.isCapturing) {
            return;
        }

        this.previousKey = settings.get("tapKey");

        this.isCapturing = true;

        this.control.classList.add("is-listening");

        const text = getTranslations(this.getLanguage());

        this.value.textContent = text.pressKey;

        document.addEventListener("keydown", this.handleKeyDown, true);
    }

    /**
     * Stop capture mode.
     */
    stopCapture() {
        this.isCapturing = false;

        this.control.classList.remove("is-listening");

        document.removeEventListener("keydown", this.handleKeyDown, true);

        this.updateDisplay();
    }

    /**
     * Handle captured key.
     *
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        /* -----------------------------------------
           Escape = cancel
           ----------------------------------------- */

        if (event.code === "Escape") {
            event.preventDefault();
            event.stopPropagation();

            settings.set("tapKey", this.previousKey);

            this.stopCapture();

            return;
        }

        /* -----------------------------------------
           Reject modifier combinations
           ----------------------------------------- */

        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
        }

        /* -----------------------------------------
           Check key
           ----------------------------------------- */

        if (!isAllowedTapKey(event.code)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        /* -----------------------------------------
           Save immediately
           ----------------------------------------- */

        settings.set("tapKey", event.code);

        this.stopCapture();
    }

    /**
     * Initialize the controller.
     */
    initialize() {
        this.control.addEventListener("click", () => {
            this.startCapture();
        });

        this.updateDisplay();
    }
}
