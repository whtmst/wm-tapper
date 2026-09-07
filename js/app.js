/* =========================================================
   WM TAPPER
   Main application controller
   ========================================================= */

/* =========================================================
   IMPORTS
   ========================================================= */

import { settings } from "./settings.js";

import {
    supportedLanguages,
    getTranslations,
    formatDecimal,
    formatConfidence,
    formatAnalysisKey,
} from "./i18n.js";

import { TapKeyController } from "./key-handler.js";

import { TapEngine } from "./tap-engine.js";

import { TrackAnalyzer } from "./analyzer.js";

import { createTapUI } from "./tap-ui.js";

import { createDropdownController } from "./dropdowns.js";

import { createSessionController } from "./session.js";

import { createLanguageUI } from "./language-ui.js";

import {
    decodeAudioFile,
    extractPeaks,
    createWaveformRenderer,
} from "./waveform.js";

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const settingsButton = document.getElementById("settingsButton");

const flipCard = document.getElementById("flipCard");

const tapButton = document.getElementById("tapButton");

const tapValue = document.getElementById("tapValue");

const analyzeButton = document.getElementById("analyzeButton");

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

const averageLabel = document.querySelector(".average__label");

const settingsHeader = document.querySelector(".settings-content__header");

const tapKeyLabel = document.getElementById("tapKeyLabel");

const sessionLabel = document.getElementById("sessionLabel");

const historyLabel = document.getElementById("historyLabel");

const languageLabel = document.getElementById("languageLabel");

/* =========================================================
   ANALYSIS PANEL ELEMENTS
   ========================================================= */

const analysisPanel = document.getElementById("analysisPanel");

const analysisWaveform = document.getElementById("analysisWaveform");

const analysisOverlayLeft = document.getElementById("analysisOverlayLeft");

const analysisOverlayRight = document.getElementById("analysisOverlayRight");

const analysisSelection = document.getElementById("analysisSelection");

const analysisStartHandle = document.getElementById("analysisStartHandle");

const analysisEndHandle = document.getElementById("analysisEndHandle");

const analysisStartTime = document.getElementById("analysisStartTime");

const analysisEndTime = document.getElementById("analysisEndTime");

const analysisMode = document.getElementById("analysisMode");

const analysisModeControl = document.getElementById("analysisModeControl");

const analysisModeMenu = document.getElementById("analysisModeMenu");

const analysisRunButton = document.getElementById("analysisRunButton");

const analysisBusyOverlay = document.getElementById("analysisBusyOverlay");

const tapConfidence = document.getElementById("tapConfidence");

const tapKey = document.getElementById("tapKey");

const analysisWaveformCanvas = document.getElementById(
    "analysisWaveformCanvas",
);

/* =========================================================
   APPLICATION MODULES
   ========================================================= */

const tapEngine = new TapEngine();

const trackAnalyzer = new TrackAnalyzer();

const tapKeyController = new TapKeyController({
    control: tapKeyControl,
    value: tapKeyValue,
});

const waveform = createWaveformRenderer(analysisWaveformCanvas);

/* =========================================================
   LOCAL HELPERS
   ========================================================= */

/**
 * Get current language.
 *
 * @returns {string}
 */
function getCurrentLanguage() {
    const language = settings.get("language");

    if (supportedLanguages.includes(language)) {
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
    if (!Number.isFinite(value)) {
        return "-";
    }

    const language = getCurrentLanguage();

    return formatDecimal(Number(value.toFixed(2)), language);
}

/* =========================================================
   AUDIO FILE PICKER
   ========================================================= */

const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".flac", ".aif", ".aiff"];

const SUPPORTED_AUDIO_MIME_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/aiff",
    "audio/x-aiff",
];

/**
 * Check whether a file has a supported extension.
 *
 * @param {File} file
 * @returns {boolean}
 */
function hasSupportedAudioExtension(file) {
    if (!(file instanceof File)) {
        return false;
    }

    const fileName = file.name.toLowerCase();

    return SUPPORTED_AUDIO_EXTENSIONS.some((extension) => {
        return fileName.endsWith(extension);
    });
}

/**
 * Check whether a file has a supported MIME type.
 *
 * @param {File} file
 * @returns {boolean}
 */
