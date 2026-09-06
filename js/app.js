/* =========================================================
   WM TAPPER
   Main application script

   Current stage:
   - Settings flip
   - Language switcher
   - Language persistence
   - Reset UI
   - Space is reserved for future Tap Tempo logic

   Tap Tempo calculation will be added later.
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
   LANGUAGE DATA
   ========================================================= */

const translations = {
    en: {
        tap: "TAP",
        average: "Average BPM:",
        reset: "RESET",
        settings: "SETTINGS",

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

        tapKey: "Tap düyməsi",
        newSession: "Yeni seriya",
        history: "Tarixçə",

        seconds: "3,0 SAN",
        taps: "12 TAP",

        madeBy: "WhiteMist tərəfindən"
    }
};


/* =========================================================
   LANGUAGE STORAGE
   ========================================================= */

const LANGUAGE_STORAGE_KEY = "wm-tapper-language";

const supportedLanguages = ["en", "ru", "az"];


/**
 * Returns the saved language if it is valid.
 * Otherwise English is used.
 */
function getSavedLanguage() {
    const savedLanguage = localStorage.getItem(
        LANGUAGE_STORAGE_KEY
    );

    if (supportedLanguages.includes(savedLanguage)) {
        return savedLanguage;
    }

    return "en";
}


/* =========================================================
   CURRENT STATE
   ========================================================= */

let currentLanguage = getSavedLanguage();


/* =========================================================
   LANGUAGE APPLICATION
   ========================================================= */

function applyLanguage(language) {
    if (!supportedLanguages.includes(language)) {
        language = "en";
    }

    currentLanguage = language;

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        currentLanguage
    );

    const text = translations[currentLanguage];

    /* ---------------------------------------------
       Front side
       --------------------------------------------- */

    /*
     * Do not overwrite a real BPM value here.
     * At this stage the button only contains "TAP".
     */
    if (
        tapValue.textContent.trim() === "TAP" ||
        tapValue.textContent.trim() === "ТАП"
    ) {
        tapValue.textContent = text.tap;
    }

    document.querySelector(
        ".average__label"
    ).textContent = text.average;

    resetButton.textContent = text.reset;


    /* ---------------------------------------------
       Settings side
       --------------------------------------------- */

    document.querySelector(
        ".settings-content__header"
    ).textContent = text.settings;

    const settingRows = document.querySelectorAll(
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


    document.querySelector(
        ".settings-about__text:last-of-type"
    ).textContent = text.madeBy;


    /* ---------------------------------------------
       Update language buttons
       --------------------------------------------- */

    updateLanguageButtons();
}


/* =========================================================
   SETTINGS FLIP
   ========================================================= */

function toggleSettings() {
    flipCard.classList.toggle("is-flipped");
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

/*
 * The language buttons are generated here so that
 * adding another language later is straightforward.
 */

function createLanguageSwitcher() {

    const settingsContent = document.querySelector(
        ".settings-content"
    );

    const existingSwitcher = document.getElementById(
        "languageSwitcher"
    );

    if (existingSwitcher) {
        existingSwitcher.remove();
    }


    /* ---------------------------------------------
       Wrapper
       --------------------------------------------- */

    const wrapper = document.createElement("div");

    wrapper.className = "language-switcher";
    wrapper.id = "languageSwitcher";


    /* ---------------------------------------------
       Label
       --------------------------------------------- */

    const label = document.createElement("div");

    label.className = "language-switcher__label";
    label.textContent = "LANGUAGE";


    /* ---------------------------------------------
       Buttons
       --------------------------------------------- */

    const buttons = document.createElement(
        "div"
    );

    buttons.className = "language-switcher__buttons";


    supportedLanguages.forEach((language) => {

        const button = document.createElement(
            "button"
        );

        button.type = "button";

        button.className =
            "language-button";

        button.dataset.language = language;

        button.textContent =
            language.toUpperCase();


        button.addEventListener(
            "click",
            () => {
                applyLanguage(language);
            }
        );


        buttons.appendChild(button);
    });


    wrapper.appendChild(label);
    wrapper.appendChild(buttons);

    /*
     * Insert the language selector before
     * the divider.
     */
    const divider = document.querySelector(
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

function updateLanguageButtons() {

    const buttons = document.querySelectorAll(
        ".language-button"
    );

    buttons.forEach((button) => {

        const isActive =
            button.dataset.language ===
            currentLanguage;

        button.classList.toggle(
            "is-active",
            isActive
        );
    });
}


/* =========================================================
   RESET
   ========================================================= */

function resetTapper() {

    /*
     * Tap calculation will later be reset here.
     */

    tapValue.textContent =
        translations[currentLanguage].tap;

    averageValue.textContent = "—";

    tapHistory.innerHTML = "";
}


/* =========================================================
   RESET BUTTON
   ========================================================= */

resetButton.addEventListener(
    "click",
    resetTapper
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

    createLanguageSwitcher();

    applyLanguage(currentLanguage);
}


/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
