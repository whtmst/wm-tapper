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


import {
    createTapUI
} from "./tap-ui.js";


import {
    createDropdownController
} from "./dropdowns.js";


import {
    createSessionController
} from "./session.js";


import {
    createLanguageUI
} from "./language-ui.js";


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


const analyzeButton =
    document.getElementById(
        "analyzeButton"
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


const averageLabel =
    document.querySelector(
        ".average__label"
    );


const settingsHeader =
    document.querySelector(
        ".settings-content__header"
    );


const tapKeyLabel =
    document.getElementById(
        "tapKeyLabel"
    );


const sessionLabel =
    document.getElementById(
        "sessionLabel"
    );


const historyLabel =
    document.getElementById(
        "historyLabel"
    );


const languageLabel =
    document.getElementById(
        "languageLabel"
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
   LOCAL HELPERS
   ========================================================= */

/**
 * Get current language.
 *
 * This helper is intentionally defined
 * before language UI initialization.
 *
 * @returns {string}
 */
function getCurrentLanguage() {

    const language =
        settings.get(
            "language"
        );


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
 * Format BPM with two decimals.
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
   AUDIO FILE PICKER
   ========================================================= */

const SUPPORTED_AUDIO_EXTENSIONS = [
    ".mp3",
    ".wav",
    ".flac",
    ".aif",
    ".aiff"
];


const SUPPORTED_AUDIO_MIME_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/aiff",
    "audio/x-aiff"
];


/**
 * Check whether a file has a supported
 * audio extension.
 *
 * @param {File} file
 * @returns {boolean}
 */
function hasSupportedAudioExtension(file) {

    if (
        !(file instanceof File)
    ) {
        return false;
    }


    const fileName =
        file.name.toLowerCase();


    return SUPPORTED_AUDIO_EXTENSIONS
        .some(
            (extension) => {
                return fileName.endsWith(
                    extension
                );
            }
        );
}


/**
 * Check whether a file has a supported
 * MIME type.
 *
 * Empty MIME types are allowed because
 * some browsers / operating systems may
 * provide an empty type for valid files.
 *
 * @param {File} file
 * @returns {boolean}
 */
function hasSupportedAudioMimeType(file) {

    if (
        !(file instanceof File)
    ) {
        return false;
    }


    if (
        !file.type
    ) {
        return true;
    }


    return SUPPORTED_AUDIO_MIME_TYPES.includes(
        file.type.toLowerCase()
    );
}


/**
 * Validate selected audio file.
 *
 * @param {File} file
 * @returns {boolean}
 */
function isSupportedAudioFile(file) {

    return (
        hasSupportedAudioExtension(file) &&
        hasSupportedAudioMimeType(file)
    );
}


/**
 * Create hidden audio file input.
 *
 * The input is intentionally created from JavaScript
 * so index.html does not need another visible element.
 *
 * @returns {HTMLInputElement}
 */
function createAudioFileInput() {

    const input =
        document.createElement(
            "input"
        );


    input.type =
        "file";


    /*
     * One file only.
     *
     * "multiple" is intentionally NOT present.
     */

    input.multiple =
        false;


    /*
     * Restrict the picker to formats
     * supported by the application.
     */

    input.accept =
        ".mp3,.wav,.flac,.aif,.aiff," +
        "audio/mpeg,audio/wav,audio/x-wav," +
        "audio/flac,audio/aiff,audio/x-aiff";


    /*
     * Keep the element completely invisible.
     */

    input.style.display =
        "none";


    document.body.appendChild(
        input
    );


    return input;
}


const audioFileInput =
    createAudioFileInput();


/* =========================================================
   AUDIO FILE SELECTION
   ========================================================= */

audioFileInput.addEventListener(
    "change",
    async () => {

        const file =
            audioFileInput.files?.[0];


        /*
         * No file selected.
         */

        if (!file) {

            audioFileInput.value =
                "";

            return;
        }


        /*
         * Validate selected file.
         */

        if (
            !isSupportedAudioFile(file)
        ) {

            console.warn(
                "WM Tapper: unsupported audio file.",
                file.name,
                file.type
            );


            audioFileInput.value =
                "";

            return;
        }


        /*
         * Prevent duplicate analysis requests.
         */

        if (
            trackAnalyzer.isAnalyzing
        ) {

            audioFileInput.value =
                "";

            return;
        }


        try {

            analyzeButton.disabled =
                true;


            console.log(
                "WM Tapper: starting audio analysis.",
                {
                    name: file.name,
                    type: file.type,
                    size: file.size
                }
            );


            const result =
                await trackAnalyzer.analyze(
                    file
                );


            console.log(
                "WM Tapper: final analysis result.",
                result
            );


        } catch (error) {

            console.error(
                "WM Tapper: failed to analyze audio file.",
                error
            );

        } finally {

            analyzeButton.disabled =
                false;


            /*
             * Allow selecting the exact same file
             * again later.
             */

            audioFileInput.value =
                "";
        }
    }
);


/* =========================================================
   ANALYZE FILE BUTTON
   ========================================================= */

analyzeButton.addEventListener(
    "click",
    () => {

        audioFileInput.click();
    }
);


/* =========================================================
   DROPDOWNS
   ========================================================= */

const dropdowns =
    createDropdownController(
        {
            sessionControl,
            sessionMenu,
            historyControl,
            historyMenu
        },
        {
            onSessionChange: (
                value
            ) => {

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


                languageUI.updateSessionDisplay();
            },


            onHistoryChange: (
                value
            ) => {

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


                languageUI.updateHistoryDisplay();
            }
        }
    );


/* =========================================================
   TAP UI
   ========================================================= */

const tapUI =
    createTapUI(
        {
            tapValue,
            averageValue,
            tapHistory
        },
        {
            tapEngine,
            getCurrentLanguage,
            formatBpm,
            getTranslations
        }
    );


/* =========================================================
   LANGUAGE UI
   ========================================================= */

const languageUI =
    createLanguageUI(
        {
            languageSwitcher,
            averageLabel,
            resetButton,
            analyzeButton,
            settingsHeader,
            tapKeyLabel,
            sessionLabel,
            historyLabel,
            languageLabel,
            madeByText,
            sessionValue,
            sessionMenu,
            historyValue,
            historyMenu
        },
        {
            settings,
            supportedLanguages,
            getTranslations,
            formatDecimal,
            tapKeyController,
            tapUI,
            dropdowns
        }
    );


/* =========================================================
   SESSION
   ========================================================= */

const session =
    createSessionController({

        tapEngine,

        onSessionFinished: (
            averageBpm
        ) => {

            tapUI.showFinalBpm(
                averageBpm
            );
        }
    });


/* =========================================================
   TAP RESULT
   ========================================================= */

function handleTap() {

    /*
     * Every new tap means that the current
     * session is still active.
     */

    session.clear();


    const result =
        tapEngine.registerTap();


    /* -----------------------------------------
       New session
       ----------------------------------------- */

    if (
        result.isNewSession
    ) {

        tapUI.showTap();

        tapUI.showAverageBpm(
            null
        );
    }


    /* -----------------------------------------
       Current BPM
       ----------------------------------------- */

    if (
        Number.isFinite(
            result.bpm
        )
    ) {

        tapUI.showCurrentBpm(
            result.bpm
        );
    }


    /* -----------------------------------------
       Average BPM
       ----------------------------------------- */

    tapUI.showAverageBpm(
        result.averageBpm
    );


    /* -----------------------------------------
       Session timer
       ----------------------------------------- */

    if (
        Array.isArray(
            result.history
        ) &&
        result.history.length > 0
    ) {

        session.restart(
            Number(
                settings.get(
                    "sessionTimeout"
                )
            )
        );
    }


    /* -----------------------------------------
       History
       ----------------------------------------- */

    tapUI.renderTapHistory(
        result.history
    );
}


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
   SETTINGS FLIP
   ========================================================= */

settingsButton.addEventListener(
    "click",
    () => {

        dropdowns.closeAll();


        flipCard.classList.toggle(
            "is-flipped"
        );


        languageUI.updateLanguageButtons(
            languageUI.getCurrentLanguage()
        );
    }
);


/* =========================================================
   RESET
   ========================================================= */

resetButton.addEventListener(
    "click",
    () => {

        session.reset();

        tapEngine.reset();

        tapUI.reset();
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
     * Configure Tap Engine.
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
     * Apply saved language.
     */

    languageUI.applyLanguage(
        languageUI.getCurrentLanguage()
    );


    /*
     * Final language button synchronization.
     */

    languageUI.updateLanguageButtons(
        languageUI.getCurrentLanguage()
    );


    /*
     * Analyzer will be connected
     * after the file picker stage.
     */

    void trackAnalyzer;
}


/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