function hasSupportedAudioMimeType(file) {
    if (!(file instanceof File)) {
        return false;
    }

    if (!file.type) {
        return true;
    }

    return SUPPORTED_AUDIO_MIME_TYPES.includes(file.type.toLowerCase());
}

/**
 * Validate selected audio file.
 *
 * @param {File} file
 * @returns {boolean}
 */
function isSupportedAudioFile(file) {
    return hasSupportedAudioExtension(file) && hasSupportedAudioMimeType(file);
}

/**
 * Create hidden audio file input.
 *
 * @returns {HTMLInputElement}
 */
function createAudioFileInput() {
    const input = document.createElement("input");

    input.type = "file";

    input.multiple = false;

    input.accept =
        ".mp3,.wav,.flac,.aif,.aiff," +
        "audio/mpeg,audio/wav,audio/x-wav," +
        "audio/flac,audio/aiff,audio/x-aiff";

    input.style.display = "none";

    document.body.appendChild(input);

    return input;
}

const audioFileInput = createAudioFileInput();

/* =========================================================
   AUDIO ANALYSIS PANEL STATE
   ========================================================= */

let selectedAudioFile = null;

let selectedAudioBuffer = null;

let analysisDuration = 0;

let analysisStartRatio = 0;

let analysisEndRatio = 1;

let analysisModeValueCurrent = "full";

let activeAnalysisHandle = null;

let isAnalysisRunning = false;

/* =========================================================
   AUDIO ANALYSIS PANEL HELPERS
   ========================================================= */

/**
 * Format seconds as MM:SS.t
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatAnalysisTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "--:--.-";
    }

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds - minutes * 60;

    const wholeSeconds = Math.floor(remainingSeconds);

    const tenth = Math.floor((remainingSeconds - wholeSeconds) * 10);

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(wholeSeconds).padStart(2, "0")}.` +
        `${tenth}`
    );
}

/**
 * Update analysis range UI.
 */
function updateAnalysisRangeUI() {
    const startPercent = analysisStartRatio * 100;

    const endPercent = analysisEndRatio * 100;

    analysisStartHandle.style.left = `${startPercent}%`;

    analysisEndHandle.style.left = `calc(${endPercent}% - 1px)`;

    analysisSelection.style.left = `${startPercent}%`;

    analysisSelection.style.width = `${Math.max(
        0,
        endPercent - startPercent,
    )}%`;

    analysisOverlayLeft.style.width = `${startPercent}%`;

    analysisOverlayRight.style.width = `${Math.max(0, 100 - endPercent)}%`;

    const startTime = analysisDuration * analysisStartRatio;

    const endTime = analysisDuration * analysisEndRatio;

    analysisStartTime.textContent = formatAnalysisTime(startTime);

    analysisEndTime.textContent = formatAnalysisTime(endTime);
}

/**
 * Apply analysis mode in the application layer.
 *
 * @param {string} mode
 */
function applyAnalysisMode(mode) {
    if (!["full", "selection", "fast"].includes(mode)) {
        return;
    }

    analysisModeValueCurrent = mode;

    analysisPanel.classList.toggle("analysis-panel--fast", mode === "fast");

    if (mode === "full" || mode === "fast") {
        analysisStartRatio = 0;

        analysisEndRatio = 1;

        updateAnalysisRangeUI();
    }
}

/**
 * Open analysis panel.
 */
function openAnalysisPanel() {
    analysisPanel.setAttribute("aria-hidden", "false");

    document.querySelector(".app-window").classList.add("analysis-panel-open");
}

/**
 * Close analysis panel.
 */
function closeAnalysisPanel() {
    analysisPanel.setAttribute("aria-hidden", "true");

    document
        .querySelector(".app-window")
        .classList.remove("analysis-panel-open");

    activeAnalysisHandle = null;
}

/**
 * Load audio duration only.
 *
 * @param {File} file
 * @returns {Promise<number>}
 */
function loadAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);

        const audio = new Audio();

        audio.preload = "metadata";

        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);

            audio.removeAttribute("src");

            audio.load();
        };

        audio.onloadedmetadata = () => {
            const duration = Number(audio.duration);

            cleanup();

            if (Number.isFinite(duration) && duration > 0) {
                resolve(duration);

                return;
            }

            reject(new Error("WM Tapper: could not determine audio duration."));
        };

        audio.onerror = () => {
            cleanup();

            reject(new Error("WM Tapper: could not load audio metadata."));
        };

        audio.src = objectUrl;
    });
}

/**
 * Set analysis button busy state.
 *
 * @param {boolean} state
 */
function setAnalysisRunning(state) {
    isAnalysisRunning = state;

    analysisRunButton.disabled = state;

    analysisRunButton.classList.toggle("is-analyzing", state);

    analysisBusyOverlay.classList.toggle("is-visible", state);

    analysisPanel.classList.toggle("analysis-panel--busy", state);

    analysisBusyOverlay.setAttribute("aria-hidden", state ? "false" : "true");

    if (state) {
        analysisRunButton.dataset.previousText = analysisRunButton.textContent;

        analysisRunButton.textContent = "ANALYZING...";

        return;
    }

    const previousText = analysisRunButton.dataset.previousText;

    if (previousText) {
        analysisRunButton.textContent = previousText;

        delete analysisRunButton.dataset.previousText;
    }
}

/* =========================================================
   ANALYSIS HANDLE DRAGGING
   ========================================================= */

/**
 * Start dragging one analysis handle.
 *
 * @param {string} handle
 * @param {PointerEvent} event
 */
function startAnalysisHandleDrag(handle, event) {
    if (isAnalysisRunning || analysisModeValueCurrent === "fast") {
        return;
    }

    activeAnalysisHandle = handle;

    event.preventDefault();
}

/**
 * Update dragged analysis handle.
 *
 * @param {PointerEvent} event
 */
function updateAnalysisHandleDrag(event) {
    if (
        isAnalysisRunning ||
        !activeAnalysisHandle ||
        analysisModeValueCurrent === "fast"
    ) {
        return;
    }

    const rect = analysisWaveform.getBoundingClientRect();

    if (rect.width <= 0) {
        return;
    }

    let ratio = (event.clientX - rect.left) / rect.width;

    ratio = Math.max(0, Math.min(1, ratio));

    const minimumRange =
        analysisDuration > 0 ? Math.min(0.001, 0.5 / analysisDuration) : 0.001;

    if (activeAnalysisHandle === "start") {
        analysisStartRatio = Math.min(ratio, analysisEndRatio - minimumRange);

        analysisStartRatio = Math.max(0, analysisStartRatio);

        if (analysisModeValueCurrent !== "selection") {
            applyAnalysisMode("selection");

            dropdowns.setAnalysisMode("selection");
        }

        updateAnalysisRangeUI();

        return;
    }

    if (activeAnalysisHandle === "end") {
        analysisEndRatio = Math.max(ratio, analysisStartRatio + minimumRange);

        analysisEndRatio = Math.min(1, analysisEndRatio);

        if (analysisModeValueCurrent !== "selection") {
            applyAnalysisMode("selection");

            dropdowns.setAnalysisMode("selection");
        }

        updateAnalysisRangeUI();
    }
}

/**
 * Finish dragging analysis handle.
 */
function endAnalysisHandleDrag() {
    activeAnalysisHandle = null;
}

analysisStartHandle.addEventListener("pointerdown", (event) => {
    startAnalysisHandleDrag("start", event);
});

analysisEndHandle.addEventListener("pointerdown", (event) => {
    startAnalysisHandleDrag("end", event);
});

document.addEventListener("pointermove", (event) => {
    updateAnalysisHandleDrag(event);
});

document.addEventListener("pointerup", () => {
    endAnalysisHandleDrag();
});

/* =========================================================
   APPLICATION DROPDOWNS
   ========================================================= */

const dropdowns = createDropdownController(
    {
        sessionControl,
        sessionMenu,

        historyControl,
        historyMenu,

        analysisMode,
        analysisModeControl,
        analysisModeMenu,
    },
    {
        onSessionChange: (value) => {
            settings.set("sessionTimeout", value);

            tapEngine.configure({
                sessionTimeout: settings.get("sessionTimeout"),

                historyLength: settings.get("historyLength"),
            });

            languageUI.updateSessionDisplay();
        },

        onHistoryChange: (value) => {
            settings.set("historyLength", value);

            tapEngine.configure({
                sessionTimeout: settings.get("sessionTimeout"),

                historyLength: settings.get("historyLength"),
            });

            languageUI.updateHistoryDisplay();
        },

        onAnalysisModeChange: (mode) => {
            if (isAnalysisRunning) {
                return;
            }

            applyAnalysisMode(mode);
        },
    },
);

