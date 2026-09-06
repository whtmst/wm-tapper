/* =========================================================
   WM TAPPER
   Main application script

   Architecture:

   UI
    ↓
   Settings Manager
    ↓
   Storage Adapter
    ↓
   localStorage

   Later in Tauri:

   UI
    ↓
   Settings Manager
    ↓
   Storage Adapter
    ↓
   Tauri Store / JSON
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const settingsButton = document.getElementById("settingsButton");
const flipCard = document.getElementById("flipCard");

const tapButton = document.getElementById("tapButton");
const tapValue = document.getElementById("tapValue");

const resetButton = document.getElementById("resetButton");

const averageValue = document.getElementById("averageValue");
const tapHistory = document.getElementById("tapHistory");

const tapKeyControl = document.getElementById("tapKeyControl");
const tapKeyValue = document.getElementById("tapKeyValue");

const sessionControl = document.getElementById("sessionControl");
const sessionValue = document.getElementById("sessionValue");
const sessionMenu = document.getElementById("sessionMenu");

const historyControl = document.getElementById("historyControl");
const historyValue = document.getElementById("historyValue");
const historyMenu = document.getElementById("historyMenu");

const languageSwitcher = document.getElementById("languageSwitcher");
const madeByText = document.getElementById("madeByText");


/* =========================================================
   APPLICATION CONSTANTS
   ========================================================= */

const APP_NAME = "wm-tapper";

const SETTINGS_STORAGE_KEY = `${APP_NAME}:settings`;


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
    version: 1,

    language: "en",

    sessionTimeout: 3,

    historyLength: 12,

    tapKey: "Space"
};


/* =========================================================
   ALLOWED TAP KEYS
   ========================================================= */

/*
 * We intentionally accept only single keys.
 *
 * Modifier combinations such as:
 *
 * Ctrl + T
 * Alt + Space
 * Shift + T
 *
 * are not supported.
 *
 * Escape is reserved for cancelling key selection.
 */

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
   STORAGE ADAPTER
   ========================================================= */

const storage = {

    /**
     * Read a value from persistent storage.
     *
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {

        try {

            const rawValue =
                localStorage.getItem(key);

            if (rawValue === null) {
                return null;
            }

            return JSON.parse(rawValue);

        } catch (error) {

            console.error(
                "WM Tapper: failed to read storage.",
                error
            );

            return null;
        }
    },


    /**
     * Write a value to persistent storage.
     *
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

        } catch (error) {

            console.error(
                "WM Tapper: failed to write storage.",
                error
            );
        }
    },


    /**
     * Remove a value from persistent storage.
     *
     * @param {string} key
     */
    remove(key) {

        try {

            localStorage.removeItem(key);

        } catch (error) {

            console.error(
                "WM Tapper: failed to remove storage.",
                error
            );
        }
    }
};


/* =========================================================
   SETTINGS MANAGER
   ========================================================= */

const settings = {

    data: null,


    /**
     * Load settings from storage.
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


        /*
         * Sanitize values loaded from storage.
         *
         * This protects the application from invalid
         * or manually modified localStorage data.
         */

        this.sanitize();

        this.save();
    },


    /**
     * Validate and normalize stored settings.
     */
    sanitize() {

        /* Language */

        if (
            !supportedLanguages.includes(
                this.data.language
            )
        ) {
            this.data.language =
                DEFAULT_SETTINGS.language;
        }


        /* Session timeout */

        const validSessionValues = [
            1.5,
            2,
            2.5,
            3,
            3.5,
            4,
            4.5,
            5
        ];

        const sessionValue =
            Number(
                this.data.sessionTimeout
            );


        if (
            !validSessionValues.includes(
                sessionValue
            )
        ) {
            this.data.sessionTimeout =
                DEFAULT_SETTINGS.sessionTimeout;
        } else {
            this.data.sessionTimeout =
                sessionValue;
        }


        /* History length */

        const validHistoryValues = [
            8,
            12,
            16,
            20,
            24
        ];

        const historyValue =
            Number(
                this.data.historyLength
            );


        if (
            !validHistoryValues.includes(
                historyValue
            )
        ) {
            this.data.historyLength =
                DEFAULT_SETTINGS.historyLength;
        } else {
            this.data.historyLength =
                historyValue;
        }


        /* Tap key */

        if (
            typeof this.data.tapKey !== "string" ||
            !isAllowedTapKey(
                this.data.tapKey
            )
        ) {
            this.data.tapKey =
                DEFAULT_SETTINGS.tapKey;
        }


        /* Version */

        if (
            typeof this.data.version !== "number"
        ) {
            this.data.version =
                DEFAULT_SETTINGS.version;
        }
    },


    /**
     * Save settings.
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
     * Update multiple settings and save immediately.
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


/* =========================================================
   TRANSLATIONS
   ========================================================= */

