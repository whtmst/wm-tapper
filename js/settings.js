/* =========================================================
   WM TAPPER
   Settings Manager
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import { storage } from "./storage.js";


/* =========================================================
   APPLICATION CONSTANTS
   ========================================================= */

const APP_NAME = "wm-tapper";

const SETTINGS_STORAGE_KEY =
    `${APP_NAME}:settings`;


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

export const DEFAULT_SETTINGS = {

    version: 1,

    language: "en",

    sessionTimeout: 3,

    historyLength: 12,

    tapKey: "Space"
};


/* =========================================================
   VALID SETTINGS
   ========================================================= */

const VALID_LANGUAGES = [
    "en",
    "ru",
    "az"
];


const VALID_SESSION_VALUES = [
    1.5,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5
];


const VALID_HISTORY_VALUES = [
    8,
    12,
    16,
    20,
    24
];


const ALLOWED_SPECIAL_KEYS = new Set([
    "Space",
    "Enter",
    "Tab",

    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",

    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",

    "Home",
    "End",

    "PageUp",
    "PageDown",

    "Insert",
    "Delete"
]);


/* =========================================================
   TAP KEY VALIDATION
   ========================================================= */

/**
 * Check whether a KeyboardEvent.code is allowed
 * as Tap Key.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isAllowedTapKey(key) {

    /* Letters */

    if (
        /^Key[A-Z]$/.test(key)
    ) {
        return true;
    }


    /* Numbers */

    if (
        /^Digit[0-9]$/.test(key)
    ) {
        return true;
    }


    /* Numpad numbers */

    if (
        /^Numpad[0-9]$/.test(key)
    ) {
        return true;
    }


    /* Numpad actions */

    const allowedNumpadKeys = new Set([
        "NumpadAdd",
        "NumpadSubtract",
        "NumpadMultiply",
        "NumpadDivide",
        "NumpadDecimal",
        "NumpadEnter"
    ]);


    if (
        allowedNumpadKeys.has(key)
    ) {
        return true;
    }


    /* Other supported keys */

    return ALLOWED_SPECIAL_KEYS.has(key);
}


/* =========================================================
   SETTINGS MANAGER
   ========================================================= */

export const settings = {

    data: null,


    /**
     * Load settings from persistent storage.
     */
    load() {

        const savedSettings =
            storage.get(
                SETTINGS_STORAGE_KEY
            );


        if (
            !savedSettings ||
            typeof savedSettings !== "object"
        ) {

            this.data = {
                ...DEFAULT_SETTINGS
            };

            this.save();

            return;
        }


        this.data = {
            ...DEFAULT_SETTINGS,
            ...savedSettings
        };


        this.sanitize();

        this.save();
    },


    /**
     * Validate and normalize settings.
     */
    sanitize() {

        /* ---------------------------------------------
           Language
           --------------------------------------------- */

        if (
            !VALID_LANGUAGES.includes(
                this.data.language
            )
        ) {

            this.data.language =
                DEFAULT_SETTINGS.language;
        }


        /* ---------------------------------------------
           Session timeout
           --------------------------------------------- */

        const sessionValue =
            Number(
                this.data.sessionTimeout
            );


        if (
            !VALID_SESSION_VALUES.includes(
                sessionValue
            )
        ) {

            this.data.sessionTimeout =
                DEFAULT_SETTINGS.sessionTimeout;

        } else {

            this.data.sessionTimeout =
                sessionValue;
        }


        /* ---------------------------------------------
           History length
           --------------------------------------------- */

        const historyValue =
            Number(
                this.data.historyLength
            );


        if (
            !VALID_HISTORY_VALUES.includes(
                historyValue
            )
        ) {

            this.data.historyLength =
                DEFAULT_SETTINGS.historyLength;

        } else {

            this.data.historyLength =
                historyValue;
        }


        /* ---------------------------------------------
           Tap Key
           --------------------------------------------- */

        if (
            typeof this.data.tapKey !== "string" ||
            !isAllowedTapKey(
                this.data.tapKey
            )
        ) {

            this.data.tapKey =
                DEFAULT_SETTINGS.tapKey;
        }


        /* ---------------------------------------------
           Version
           --------------------------------------------- */

        if (
            typeof this.data.version !== "number"
        ) {

            this.data.version =
                DEFAULT_SETTINGS.version;
        }
    },


    /**
     * Save all current settings.
     */
    save() {

        storage.set(
            SETTINGS_STORAGE_KEY,
            this.data
        );
    },


    /**
     * Read one setting.
     *
     * @param {string} key
     * @returns {any}
     */
    get(key) {

        if (!this.data) {
            this.load();
        }

        return this.data[key];
    },


    /**
     * Change one setting and save immediately.
     *
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {

        if (!this.data) {
            this.load();
        }

        this.data[key] = value;

        this.sanitize();

        this.save();
    },


    /**
     * Update several settings and save immediately.
     *
     * @param {Object} values
     */
    update(values) {

        if (!this.data) {
            this.load();
        }

        this.data = {
            ...this.data,
            ...values
        };

        this.sanitize();

        this.save();
    },


    /**
     * Reset settings to defaults.
     */
    reset() {

        this.data = {
            ...DEFAULT_SETTINGS
        };

        this.save();
    }
};