/* =========================================================
   TAP UI
   ========================================================= */

const tapUI = createTapUI(
    {
        tapValue,
        averageValue,
        tapHistory,
    },
    {
        tapEngine,
        getCurrentLanguage,
        formatBpm,
        getTranslations,
    },
);

/* =========================================================
   LANGUAGE UI
   ========================================================= */

const languageUI = createLanguageUI(
    {
        languageSwitcher,
        averageLabel,
        resetButton,
        analyzeButton,
        analysisRunButton,
        analysisModeValue,
        analysisModeMenu,
        settingsHeader,
        tapKeyLabel,
        sessionLabel,
        historyLabel,
        languageLabel,
        madeByText,
        sessionValue,
        sessionMenu,
        historyValue,
        historyMenu,
        tapConfidence,
        tapKey,
    },
    {
        settings,
        supportedLanguages,
        getTranslations,
        formatDecimal,
        formatAnalysisKey,
        formatConfidence,
        tapKeyController,
        tapUI,
        dropdowns,
    },
);

/* =========================================================
   AUDIO FILE SELECTION
   ========================================================= */

audioFileInput.addEventListener("change", async () => {
    const file = audioFileInput.files?.[0];

    if (!file) {
        audioFileInput.value = "";

        return;
    }

    if (!isSupportedAudioFile(file)) {
        console.warn(
            "WM Tapper: unsupported audio file.",
            file.name,
            file.type,
        );

        audioFileInput.value = "";

        return;
    }

    console.log("WM Tapper: audio file selected.", {
        name: file.name,

        type: file.type,

        size: file.size,
    });

    await prepareAnalysisPanel(file);

    audioFileInput.value = "";
});

/* =========================================================
   ANALYZE FILE BUTTON
   ========================================================= */

analyzeButton.addEventListener("click", () => {
    if (isAnalysisRunning) {
        return;
    }

    audioFileInput.click();
});

/* =========================================================
   ANALYSIS PANEL PREPARATION
   ========================================================= */

/**
 * Prepare analysis panel for selected file.
 *
 * No Essentia analysis is started here.
 *
 * @param {File} file
 * @returns {Promise<void>}
 */
async function prepareAnalysisPanel(file) {
    selectedAudioFile = file;

    selectedAudioBuffer = null;

    analysisDuration = 0;

    analysisStartRatio = 0;

    analysisEndRatio = 1;

    applyAnalysisMode("full");

    dropdowns.setAnalysisMode("full");

    waveform.clear();

    updateAnalysisRangeUI();

    openAnalysisPanel();

    try {
        console.log("WM Tapper: decoding waveform...");

        selectedAudioBuffer = await decodeAudioFile(file);

        analysisDuration = selectedAudioBuffer.duration;

        const peaks = extractPeaks(selectedAudioBuffer, 120);

        waveform.setPeaks(peaks);

        updateAnalysisRangeUI();

        console.log("WM Tapper: waveform ready.", {
            duration: selectedAudioBuffer.duration,

            sampleRate: selectedAudioBuffer.sampleRate,

            channels: selectedAudioBuffer.numberOfChannels,

            peaks: peaks.length,
        });
    } catch (error) {
        console.error("WM Tapper: failed to prepare waveform.", error);

        try {
            analysisDuration = await loadAudioDuration(file);

            updateAnalysisRangeUI();
        } catch (durationError) {
            console.error(
                "WM Tapper: failed to read audio duration.",
                durationError,
            );
        }
    }
}

/* =========================================================
   ANALYSIS RUN BUTTON
   ========================================================= */