const translations = {

    en: {
        tap: "TAP",

        average: "Average BPM:",

        reset: "RESET",

        settings: "SETTINGS",

        tapKey: "Tap Key",

        newSession: "New Session After",

        history: "History",

        language: "Language",

        pressKey: "PRESS KEY...",

        seconds: "SEC",

        taps: "TAPS",

        madeBy: "Made by WHT MST"
    },


    ru: {
        tap: "ТАП",

        average: "Средний BPM:",

        reset: "СБРОС",

        settings: "НАСТРОЙКИ",

        tapKey: "Клавиша тапа",

        newSession: "Новая серия после",

        history: "История",

        language: "Язык",

        pressKey: "НАЖМИТЕ КЛАВИШУ...",

        seconds: "СЕК",

        taps: "ТАПОВ",

        madeBy: "Сделано WHT MST"
    },


    az: {
        tap: "TAP",

        average: "Orta BPM:",

        reset: "SIFIRLA",

        settings: "AYARLAR",

        tapKey: "Tap düyməsi",

        newSession: "Yeni sessiyadan sonra",

        history: "Tarixçə",

        language: "Dil",

        pressKey: "DÜYMƏYƏ BASIN...",

        seconds: "SAN",

        taps: "TAP",

        madeBy: "WHT MST tərəfindən"
    }
};


/* =========================================================
   SUPPORTED LANGUAGES
   ========================================================= */

const supportedLanguages = [
    "en",
    "ru",
    "az"
];


/* =========================================================
   TAP KEY VALIDATION
   ========================================================= */

/**
 * Check whether a key is allowed for Tap Key.
 *
 * @param {string} key
 * @returns {boolean}
 */
function isAllowedTapKey(key) {

    /*
     * Letters:
     *
     * KeyA ... KeyZ
     */

    if (
        /^Key[A-Z]$/.test(key)
    ) {
        return true;
    }


    /*
     * Numbers:
     *
     * Digit0 ... Digit9
     */

    if (
        /^Digit[0-9]$/.test(key)
    ) {
        return true;
    }


    /*
     * Numpad:
     *
     * Numpad0 ... Numpad9
     * NumpadAdd
     * NumpadSubtract
     * NumpadMultiply
     * NumpadDivide
     * NumpadDecimal
     * NumpadEnter
     */

    if (
        /^Numpad[0-9]$/.test(key)
    ) {
        return true;
    }


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


    /*
     * Special keys.
     */

    if (
        ALLOWED_SPECIAL_KEYS.has(key)
    ) {
        return true;
    }


    return false;
}


/* =========================================================
   KEY DISPLAY NAME
   ========================================================= */

/**
 * Convert KeyboardEvent.code to a readable label.
 *
 * @param {string} code
 * @returns {string}
 */
function getKeyDisplayName(code) {

    /* Letters */

    if (
        /^Key[A-Z]$/.test(code)
    ) {
        return code.replace(
            "Key",
            ""
        );
    }


    /* Numbers */

    if (
        /^Digit[0-9]$/.test(code)
    ) {
        return code.replace(
            "Digit",
            ""
        );
    }


    /* Numpad numbers */

    if (
        /^Numpad[0-9]$/.test(code)
    ) {
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
        NumpadEnter: "NUM ENTER"
    };


    return (
        specialNames[code] ||
        code.toUpperCase()
    );
}


