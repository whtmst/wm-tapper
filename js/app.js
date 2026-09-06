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
   SESSION TIMER
   ========================================================= */

/*
 * This timer marks the end of the current
 * tap session after the configured period
 * of inactivity.
 */

let sessionTimer = null;


/**
 * Clear the current session timer.
 */
function clearSessionTimer() {

    if (
        sessionTimer !== null
    ) {

        clearTimeout(
            sessionTimer
        );

        sessionTimer = null;
    }
}


/**
 * Start / restart the session timer.
 *
 * @param {number} delaySeconds
 */
function restartSessionTimer(
    delaySeconds
) {

    clearSessionTimer();


    sessionTimer =
        setTimeout(
            () => {

                sessionTimer = null;

                finishTapSession();

            },
            delaySeconds * 1000
        );
}


/**
 * Finish the current tap session.
 *
 * The final average BPM is rounded and
 * moved to the main button.
 */
function finishTapSession() {

    const averageBpm =
        tapEngine.getAverageBpm();


    /*
     * Do nothing when the session contains
     * fewer than two valid taps.
     */

    if (
        !Number.isFinite(
            averageBpm
        )
    ) {
        return;
    }


    /*
     * The final result shown on the main
     * button is the rounded session average.
     */

    tapValue.textContent =
        `${Math.round(
            averageBpm
        )} BPM`;
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


    return "en";
}


/**
 * Update active language button.
 *
 * @param {string} language
 */
