/* =========================================================
   WM TAPPER
   Track Analyzer
   ========================================================= */

/* =========================================================
   IMPORTS
   ========================================================= */

import Essentia from "../lib/essentia/essentia.js-core.es.js";

/* =========================================================
   CONSTANTS
   ========================================================= */

const ESSENTIA_WASM_SCRIPT = "./lib/essentia/essentia-wasm.web.js";

const TARGET_SAMPLE_RATE = 44100;

const RHYTHM_MAX_TEMPO = 208;

const RHYTHM_MIN_TEMPO = 100; // WAS 40

const RHYTHM_METHOD = "multifeature";

/*
 * FAST mode.
 *
 * We analyze several representative parts of the track
 * instead of the complete file.
 */

const FAST_SEGMENT_COUNT = 4;

const FAST_SEGMENT_DURATION = 25;

/* =========================================================
   ESSENTIA INITIALIZATION
   ========================================================= */

let essentiaInstance = null;

let essentiaWasmPromise = null;

/**
 * Load the Essentia WASM backend.
 *
 * @returns {Promise<Object>}
 */
function loadEssentiaWasm() {
    if (essentiaWasmPromise) {
        return essentiaWasmPromise;
    }

    essentiaWasmPromise = new Promise((resolve, reject) => {
        /*
         * Essentia WASM script has already been loaded.
         */

        if (typeof globalThis.EssentiaWASM === "function") {
            globalThis.EssentiaWASM().then(resolve).catch(reject);

            return;
        }

        /*
         * Create script element.
         */

        const script = document.createElement("script");

        script.src = ESSENTIA_WASM_SCRIPT;

        script.async = true;

        script.onload = () => {
            if (typeof globalThis.EssentiaWASM !== "function") {
                reject(
                    new Error(
                        "WM Tapper: EssentiaWASM function was not found.",
                    ),
                );

                return;
            }

            globalThis.EssentiaWASM().then(resolve).catch(reject);
        };

        script.onerror = () => {
            reject(
                new Error("WM Tapper: failed to load Essentia WASM backend."),
            );
        };

        document.head.appendChild(script);
    });

    return essentiaWasmPromise;
}

/**
 * Get a shared Essentia instance.
 *
 * @returns {Promise<Essentia>}
 */
async function getEssentia() {
    if (essentiaInstance) {
        return essentiaInstance;
    }

    const wasmModule = await loadEssentiaWasm();

    essentiaInstance = new Essentia(wasmModule);

    return essentiaInstance;
}

/* =========================================================
   AUDIO DECODING
   ========================================================= */

/**
 * Decode an audio file using Web Audio API.
 *
 * @param {File} file
 * @returns {Promise<AudioBuffer>}
 */
async function decodeAudioFile(file) {
    const arrayBuffer = await file.arrayBuffer();

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        throw new Error("WM Tapper: Web Audio API is not supported.");
    }

    const audioContext = new AudioContextClass();

    try {
        return await audioContext.decodeAudioData(arrayBuffer);
    } finally {
        await audioContext.close();
    }
}

/* =========================================================
   RESAMPLING
   ========================================================= */

/**
 * Resample the requested audio range to 44100 Hz.
 *
 * The source audio remains untouched. OfflineAudioContext
 * renders the requested range down to a mono Float32Array.
 *
 * @param {AudioBuffer} sourceBuffer
 * @param {number} startTime
 * @param {number} endTime
 * @returns {Promise<Float32Array>}
 */
async function resampleRangeTo44100(
    sourceBuffer,
    startTime = 0,
    endTime = sourceBuffer.duration,
) {
    const sourceDuration = sourceBuffer.duration;

    let safeStartTime = Number(startTime);

    let safeEndTime = Number(endTime);

    if (!Number.isFinite(safeStartTime)) {
        safeStartTime = 0;
    }

    if (!Number.isFinite(safeEndTime)) {
        safeEndTime = sourceDuration;
    }

    safeStartTime = Math.max(0, Math.min(sourceDuration, safeStartTime));

    safeEndTime = Math.max(
        safeStartTime,
        Math.min(sourceDuration, safeEndTime),
    );

    const duration = safeEndTime - safeStartTime;

    if (duration <= 0) {
        throw new Error("WM Tapper: selected audio range is empty.");
    }

    const targetLength = Math.max(1, Math.ceil(duration * TARGET_SAMPLE_RATE));

    const offlineContext = new OfflineAudioContext(
        1,
        targetLength,
        TARGET_SAMPLE_RATE,
    );

    const source = offlineContext.createBufferSource();

    source.buffer = sourceBuffer;

    source.connect(offlineContext.destination);

    source.start(0, safeStartTime, duration);

    const renderedBuffer = await offlineContext.startRendering();

    return renderedBuffer.getChannelData(0);
}