/* =========================================================
   LANGUAGE
   ========================================================= */

/**
 * Get current language.
 *
 * @returns {string}
 */
function getCurrentLanguage() {

    const language =
        settings.get("language");


    if (
        supportedLanguages.includes(
            language
        )
    ) {
        return language;
    }


    return DEFAULT_SETTINGS.language;
}


/**
 * Set language immediately.
 *
 * @param {string} language
 */
function setLanguage(language) {

    if (
        !supportedLanguages.includes(
            language
        )
    ) {
        return;
    }


    settings.set(
        "language",
        language
    );


    applyLanguage(
        language
    );
}


/* =========================================================
   LANGUAGE APPLICATION
   ========================================================= */

function applyLanguage(language) {

    if (
        !supportedLanguages.includes(
            language
        )
    ) {
        language =
            DEFAULT_SETTINGS.language;
    }


    const text =
        translations[language];


    /* ---------------------------------------------
       Front side
       --------------------------------------------- */

    const currentTapText =
        tapValue.textContent.trim();


    const isInitialTapState =
        currentTapText === "TAP" ||
        currentTapText === "ТАП";


    if (isInitialTapState) {

        tapValue.textContent =
            text.tap;
    }


    document.querySelector(
        ".average__label"
    ).textContent =
        text.average;


    resetButton.textContent =
        text.reset;


    /* ---------------------------------------------
       Settings header
       --------------------------------------------- */

    document.querySelector(
        ".settings-content__header"
    ).textContent =
        text.settings;


    /* ---------------------------------------------
       Setting labels
       --------------------------------------------- */

    document.getElementById(
        "tapKeyLabel"
    ).textContent =
        text.tapKey;


    document.getElementById(
        "sessionLabel"
    ).textContent =
        text.newSession;


    document.getElementById(
        "historyLabel"
    ).textContent =
        text.history;


    document.getElementById(
        "languageLabel"
    ).textContent =
        text.language;


    /* ---------------------------------------------
       Footer
       --------------------------------------------- */

    if (madeByText) {

        madeByText.textContent =
            text.madeBy;
    }


    /* ---------------------------------------------
       Tap Key
       --------------------------------------------- */

    if (
        !tapKeyControl.classList.contains(
            "is-listening"
        )
    ) {
        updateTapKeyDisplay();
    }


    /* ---------------------------------------------
       Session
       --------------------------------------------- */

    updateSessionDisplay();


    /* ---------------------------------------------
       History
       --------------------------------------------- */

    updateHistoryDisplay();


    /* ---------------------------------------------
       Language buttons
       --------------------------------------------- */

    updateLanguageButtons(
        language
    );
}


/* =========================================================
   LANGUAGE BUTTONS
   ========================================================= */

function updateLanguageButtons(language) {

    const buttons =
        languageSwitcher.querySelectorAll(
            ".language-button"
        );


    buttons.forEach(
        (button) => {

            const isActive =
                button.dataset.language ===
                language;


            button.classList.toggle(
                "is-active",
                isActive
            );
        }
    );
}


/* =========================================================
   TAP KEY
   ========================================================= */

let isCapturingTapKey = false;

let previousTapKey = DEFAULT_SETTINGS.tapKey;


/**
 * Update displayed Tap Key.
 */
function updateTapKeyDisplay() {

    const key =
        settings.get("tapKey");


    tapKeyValue.textContent =
        getKeyDisplayName(key);
}


/**
 * Start key capture mode.
 */
function startTapKeyCapture() {

    if (isCapturingTapKey) {
        return;
    }


    /*
     * Remember the current key.
     *
     * Escape will restore this exact value.
     */

    previousTapKey =
        settings.get("tapKey");


    isCapturingTapKey = true;


    tapKeyControl.classList.add(
        "is-listening"
    );


    tapKeyValue.textContent =
        translations[
            getCurrentLanguage()
        ].pressKey;


    /*
     * Listen once globally.
     *
     * keydown is used instead of keyup so the
     * interface reacts immediately.
     */

    document.addEventListener(
        "keydown",
        captureTapKey,
        true
    );
}