function updateLanguageButtons(language) {

    if (!languageSwitcher) {
        return;
    }


    const buttons =
        languageSwitcher.querySelectorAll(
            ".language-button"
        );


    buttons.forEach(
        (button) => {

            button.classList.remove(
                "is-active"
            );


            if (
                button.dataset.language === language
            ) {

                button.classList.add(
                    "is-active"
                );
            }
        }
    );
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


    updateLanguageButtons(
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


    /* -----------------------------------------
       Current BPM display
       ----------------------------------------- */

    updateTapDisplayLanguage(
        language
    );
}


/* =========================================================
   SELECTED DROPDOWN OPTION
   ========================================================= */

/**
 * Update selected state inside a dropdown.
 *
 * @param {HTMLElement} menu
 * @param {string} value
 */
function updateSelectedOption(
    menu,
    value
) {

    if (!menu) {
        return;
    }


    menu
        .querySelectorAll(
            ".dropdown-option"
        )
        .forEach(
            (option) => {

                const isSelected =
                    option.dataset.value === value;


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
   BPM FORMATTING
   ========================================================= */

/**
 * Format average BPM with two decimals.
 *
 * @param {number|null} value
 * @returns {string}
 */
function formatBpm(value) {

    if (
        !Number.isFinite(value)
    ) {
        return "—";
    }


    const language =
        getCurrentLanguage();


    return formatDecimal(
        Number(
            value.toFixed(2)
        ),
        language
    );
}


/* =========================================================
   TAP DISPLAY
   ========================================================= */

/**
 * Update the BPM display after language change.
 *
 * Keeps the numeric BPM intact while refreshing
 * the TAP text when no BPM is available.
 *
 * @param {string} language
 */
function updateTapDisplayLanguage(language) {

    const text =
        getTranslations(
            language
        );


    const currentValue =
        tapValue.textContent.trim();


    const isTapState =
        currentValue === "TAP" ||
        currentValue === "ТАП";


    if (isTapState) {

        tapValue.textContent =
            text.tap;
    }


    const average =
        tapEngine.getAverageBpm();


    if (
        average === null
    ) {

        averageValue.textContent =
            "—";

    } else {

        averageValue.textContent =
            formatBpm(
                average
            );
    }
}


/* =========================================================
   TAP HISTORY RENDERING
   ========================================================= */

/**
 * Render tap history points.
 *
 * Horizontal position represents real time
 * between taps.
 *
 * @param {number[]} timestamps
 */
function renderTapHistory(timestamps) {

    tapHistory.innerHTML =
        "";


    if (
        !Array.isArray(timestamps) ||
        timestamps.length === 0
    ) {
        return;
    }


    const firstTime =
        timestamps[0];


    const lastTime =
        timestamps[
            timestamps.length - 1
        ];


    const timeRange =
        lastTime -
        firstTime;


    const leftPadding = 6;
    const rightPadding = 6;


    const historyWidth =
        tapHistory.clientWidth;


    const usableWidth =
        Math.max(
            0,
            historyWidth -
            leftPadding -
            rightPadding
        );


    /*
     * With only one tap there is no interval
     * to visualize, so put the point in the center.
     */

    if (
        timestamps.length === 1 ||
        timeRange <= 0
    ) {

        createTapPoint(
            50
        );

        return;
    }


    timestamps.forEach(
        (timestamp) => {

            const normalized =
                (
                    timestamp -
                    firstTime
                ) /
                timeRange;


            const x =
                leftPadding +
                (
                    normalized *
                    usableWidth
                );


            const percent =
                historyWidth > 0
                    ? (
                        x /
                        historyWidth
                    ) * 100
                    : 50;


            createTapPoint(
                percent
            );
        }
    );


    renderTapConnectors(
        timestamps,
        leftPadding,
        usableWidth,
        historyWidth
    );
}


/**
 * Create one tap point.
 *
 * @param {number} leftPercent
 */
function createTapPoint(leftPercent) {

    const point =
        document.createElement(
            "div"
        );


    point.className =
        "tap-point";


    point.style.left =
        `${leftPercent}%`;


    point.style.top =
        "50%";


    tapHistory.appendChild(
        point
    );
}


/**
 * Render connectors between points.
 *
 * @param {number[]} timestamps
 * @param {number} leftPadding
 * @param {number} usableWidth
 * @param {number} historyWidth
 */
function renderTapConnectors(
    timestamps,
    leftPadding,
    usableWidth,
    historyWidth
) {

    const firstTime =
        timestamps[0];


    const lastTime =
        timestamps[
            timestamps.length - 1
        ];


    const timeRange =
        lastTime -
        firstTime;


    if (
        timeRange <= 0 ||
        historyWidth <= 0
    ) {
        return;
    }


    for (
        let index = 0;
        index < timestamps.length - 1;
        index += 1
    ) {

        const startNormalized =
            (
                timestamps[index] -
                firstTime
            ) /
            timeRange;


        const endNormalized =
            (
                timestamps[index + 1] -
                firstTime
            ) /
            timeRange;


        const startX =
            leftPadding +
            (
                startNormalized *
                usableWidth
            );


        const endX =
            leftPadding +
            (
                endNormalized *
                usableWidth
            );


        const connector =
            document.createElement(
                "div"
            );


        connector.className =
            "tap-connector";


        connector.style.left =
            `${startX}px`;


        connector.style.width =
            `${Math.max(
                0,
                endX - startX
            )}px`;


        connector.style.top =
            "50%";


        tapHistory.appendChild(
            connector
        );
    }
}


/* =========================================================
   TAP RESULT
   ========================================================= */

/**
 * Process one tap.
 */
function handleTap() {

    /*
     * A new tap means the current session
     * is still active, so reset the timeout.
     */

    clearSessionTimer();


    const result =
        tapEngine.registerTap();


    /*
     * New session:
     * this tap is the first tap of the
     * new series and therefore has no BPM.
     */

    if (
        result.isNewSession
    ) {

        tapValue.textContent =
            getTranslations(
                getCurrentLanguage()
            ).tap;


        averageValue.textContent =
            "—";
    }


    /*
     * Display the current measured BPM
     * while the user is actively tapping.
     */

    if (
        Number.isFinite(
            result.bpm
        )
    ) {

        tapValue.textContent =
            `${Math.round(
                result.bpm
            )} BPM`;
    }


    /*
     * Display average BPM.
     */

    if (
        Number.isFinite(
            result.averageBpm
        )
    ) {

        averageValue.textContent =
            formatBpm(
                result.averageBpm
            );

    } else {

        averageValue.textContent =
            "—";
    }


    /*
     * Restart the session timeout after
     * every accepted tap.
     */

    if (
        Array.isArray(
            result.history
        ) &&
        result.history.length > 0
    ) {

        restartSessionTimer(
            Number(
                settings.get(
                    "sessionTimeout"
                )
            )
        );
    }


    /*
     * Update visual history.
     */

    renderTapHistory(
        result.history
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
                (event) => {

                    event.stopPropagation();


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

        clearSessionTimer();


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

        handleTap();
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

    const language =
        getCurrentLanguage();


    applyLanguage(
        language
    );


    /*
     * Final synchronization.
     */

    updateLanguageButtons(
        language
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