/* =========================================================
   ESSENTIA ANALYSIS
   ========================================================= */

/**
 * Analyze one mono Float32Array.
 *
 * @param {Object} essentia
 * @param {Float32Array} signal
 * @returns {Promise<Object>}
 */
async function analyzeSignal(essentia, signal) {
    if (!signal || !signal.length) {
        throw new Error("WM Tapper: analysis signal is empty.");
    }

	const signalVector = essentia.arrayToVector(signal);

try {
    const percivalResult = essentia.PercivalBpmEstimator(
        signalVector,
        1024,
        2048,
        128,
        128,
        RHYTHM_MAX_TEMPO,
        RHYTHM_MIN_TEMPO,
        TARGET_SAMPLE_RATE,
    );

    console.log("WM Tapper: PERCIVAL BPM.", {
        bpm: percivalResult?.bpm,
    });

    /* -------------------------------------------------
       BPM
       ------------------------------------------------- */

    const rhythmResult = essentia.RhythmDescriptors(signalVector);

    console.log("WM Tapper: RHYTHM HISTOGRAM.", {
        firstPeakBpm: rhythmResult?.first_peak_bpm,
        firstPeakWeight: rhythmResult?.first_peak_weight,
        secondPeakBpm: rhythmResult?.second_peak_bpm,
        secondPeakWeight: rhythmResult?.second_peak_weight,

        histogramAt92:
            rhythmResult?.histogram?.get
                ? rhythmResult.histogram.get(92)
                : null,

        histogramAt185:
            rhythmResult?.histogram?.get
                ? rhythmResult.histogram.get(185)
                : null,

        histogramObject: rhythmResult?.histogram,
    });

    console.log("WM Tapper: RHYTHM DESCRIPTORS RAW.", rhythmResult);

    console.log(
        "WM Tapper: RHYTHM DESCRIPTORS KEYS.",
        Object.keys(rhythmResult || {}),
    );

    console.log("WM Tapper: rhythm descriptors.", {
        bpm: rhythmResult?.bpm,
        confidence: rhythmResult?.confidence,

        bpmEstimates: rhythmResult?.bpm_estimates
            ? Array.from(rhythmResult.bpm_estimates)
            : [],

        bpmIntervals: rhythmResult?.bpm_intervals
            ? Array.from(rhythmResult.bpm_intervals)
            : [],

        firstPeakBpm: rhythmResult?.first_peak_bpm,
        firstPeakWeight: rhythmResult?.first_peak_weight,
        firstPeakSpread: rhythmResult?.first_peak_spread,

        secondPeakBpm: rhythmResult?.second_peak_bpm,
        secondPeakWeight: rhythmResult?.second_peak_weight,
        secondPeakSpread: rhythmResult?.second_peak_spread,
    });

    console.log("WM Tapper: rhythm raw result.", {
        bpm: rhythmResult?.bpm,
        confidence: rhythmResult?.confidence,

        estimates: rhythmResult?.estimates
            ? Array.from(rhythmResult.estimates)
            : [],

        bpmIntervals: rhythmResult?.bpmIntervals
            ? Array.from(rhythmResult.bpmIntervals)
            : [],
    });

        /* -------------------------------------------------
           KEY
           ------------------------------------------------- */

        const keyResult = essentia.KeyExtractor(signalVector);

        const bpm = Number(rhythmResult?.bpm);

        const key = typeof keyResult?.key === "string" ? keyResult.key : null;

        const scale =
            typeof keyResult?.scale === "string" ? keyResult.scale : null;

        const strength = Number(keyResult?.strength);

        const rhythmConfidence = Number(rhythmResult?.confidence);

        return {
            bpm: Number.isFinite(bpm) ? bpm : null,

            key,

            scale,

            strength: Number.isFinite(strength) ? strength : null,

            rhythmConfidence: Number.isFinite(rhythmConfidence)
                ? rhythmConfidence
                : null,
        };
    } finally {
        if (signalVector && typeof signalVector.delete === "function") {
            signalVector.delete();
        }
    }
}