/**
 * Stop key capture mode.
 */
function stopTapKeyCapture() {

    isCapturingTapKey = false;


    tapKeyControl.classList.remove(
        "is-listening"
    );


    document.removeEventListener(
        "keydown",
        captureTapKey,
        true
    );


    updateTapKeyDisplay();
}


/**
 * Capture the next allowed key.
 *
 * @param {KeyboardEvent} event
 */
function captureTapKey(event) {

    /*
     * Escape cancels the operation.
     *
     * The previous key remains unchanged.
     */

    if (
        event.code === "Escape"
    ) {

        event.preventDefault();
        event.stopPropagation();

        stopTapKeyCapture();

        settings.set(
            "tapKey",
            previousTapKey
        );

        updateTapKeyDisplay();

        return;
    }


    /*
     * Modifier keys cannot be assigned.
     */

    if (
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey
    ) {
        return;
    }


    /*
     * Ignore modifier-only key presses.
     */

    const modifierOnlyKeys = new Set([
        "ControlLeft",
        "ControlRight",

        "ShiftLeft",
        "ShiftRight",

        "AltLeft",
        "AltRight",

        "MetaLeft",
        "MetaRight"
    ]);


    if (
        modifierOnlyKeys.has(
            event.code
        )
    ) {
        return;
    }


    /*
     * Only allowed keys can be assigned.
     */

    if (
        !isAllowedTapKey(
            event.code
        )
    ) {
        return;
    }


    event.preventDefault();
    event.stopPropagation();


    /*
     * Save immediately.
     */

    settings.set(
        "tapKey",
        event.code
    );


    stopTapKeyCapture();
}


/* =========================================================
   TAP KEY BUTTON
   ========================================================= */

tapKeyControl.addEventListener(
    "click",
    () => {

        if (isCapturingTapKey) {
            return;
        }

        startTapKeyCapture();
    }
);


/* =========================================================
   DROPDOWNS
   ========================================================= */


/**
 * Close both dropdown menus.
 */
function closeDropdowns() {

    sessionControl.classList.remove(
        "is-open"
    );

    historyControl.classList.remove(
        "is-open"
    );

    sessionControl.setAttribute(
        "aria-expanded",
        "false"
    );

    historyControl.setAttribute(
        "aria-expanded",
        "false"
    );
}


/**
 * Toggle a dropdown.
 *
 * @param {HTMLElement} control
 * @param {HTMLElement} otherControl
 */
function toggleDropdown(
    control,
    otherControl
) {

    const isOpen =
        control.classList.contains(
            "is-open"
        );


    closeDropdowns();


    if (!isOpen) {

        control.classList.add(
            "is-open"
        );

        control.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


/* =========================================================
   SESSION DROPDOWN
   ========================================================= */

sessionControl.addEventListener(
    "click",
    (event) => {

        /*
         * Prevent a click on an option from
         * being interpreted as another toggle.
         */

        if (
            event.target.closest(
                ".dropdown-option"
            )
        ) {
            return;
        }


        event.stopPropagation();


        toggleDropdown(
            sessionControl,
            historyControl
        );
    }
);


/* =========================================================
   HISTORY DROPDOWN
   ========================================================= */

historyControl.addEventListener(
    "click",
    (event) => {

        if (
            event.target.closest(
                ".dropdown-option"
            )
        ) {
            return;
        }


        event.stopPropagation();


        toggleDropdown(
            historyControl,
            sessionControl
        );
    }
);


/* =========================================================
   SESSION OPTIONS
   ========================================================= */

sessionMenu
    .querySelectorAll(
        ".dropdown-option"
    )
    .forEach(
        (option) => {

            option.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    const value =
                        Number(
                            option.dataset.value
                        );


                    if (
                        Number.isNaN(value)
                    ) {
                        return;
                    }


                    settings.set(
                        "sessionTimeout",
                        value
                    );


                    updateSessionDisplay();

                    closeDropdowns();
                }
            );
        }
    );