analysisRunButton.addEventListener("click", async () => {
    if (isAnalysisRunning || !selectedAudioFile) {
        return;
    }

    if (!Number.isFinite(analysisDuration) || analysisDuration <= 0) {
        console.error("WM Tapper: analysis duration is unavailable.");

        return;
    }

    const startTime = analysisDuration * analysisStartRatio;

    const endTime = analysisDuration * analysisEndRatio;

    console.log("WM Tapper: starting analysis.", {
        file: selectedAudioFile.name,

        mode: analysisModeValueCurrent,

        startTime,

        endTime,

        duration: analysisDuration,
    });

    setAnalysisRunning(true);

    try {
        /*
         * Give the browser one frame so the
         * ANALYZING state is painted before
         * the heavy synchronous work begins.
         */

        await new Promise((resolve) => {
            requestAnimationFrame(() => resolve());
        });

        const result = await trackAnalyzer.analyze(selectedAudioFile, {
            mode: analysisModeValueCurrent,

            startTime,

            endTime,

            duration: analysisDuration,

            audioBuffer: selectedAudioBuffer,
        });

        console.log("WM Tapper: analysis result.", result);

        if (result && Number.isFinite(result.bpm)) {
            tapValue.textContent = `${Math.round(result.bpm)} BPM`;
        }

        languageUI.updateAnalysisResult(result);

        /*
         * Keep the result available for the
         * next UI stage.
         */

        window.WMTapperLastAnalysis = result;

        closeAnalysisPanel();
    } catch (error) {
        console.error("WM Tapper: analysis failed.", error);
    } finally {
        setAnalysisRunning(false);
    }
});

/* =========================================================
   SESSION
   ========================================================= */

const session = createSessionController({
    tapEngine,

    onSessionFinished: (averageBpm) => {
        tapUI.showFinalBpm(averageBpm);
    },
});

/* =========================================================
   TAP RESULT
   ========================================================= */

function handleTap() {
    languageUI.updateAnalysisResult(null);

    if (isAnalysisRunning) {
        return;
    }

    session.clear();

    const result = tapEngine.registerTap();

    if (result.isNewSession) {
        tapUI.showTap();

        tapUI.showAverageBpm(null);
    }

    if (Number.isFinite(result.bpm)) {
        tapUI.showCurrentBpm(result.bpm);
    }

    tapUI.showAverageBpm(result.averageBpm);

    if (Array.isArray(result.history) && result.history.length > 0) {
        session.restart(Number(settings.get("sessionTimeout")));
    }

    tapUI.renderTapHistory(result.history);
}

/* =========================================================
   TAP BUTTON
   ========================================================= */

tapButton.addEventListener("click", () => {
    handleTap();
});

/* =========================================================
   SETTINGS FLIP
   ========================================================= */

settingsButton.addEventListener("click", () => {
    if (isAnalysisRunning) {
        return;
    }

    closeAnalysisPanel();

    dropdowns.closeAll();

    flipCard.classList.toggle("is-flipped");

    languageUI.updateLanguageButtons(languageUI.getCurrentLanguage());
});

/* =========================================================
   RESET
   ========================================================= */

resetButton.addEventListener("click", () => {
    if (isAnalysisRunning) {
        return;
    }

    languageUI.updateAnalysisResult(null);

    session.reset();

    tapEngine.reset();

    tapUI.reset();

    selectedAudioFile = null;

    selectedAudioBuffer = null;

    analysisDuration = 0;

    analysisStartRatio = 0;

    analysisEndRatio = 1;

    applyAnalysisMode("full");

    dropdowns.setAnalysisMode("full");

    waveform.clear();

    updateAnalysisRangeUI();

    closeAnalysisPanel();
});

/* =========================================================
   PREVENT SPACE SCROLLING
   ========================================================= */

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !tapKeyController.isCapturing) {
        event.preventDefault();
    }
});

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {
    settings.load();

    tapEngine.configure({
        sessionTimeout: settings.get("sessionTimeout"),

        historyLength: settings.get("historyLength"),
    });

    tapKeyController.initialize();

    languageUI.applyLanguage(languageUI.getCurrentLanguage());

    languageUI.updateLanguageButtons(languageUI.getCurrentLanguage());

    applyAnalysisMode("full");

    dropdowns.setAnalysisMode("full");
}

/* =========================================================
   START APPLICATION
   ========================================================= */

initialize();