/* =========================================================
   FAST MODE HELPERS
   ========================================================= */

/**
 * Create representative analysis ranges for FAST mode.
 *
 * The segments are spread across the track so that a long
 * intro, breakdown, drop and outro are not all treated as
 * the same part of the song.
 *
 * @param {number} duration
 * @returns {Array<{startTime:number,endTime:number}>}
 */
function createFastSegments(duration) {
    if (!Number.isFinite(duration) || duration <= 0) {
        return [];
    }

    const segmentDuration = Math.min(FAST_SEGMENT_DURATION, duration);

    if (duration <= segmentDuration) {
        return [
            {
                startTime: 0,
                endTime: duration,
            },
        ];
    }

    const positions = [0.12, 0.37, 0.62, 0.87];

    const segments = [];

    for (
        let index = 0;
        index < Math.min(FAST_SEGMENT_COUNT, positions.length);
        index += 1
    ) {
        const center = duration * positions[index];

        let startTime = center - segmentDuration / 2;

        let endTime = center + segmentDuration / 2;

        if (startTime < 0) {
            startTime = 0;

            endTime = segmentDuration;
        }

        if (endTime > duration) {
            endTime = duration;

            startTime = duration - segmentDuration;
        }

        segments.push({
            startTime,
            endTime,
        });
    }

    return segments;
}

/**
 * Calculate the median of finite numeric values.
 *
 * @param {number[]} values
 * @returns {number|null}
 */
function calculateMedian(values) {
    const finiteValues = values
        .filter((value) => {
            return Number.isFinite(value);
        })
        .sort((left, right) => {
            return left - right;
        });

    if (finiteValues.length === 0) {
        return null;
    }

    const middle = Math.floor(finiteValues.length / 2);

    if (finiteValues.length % 2 === 0) {
        return (finiteValues[middle - 1] + finiteValues[middle]) / 2;
    }

    return finiteValues[middle];
}

/**
 * Choose the strongest key result.
 *
 * @param {Object[]} results
 * @returns {Object|null}
 */
function selectBestKeyResult(results) {
    const validResults = results.filter((result) => {
        return result && result.key && result.scale;
    });

    if (validResults.length === 0) {
        return null;
    }

    validResults.sort((left, right) => {
        const leftStrength = Number.isFinite(left.strength)
            ? left.strength
            : -Infinity;

        const rightStrength = Number.isFinite(right.strength)
            ? right.strength
            : -Infinity;

        return rightStrength - leftStrength;
    });

    return validResults[0];
}

/**
 * Choose the strongest BPM result.
 *
 * @param {Object[]} results
 * @returns {number|null}
 */
function selectBpmResult(results) {
    const validResults = results.filter((result) => {
        return result && Number.isFinite(result.bpm);
    });

    if (validResults.length === 0) {
        return null;
    }

    /*
     * Median is deliberately used instead of an average.
     *
     * A single bad segment should not drag the final BPM
     * toward an incorrect value.
     */

    return calculateMedian(
        validResults.map((result) => {
            return result.bpm;
        }),
    );
}

/* =========================================================
   RESULT NORMALIZATION
   ========================================================= */

/**
 * Normalize raw Essentia result.
 *
 * @param {Object} result
 * @param {string} mode
 * @returns {Object}
 */
function normalizeResult(result, mode) {
    return {
        bpm: Number.isFinite(result?.bpm) ? result.bpm : null,

        key: typeof result?.key === "string" ? result.key : null,

        scale: typeof result?.scale === "string" ? result.scale : null,

        keyLabel:
            result?.key && result?.scale
                ? `${result.key} ${result.scale}`
                : null,

        strength: Number.isFinite(result?.strength) ? result.strength : null,

        rhythmConfidence: Number.isFinite(result?.rhythmConfidence)
            ? result.rhythmConfidence
            : null,

        mode,
    };
}

/* =========================================================
   TRACK ANALYZER
   ========================================================= */

export class TrackAnalyzer {
    constructor() {
        this.isAnalyzing = false;
    }

