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
   localStorage (browser)

   Later in Tauri:
   UI
    ↓
   Settings Manager
    ↓
   Storage Adapter
    ↓
   Tauri Store / JSON

   The rest of the application will not need to know
   where the settings are physically stored.
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const settingsButton = document.getElementById("settingsButton");
const flipCard = document.getElementById("flipCard");

const resetButton = document.getElementById("resetButton");

const tapButton = document.getElementById("tapButton");
const tapValue = document.getElementById("tapValue");

const averageValue = document.getElementById("averageValue");
const tapHistory = document.getElementById("tapHistory");


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
   STORAGE ADAPTER
   ========================================================= */

/*
 * This is the only place that directly talks to
 * localStorage.
 *
 * When the project moves to Tauri, this object can
 * be replaced with a Tauri-based implementation.
 *
 * The rest of the application should use storage.get(),
 * storage.set() and storage.remove() only.
 */

const storage = {

    /**
     * Read a value from persistent storage.
     *
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {

        try {
            const rawValue = localStorage.getItem(key);

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
     * Save a value to persistent storage.
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

/*
 * Settings Manager is deliberately independent from
 * the storage implementation.
 *
 * The rest of the application interacts with settings
 * through:
 *
 *     settings.get("language")
 *     settings.set("language", "ru")
 *
 * It does not care whether the data is stored in
 * localStorage, JSON, Tauri Store, etc.
 */

const settings = {

    data: null,


    /**
     * Load settings from persistent storage.
     *
     * Missing values automatically fall back to defaults.
     */
    load() {

        const savedSettings = storage.get(
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


        /*
         * Merge saved values over defaults.
         *
         * This is important for future updates:
         *
         * If version 2 adds a new setting, an old
         * settings file can still receive the default.
         */

        this.data = {
            ...DEFAULT_SETTINGS,
            ...savedSettings
        };


        /*
         * Persist the merged structure in case
         * new defaults were introduced.
         */

        this.save();
    },


    /**
     * Save the current settings object.
     */
    save() {

        storage.set(
            SETTINGS_STORAGE_KEY,
            this.data
        );
    },


    /**
     * Get a single setting.
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
     * Update a single setting.
     *
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {

        if (!this.data) {
            this.load();
        }

        this.data[key] = value;

        this.save();
    },


    /**
     * Replace several settings at once.
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

        this.save();
    },


    /**
     * Reset all settings to defaults.
     */
    reset() {

        this.data = {
            ...DEFAULT_SETTINGS
        };

        this.save();
    }
};


/* =========================================================
   LANGUAGE DATA
   ========================================================= */

const translations = {

    en: {
        tap: "TAP",

        average: "Average BPM:",

        reset: "RESET",

        settings: "SETTINGS",

        language: "LANGUAGE",

        tapKey: "Tap Key",

        newSession: "New Session",

        history: "History",

        seconds: "3.0 SEC",

        taps: "12 TAPS",

        madeBy: "Made by WhiteMist"
    },


    ru: {
        tap: "ТАП",

        average: "Средний BPM:",

        reset: "СБРОС",

        settings: "НАСТРОЙКИ",

        language: "ЯЗЫК",

        tapKey: "Клавиша тапа",

        newSession: "Новая серия",

        history: "История",

        seconds: "3,0 СЕК",

        taps: "12 ТАПОВ",

        madeBy: "Сделано WhiteMist"
    },


    az: {
        tap: "TAP",

        average: "Orta BPM:",

        reset: "SIFIRLA",

        settings: "AYARLAR",

        language: "DİL",

        tapKey: "Tap düyməsi",

        newSession: "Yeni seriya",

        history: "Tarixçə",

        seconds: "3,0 SAN",

        taps: "12 TAP",

        madeBy: "WhiteMist tərəfindən"
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
   LANGUAGE HELPERS
   ========================================================= */


/**
 * Return the currently configured language.
 *
 * If the saved value is invalid, English is used.
 *
 * @returns {string}
 */
function getCurrentLanguage() {

    const savedLanguage =
        settings.get("language");


    if (
        supportedLanguages.includes(
            savedLanguage
        )
    ) {
        return savedLanguage;
    }


    settings.set(
        "language",
        DEFAULT_SETTINGS.language
    );


    return DEFAULT_SETTINGS.language;
}


/**
 * Change the current language.
 *
 * @param {string} language
 */
function setLanguage(language) {

    if (
        !supportedLanguages.includes(language)
    ) {
        return;
    }


    settings.set(
        "language",
        language
    );


    applyLanguage(language);
}


/* =========================================================
   LANGUAGE APPLICATION
   ========================================================= */

function applyLanguage(language) {

    if (
        !supportedLanguages.includes(language)
    ) {
        language = DEFAULT_SETTINGS.language;
    }


    const text =
        translations[language];


    /* ---------------------------------------------
       Front side
       --------------------------------------------- */

    const currentTapText =
        tapValue.textContent.trim();


    /*
     * Only replace the button text while it still
     * represents the initial TAP state.
     *
     * We do not want a language change to overwrite
     * an already calculated BPM.
     */

    const isInitialTapState =
        currentTapText === "TAP" ||
        currentTapText === "ТАП";


    if (isInitialTapState) {
        tapValue.textContent =
            text.tap;
    }


    document.querySelector(
        ".average__label"
    ).textContent = text.average;


    resetButton.textContent =
        text.reset;


    /* ---------------------------------------------
       Settings side
       --------------------------------------------- */

    document.querySelector(
        ".settings-content__header"
    ).textContent = text.settings;


    const settingRows =
        document.querySelectorAll(
            ".setting-row"
        );


    if (settingRows.length >= 3) {

        settingRows[0].querySelector(
            ".setting-row__label"
        ).textContent = text.tapKey;


        settingRows[0].querySelector(
            ".setting-row__value"
        ).textContent = "SPACE";


        settingRows[1].querySelector(
            ".setting-row__label"
        ).textContent = text.newSession;


        settingRows[1].querySelector(
            ".setting-row__value"
        ).textContent = text.seconds;


        settingRows[2].querySelector(
            ".setting-row__label"
        ).textContent = text.history;


        settingRows[2].querySelector(
            ".setting-row__value"
        ).textContent = text.taps;
    }


    /*
     * Language label is created dynamically.
     * Do not assume that it already exists.
     */

    const languageLabel =
        document.querySelector(
            ".language-switcher__label"
        );


    if (languageLabel) {
        languageLabel.textContent =
            text.language;
    }


    document.querySelector(
        ".settings-about__text:last-of-type"
    ).textContent =
        text.madeBy;


    updateLanguageButtons(
        language
    );
}


/* =========================================================
   SETTINGS FLIP
   ========================================================= */

function toggleSettings() {

    flipCard.classList.toggle(
        "is-flipped"
    );
}


/* =========================================================
   SETTINGS BUTTON
   ========================================================= */

settingsButton.addEventListener(
    "click",
    toggleSettings
);


/* =========================================================
   LANGUAGE SWITCHER
   ========================================================= */

function createLanguageSwitcher() {

    const settingsContent =
        document.querySelector(
            ".settings-content"
        );


    const existingSwitcher =
        document.getElementById(
            "languageSwitcher"
        );


    if (existingSwitcher) {
        existingSwitcher.remove();
    }


    /* ---------------------------------------------
       Wrapper
       --------------------------------------------- */

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "language-switcher";

    wrapper.id =
        "languageSwitcher";


    /* ---------------------------------------------
       Label
       --------------------------------------------- */

    const label =
        document.createElement("div");


    label.className =
        "language-switcher__label";


    /* ---------------------------------------------
       Buttons
       --------------------------------------------- */

    const buttons =
        document.createElement("div");


    buttons.className =
        "language-switcher__buttons";


    supportedLanguages.forEach(
        (language) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "language-button";


            button.dataset.language =
                language;


            button.textContent =
                language.toUpperCase();


            button.addEventListener(
                "click",
                () => {
                    setLanguage(language);
                }
            );


            buttons.appendChild(
                button
            );
        }
    );


    wrapper.appendChild(
        label
    );


    wrapper.appendChild(
        buttons
    );


    /*
     * Insert the language switcher before
     * the existing divider.
     */

    const divider =
        document.querySelector(
            ".settings-divider"
        );


    settingsContent.insertBefore(
        wrapper,
        divider
    );
}


/* =========================================================
   LANGUAGE BUTTON STATE
   ========================================================= */

function updateLanguageButtons(
    language = getCurrentLanguage()
) {

    const buttons =
        document.querySelectorAll(
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
   RESET
   ========================================================= */

function resetTapper() {

    /*
     * Real Tap Tempo state will be reset here later.
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


/* =========================================================
   RESET BUTTON
   ========================================================= */

resetButton.addEventListener(
    "click",
    resetTapper
);


/* =========================================================
   PLACEHOLDER TAP HANDLER
   ========================================================= */

/*
 * The actual Tap Tempo engine will be implemented later.
 *
 * For now this handler is deliberately empty so that
 * clicking the button does not accidentally interfere
 * with the visual prototype.
 */

tapButton.addEventListener(
    "click",
    () => {
        /*
         * Tap Tempo will be implemented here.
         */
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

    /*
     * 1. Load persistent settings.
     */

    settings.load();


    /*
     * 2. Build the language selector.
     */

    createLanguageSwitcher();


    /*
     * 3. Apply saved language.
     */

    applyLanguage(
        getCurrentLanguage()
    );
}


/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
