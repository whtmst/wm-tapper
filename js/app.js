/* =========================================================
   WM TAPPER
   Main application script
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

const settings = {

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


        this.save();
    },


    /**
     * Save the current settings.
     */
    save() {

        storage.set(
            SETTINGS_STORAGE_KEY,
            this.data
        );
    },


    /**
     * Get one setting.
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
     * Set one setting.
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
     * Update multiple settings.
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

        language: "Language",

        tapKey: "Tap Key",
        newSession: "New Session After",
        history: "History",

        seconds: "3.0 SEC",
        taps: "12 TAPS",

        madeBy: "Made by WHT MST"
    },


    ru: {
        tap: "ТАП",
        average: "Средний BPM:",
        reset: "СБРОС",
        settings: "НАСТРОЙКИ",

        language: "Язык",

        tapKey: "Клавиша тапа",
        newSession: "Новая серия после",
        history: "История",

        seconds: "3,0 СЕК",
        taps: "12 ТАПОВ",

        madeBy: "Сделано WHT MST"
    },


    az: {
        tap: "TAP",
        average: "Orta BPM:",
        reset: "SIFIRLA",
        settings: "AYARLAR",

        language: "Dil",

        tapKey: "Tap düyməsi",
        newSession: "Yeni seriya sonra",
        history: "Tarixçə",

        seconds: "3,0 SAN",
        taps: "12 TAP",

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
   CURRENT LANGUAGE
   ========================================================= */

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


/* =========================================================
   CREATE LANGUAGE BUTTONS
   ========================================================= */

function createLanguageButtons() {

    if (!languageSwitcher) {
        return;
    }


    /*
     * Clear any previous buttons.
     */

    languageSwitcher.innerHTML = "";


    supportedLanguages.forEach(
        (language) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "language-button";

            button.dataset.language =
                language;

            button.textContent =
                language.toUpperCase();


            button.addEventListener(
                "click",
                () => {

                    setLanguage(
                        language
                    );
                }
            );


            languageSwitcher.appendChild(
                button
            );
        }
    );
}


/* =========================================================
   SET LANGUAGE
   ========================================================= */

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


    applyLanguage(language);
}


/* =========================================================
   APPLY LANGUAGE
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


    const initialTapState =
        currentTapText === "TAP" ||
        currentTapText === "ТАП";


    if (initialTapState) {

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
       Settings rows
       --------------------------------------------- */

    const settingRows =
        document.querySelectorAll(
            ".setting-row"
        );


    if (settingRows.length >= 3) {

        /* Tap Key */

        settingRows[0].querySelector(
            ".setting-row__label"
        ).textContent =
            text.tapKey;


        settingRows[0].querySelector(
            ".setting-row__value"
        ).textContent =
            "SPACE";


        /* New Session After */

        settingRows[1].querySelector(
            ".setting-row__label"
        ).textContent =
            text.newSession;


        settingRows[1].querySelector(
            ".setting-row__value"
        ).textContent =
            text.seconds;


        /* History */

        settingRows[2].querySelector(
            ".setting-row__label"
        ).textContent =
            text.history;


        settingRows[2].querySelector(
            ".setting-row__value"
        ).textContent =
            text.taps;
    }


    /* ---------------------------------------------
       Language label
       --------------------------------------------- */

    if (settingRows.length >= 4) {

        settingRows[3].querySelector(
            ".setting-row__label"
        ).textContent =
            text.language;
    }


    /* ---------------------------------------------
       About
       --------------------------------------------- */

    if (madeByText) {

        madeByText.textContent =
            text.madeBy;
    }


    /* ---------------------------------------------
       Language button state
       --------------------------------------------- */

    updateLanguageButtons(
        language
    );
}


/* =========================================================
   LANGUAGE BUTTON STATE
   ========================================================= */

function updateLanguageButtons(language) {

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
   RESET
   ========================================================= */

function resetTapper() {

    /*
     * Real Tap Tempo state will be implemented later.
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
   TAP PLACEHOLDER
   ========================================================= */

tapButton.addEventListener(
    "click",
    () => {

        /*
         * Real Tap Tempo logic will be added later.
         */
    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

    /*
     * Load persistent settings first.
     */

    settings.load();


    /*
     * Create EN / RU / AZ buttons
     * inside the existing Language row.
     */

    createLanguageButtons();


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