/* =========================================================
   HISTORY OPTIONS
   ========================================================= */

historyMenu
    .querySelectorAll(
        ".dropdown-option"
    )
    .forEach(
        (option) => {

            option.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();


                    const value =
                        Number(
                            option.dataset.value
                        );


                    if (
                        Number.isNaN(value)
                    ) {
                        return;
                    }


                    settings.set(
                        "historyLength",
                        value
                    );


                    updateHistoryDisplay();

                    closeDropdowns();
                }
            );
        }
    );


/* =========================================================
   SESSION DISPLAY
   ========================================================= */

function updateSessionDisplay() {

    const language =
        getCurrentLanguage();


    const text =
        translations[language];


    const value =
        Number(
            settings.get(
                "sessionTimeout"
            )
        );


    sessionValue.textContent =
        `${value.toFixed(1)} ${text.seconds}`;


    updateSelectedOption(
        sessionMenu,
        String(value)
    );
}


/* =========================================================
   HISTORY DISPLAY
   ========================================================= */

function updateHistoryDisplay() {

    const language =
        getCurrentLanguage();


    const text =
        translations[language];


    const value =
        Number(
            settings.get(
                "historyLength"
            )
        );


    historyValue.textContent =
        `${value} ${text.taps}`;


    updateSelectedOption(
        historyMenu,
        String(value)
    );
}


/* =========================================================
   DROPDOWN SELECTED STATE
   ========================================================= */

function updateSelectedOption(
    menu,
    value
) {

    const options =
        menu.querySelectorAll(
            ".dropdown-option"
        );


    options.forEach(
        (option) => {

            const isSelected =
                option.dataset.value ===
                value;


            option.classList.toggle(
                "is-selected",
                isSelected
            );


            option.setAttribute(
                "aria-selected",
                String(isSelected)
            );
        }
    );
}


/* =========================================================
   LANGUAGE SWITCHER
   ========================================================= */

languageSwitcher
    .querySelectorAll(
        ".language-button"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const language =
                        button.dataset.language;


                    setLanguage(
                        language
                    );
                }
            );
        }
    );


/* =========================================================
   CLOSE DROPDOWNS OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    () => {

        closeDropdowns();
    }
);


/* =========================================================
   ESCAPE CLOSES DROPDOWNS
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        /*
         * If we are currently assigning a key,
         * the dedicated capture handler owns Escape.
         */

        if (
            isCapturingTapKey
        ) {
            return;
        }


        if (
            event.code === "Escape"
        ) {
            closeDropdowns();
        }
    }
);


/* =========================================================
   SETTINGS FLIP
   ========================================================= */

settingsButton.addEventListener(
    "click",
    () => {

        closeDropdowns();

        flipCard.classList.toggle(
            "is-flipped"
        );
    }
);


/* =========================================================
   RESET
   ========================================================= */

function resetTapper() {

    /*
     * Real Tap Tempo state will be added next.
     */

    tapValue.textContent =
        translations[
            getCurrentLanguage()
        ].tap;


    averageValue.textContent =
        "—";


    tapHistory.innerHTML =
        "";
}


resetButton.addEventListener(
    "click",
    resetTapper
);


/* =========================================================
   TAP BUTTON PLACEHOLDER
   ========================================================= */

tapButton.addEventListener(
    "click",
    () => {

        /*
         * Real Tap Tempo Engine comes next.
         */
    }
);


/* =========================================================
   PREVENT SPACE SCROLLING
   ========================================================= */

/*
 * The real Tap Tempo keyboard handler will later
 * intercept the configured key.
 *
 * For now we prevent Space from scrolling the page
 * while the Tapper button/page is active.
 */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.code === "Space" &&
            !isCapturingTapKey
        ) {

            event.preventDefault();
        }
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

    /*
     * Load persistent settings.
     */

    settings.load();


    /*
     * Apply saved language.
     */

    applyLanguage(
        getCurrentLanguage()
    );
}


/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
