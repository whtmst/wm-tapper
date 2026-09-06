/* =========================================================
   WM TAPPER
   Main application controller
   ========================================================= */


/* =========================================================
   IMPORTS
   ========================================================= */

import {
    settings
} from "./settings.js";


import {
    supportedLanguages,
    getTranslations,
    formatDecimal
} from "./i18n.js";


import {
    TapKeyController
} from "./key-handler.js";


import {
    TapEngine
} from "./tap-engine.js";


import {
    TrackAnalyzer
} from "./analyzer.js";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const settingsButton =
    document.getElementById(
        "settingsButton"
    );


const flipCard =
    document.getElementById(
        "flipCard"
    );


const tapButton =
    document.getElementById(
        "tapButton"
    );


const tapValue =
    document.getElementById(
        "tapValue"
    );


const resetButton =
    document.getElementById(
        "resetButton"
    );


const averageValue =
    document.getElementById(
        "averageValue"
    );


const tapHistory =
    document.getElementById(
        "tapHistory"
    );


const tapKeyControl =
    document.getElementById(
        "tapKeyControl"
    );


const tapKeyValue =
    document.getElementById(
        "tapKeyValue"
    );


const sessionControl =
    document.getElementById(
        "sessionControl"
    );


const sessionValue =
    document.getElementById(
        "sessionValue"
    );


const sessionMenu =
    document.getElementById(
        "sessionMenu"
    );


const historyControl =
    document.getElementById(
        "historyControl"
    );


const historyValue =
    document.getElementById(
        "historyValue"
    );


const historyMenu =
    document.getElementById(
        "historyMenu"
    );


const languageSwitcher =
    document.getElementById(
        "languageSwitcher"
    );


const madeByText =
    document.getElementById(
        "madeByText"
    );


/* =========================================================
   APPLICATION MODULES
   ========================================================= */

const tapEngine =
    new TapEngine();


const trackAnalyzer =
    new TrackAnalyzer();


const tapKeyController =
    new TapKeyController({
        control: tapKeyControl,
        value: tapKeyValue
    });


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


    return "en";
}


/**
 * Set language and save immediately.
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


/**
 * Apply language to the UI.
 *
 * @param {string} language
 */
function applyLanguage(language) {

    const text =
        getTranslations(
            language
        );


    /* -----------------------------------------
       Front side
       ----------------------------------------- */

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


    /* -----------------------------------------
       Settings header
       ----------------------------------------- */

    document.querySelector(
        ".settings-content__header"
    ).textContent =
        text.settings;


    /* -----------------------------------------
       Labels
       ----------------------------------------- */

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


    /* -----------------------------------------
       Footer
       ----------------------------------------- */

    if (madeByText) {

        madeByText.textContent =
            text.madeBy;
    }


    /* -----------------------------------------
       Tap Key
       ----------------------------------------- */

    tapKeyController.updateDisplay();


    /* -----------------------------------------
       Session
       ----------------------------------------- */

    updateSessionDisplay();


    /* -----------------------------------------
       History
       ----------------------------------------- */

    updateHistoryDisplay();


    /* -----------------------------------------
       Dropdown translations
       ----------------------------------------- */

    updateDropdownTranslations(
        language
    );


    /* -----------------------------------------
       Language buttons
       ----------------------------------------- */

    updateLanguageButtons(
        language
    );
}


/* =========================================================
   SESSION DISPLAY
   ========================================================= */

function updateSessionDisplay() {

    const language =
        getCurrentLanguage();


    const text =
        getTranslations(
            language
        );


    const value =
        Number(
            settings.get(
                "sessionTimeout"
            )
        );


    sessionValue.textContent =
        `${formatDecimal(
            value,
            language
        )} ${text.seconds}`;


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
        getTranslations(
            language
        );


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
   DROPDOWN TRANSLATIONS
   ========================================================= */

function updateDropdownTranslations(
    language = getCurrentLanguage()
) {

    const text =
        getTranslations(
            language
        );


    /* -----------------------------------------
       Session options
       ----------------------------------------- */

    sessionMenu
        .querySelectorAll(
            ".dropdown-option"
        )
        .forEach(
            (option) => {

                const value =
                    Number(
                        option.dataset.value
                    );


                if (
                    Number.isNaN(value)
                ) {
                    return;
                }


                option.textContent =
                    `${formatDecimal(
                        value,
                        language
                    )} ${text.seconds}`;
            }
        );


    /* -----------------------------------------
       History options
       ----------------------------------------- */

    historyMenu
        .querySelectorAll(
            ".dropdown-option"
        )
        .forEach(
            (option) => {

                const value =
                    Number(
                        option.dataset.value
                    );


                if (
                    Number.isNaN(value)
                ) {
                    return;
                }


                option.textContent =
                    `${value} ${text.taps}`;
            }
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

            const buttonLanguage =
                button.dataset.language;

            if (
                buttonLanguage === language
            ) {

                button.classList.add(
                    "is-active"
                );

            } else {

                button.classList.remove(
                    "is-active"
                );
            }
        }
    );
}


/* =========================================================
   DROPDOWNS
   ========================================================= */

/**
 * Close all dropdowns.
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
 * Toggle dropdown.
 *
 * @param {HTMLElement} control
 */
function toggleDropdown(control) {

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

        if (
            event.target.closest(
                ".dropdown-option"
            )
        ) {
            return;
        }


        event.stopPropagation();


        toggleDropdown(
            sessionControl
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
            historyControl
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


                    tapEngine.configure({
                        sessionTimeout:
                            settings.get(
                                "sessionTimeout"
                            ),

                        historyLength:
                            settings.get(
                                "historyLength"
                            )
                    });


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


                    tapEngine.configure({
                        sessionTimeout:
                            settings.get(
                                "sessionTimeout"
                            ),

                        historyLength:
                            settings.get(
                                "historyLength"
                            )
                    });


                    updateHistoryDisplay();

                    closeDropdowns();
                }
            );
        }
    );


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

                    setLanguage(
                        button.dataset.language
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
   ESCAPE
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        /*
         * Tap Key capture has its own Escape handling.
         */

        if (
            tapKeyController.isCapturing
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

        updateLanguageButtons(
            getCurrentLanguage()
        );
    }
);


/* =========================================================
   RESET
   ========================================================= */

resetButton.addEventListener(
    "click",
    () => {

        tapEngine.reset();


        tapValue.textContent =
            getTranslations(
                getCurrentLanguage()
            ).tap;


        averageValue.textContent =
            "—";


        tapHistory.innerHTML =
            "";
    }
);


/* =========================================================
   TAP BUTTON
   ========================================================= */

tapButton.addEventListener(
    "click",
    () => {

        /*
         * Real Tap Tempo logic will be connected
         * to tapEngine.registerTap() next.
         */
    }
);


/* =========================================================
   PREVENT SPACE SCROLLING
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.code === "Space" &&
            !tapKeyController.isCapturing
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
     * Configure Tap Engine with current settings.
     */

    tapEngine.configure({

        sessionTimeout:
            settings.get(
                "sessionTimeout"
            ),

        historyLength:
            settings.get(
                "historyLength"
            )
    });


    /*
     * Initialize Tap Key controller.
     */

    tapKeyController.initialize();


    /*
     * Apply saved language and UI state.
     */

    applyLanguage(
        getCurrentLanguage()
    );


    /*
     * The analyzer is instantiated above and
     * will be connected when Analyze File UI
     * is introduced.
     */

    void trackAnalyzer;
}


/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