    /**
     * Analyze an audio file.
     *
     * @param {File} file
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async analyze(file, options = {}) {
        if (!(file instanceof File)) {
            throw new TypeError("WM Tapper: expected an audio File.");
        }

        if (this.isAnalyzing) {
            throw new Error(
                "WM Tapper: an audio analysis is already in progress.",
            );
        }

        this.isAnalyzing = true;

        try {
            const mode = ["full", "selection", "fast"].includes(options?.mode)
                ? options.mode
                : "full";

            const providedAudioBuffer = options?.audioBuffer;

            /* -------------------------------------------------
               Essentia
               ------------------------------------------------- */

            console.log("WM Tapper: loading Essentia...");

            const essentia = await getEssentia();

            /* -------------------------------------------------
               Audio buffer
               ------------------------------------------------- */

            let decodedBuffer = providedAudioBuffer;

            if (!decodedBuffer) {
                console.log("WM Tapper: decoding audio...", file.name);

                decodedBuffer = await decodeAudioFile(file);
            }

            console.log("WM Tapper: decoded audio.", {
                duration: decodedBuffer.duration,

                sampleRate: decodedBuffer.sampleRate,

                channels: decodedBuffer.numberOfChannels,
            });

            const duration = Number(decodedBuffer.duration);

            if (!Number.isFinite(duration) || duration <= 0) {
                throw new Error(
                    "WM Tapper: decoded audio has invalid duration.",
                );
            }

            /* =================================================
               FULL
               ================================================= */

            if (mode === "full") {
                console.log("WM Tapper: analyzing FULL track.");

                const signal = await resampleRangeTo44100(
                    decodedBuffer,
                    0,
                    duration,
                );

                console.log("WM Tapper: running Essentia analysis...");

                const result = await analyzeSignal(essentia, signal);

                const normalizedResult = normalizeResult(result, "full");

                console.log("WM Tapper: analysis complete.", normalizedResult);

                return normalizedResult;
            }

            /* =================================================
               SELECTION
               ================================================= */

            if (mode === "selection") {
                let startTime = Number(options?.startTime);

                let endTime = Number(options?.endTime);

                if (!Number.isFinite(startTime)) {
                    startTime = 0;
                }

                if (!Number.isFinite(endTime)) {
                    endTime = duration;
                }

                startTime = Math.max(0, Math.min(duration, startTime));

                endTime = Math.max(startTime, Math.min(duration, endTime));

                if (endTime - startTime <= 0.5) {
                    throw new Error(
                        "WM Tapper: selected range is too short for analysis.",
                    );
                }

                console.log("WM Tapper: analyzing SELECTION.", {
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                });

                const signal = await resampleRangeTo44100(
                    decodedBuffer,
                    startTime,
                    endTime,
                );

                console.log("WM Tapper: running Essentia analysis...");

                const result = await analyzeSignal(essentia, signal);

                const normalizedResult = normalizeResult(result, "selection");

                console.log("WM Tapper: analysis complete.", normalizedResult);

                return normalizedResult;
            }

            /* =================================================
               FAST
               ================================================= */

            const segments = createFastSegments(duration);

            if (segments.length === 0) {
                throw new Error(
                    "WM Tapper: could not create FAST analysis segments.",
                );
            }

            console.log("WM Tapper: analyzing FAST mode.", segments);

            const segmentResults = [];

            for (let index = 0; index < segments.length; index += 1) {
                const segment = segments[index];

                console.log("WM Tapper: FAST segment.", {
                    index: index + 1,

                    total: segments.length,

                    startTime: segment.startTime,

                    endTime: segment.endTime,
                });

                const signal = await resampleRangeTo44100(
                    decodedBuffer,
                    segment.startTime,
                    segment.endTime,
                );

                const result = await analyzeSignal(essentia, signal);

                segmentResults.push(result);
            }

            const bpm = selectBpmResult(segmentResults);

            const bestKey = selectBestKeyResult(segmentResults);

            const confidenceValues = segmentResults
                .map((result) => {
                    return result?.rhythmConfidence;
                })
                .filter((value) => {
                    return Number.isFinite(value);
                });

            const normalizedResult = normalizeResult(
                {
                    bpm,

                    key: bestKey?.key ?? null,

                    scale: bestKey?.scale ?? null,

                    strength: bestKey?.strength ?? null,

                    rhythmConfidence: calculateMedian(confidenceValues),
                },
                "fast",
            );

            console.log("WM Tapper: analysis complete.", {
                ...normalizedResult,

                segments: segmentResults,
            });

            return normalizedResult;
        } catch (error) {
            console.error("WM Tapper: audio analysis failed.", error);

            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
}
