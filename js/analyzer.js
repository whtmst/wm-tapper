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

const ESSENTIA_WASM_SCRIPT =
    "./lib/essentia/essentia-wasm.web.js";


const TARGET_SAMPLE_RATE =
    44100;


const RHYTHM_MAX_TEMPO =
    208;


const RHYTHM_MIN_TEMPO =
    40;


const RHYTHM_METHOD =
    "multifeature";


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

    if (
        essentiaWasmPromise
    ) {

        return essentiaWasmPromise;
    }


    essentiaWasmPromise =
        new Promise(
            (
                resolve,
                reject
            ) => {

                /*
                 * Essentia WASM script has already been loaded.
                 */

                if (
                    typeof globalThis.EssentiaWASM ===
                    "function"
                ) {

                    globalThis.EssentiaWASM()
                        .then(resolve)
                        .catch(reject);

                    return;
                }


                /*
                 * Create script element.
                 */

                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    ESSENTIA_WASM_SCRIPT;


                script.async =
                    true;


                script.onload =
                    () => {

                        if (
                            typeof globalThis.EssentiaWASM !==
                            "function"
                        ) {

                            reject(
                                new Error(
                                    "WM Tapper: EssentiaWASM function was not found."
                                )
                            );

                            return;
                        }


                        globalThis.EssentiaWASM()
                            .then(resolve)
                            .catch(reject);
                    };


                script.onerror =
                    () => {

                        reject(
                            new Error(
                                "WM Tapper: failed to load Essentia WASM backend."
                            )
                        );
                    };


                document.head.appendChild(
                    script
                );
            }
        );


    return essentiaWasmPromise;
}


/**
 * Get a shared Essentia instance.
 *
 * @returns {Promise<Essentia>}
 */
async function getEssentia() {

    if (
        essentiaInstance
    ) {

        return essentiaInstance;
    }


    const wasmModule =
        await loadEssentiaWasm();


    essentiaInstance =
        new Essentia(
            wasmModule
        );


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

    const arrayBuffer =
        await file.arrayBuffer();


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (
        !AudioContextClass
    ) {

        throw new Error(
            "WM Tapper: Web Audio API is not supported."
        );
    }


    const audioContext =
        new AudioContextClass();


    try {

        return await audioContext.decodeAudioData(
            arrayBuffer
        );

    } finally {

        await audioContext.close();
    }
}


/* =========================================================
   RESAMPLING
   ========================================================= */

/**
 * Resample decoded audio to 44100 Hz.
 *
 * RhythmExtractor2013 requires 44100 Hz.
 *
 * @param {AudioBuffer} sourceBuffer
 * @returns {Promise<Float32Array>}
 */
async function resampleTo44100(
    sourceBuffer
) {

    const targetLength =
        Math.ceil(
            sourceBuffer.duration *
            TARGET_SAMPLE_RATE
        );


    if (
        targetLength <= 0
    ) {

        throw new Error(
            "WM Tapper: audio duration is empty."
        );
    }


    const offlineContext =
        new OfflineAudioContext(
            1,
            targetLength,
            TARGET_SAMPLE_RATE
        );


    const source =
        offlineContext.createBufferSource();


    source.buffer =
        sourceBuffer;


    source.connect(
        offlineContext.destination
    );


    source.start(
        0
    );


    const renderedBuffer =
        await offlineContext.startRendering();


    return renderedBuffer.getChannelData(
        0
    );
}


/* =========================================================
   ANALYSIS
   ========================================================= */

/**
 * Analyze one audio file.
 *
 * @param {File} file
 * @returns {Promise<Object>}
 */
async function analyzeDecodedAudio(
    essentia,
    signal
) {

    /*
     * Convert Float32Array to Essentia VectorFloat.
     */

    const signalVector =
        essentia.arrayToVector(
            signal
        );


    try {

        /* -------------------------------------------------
           BPM
           ------------------------------------------------- */

        const rhythmResult =
            essentia.RhythmExtractor2013(
                signalVector,
                RHYTHM_MAX_TEMPO,
                RHYTHM_METHOD,
                RHYTHM_MIN_TEMPO
            );


        /* -------------------------------------------------
           KEY
           ------------------------------------------------- */

        const keyResult =
            essentia.KeyExtractor(
                signalVector
            );


        const bpm =
            Number(
                rhythmResult?.bpm
            );


        const key =
            typeof keyResult?.key ===
            "string"
                ? keyResult.key
                : null;


        const scale =
            typeof keyResult?.scale ===
            "string"
                ? keyResult.scale
                : null;


        const strength =
            Number(
                keyResult?.strength
            );


        return {

            bpm:
                Number.isFinite(bpm)
                    ? bpm
                    : null,

            key,

            scale,

            strength:
                Number.isFinite(strength)
                    ? strength
                    : null,

            rhythmConfidence:
                Number.isFinite(
                    Number(
                        rhythmResult?.confidence
                    )
                )
                    ? Number(
                        rhythmResult.confidence
                    )
                    : null

        };

    } finally {

        /*
         * Free the C++ VectorFloat allocated
         * by arrayToVector().
         */

        if (
            signalVector &&
            typeof signalVector.delete ===
            "function"
        ) {

            signalVector.delete();
        }
    }
}


/* =========================================================
   TRACK ANALYZER
   ========================================================= */

export class TrackAnalyzer {

    constructor() {

        this.isAnalyzing =
            false;
    }


    /**
     * Analyze an audio file.
     *
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async analyze(file) {

        if (
            !(file instanceof File)
        ) {

            throw new TypeError(
                "WM Tapper: expected an audio File."
            );
        }


        if (
            this.isAnalyzing
        ) {

            throw new Error(
                "WM Tapper: an audio analysis is already in progress."
            );
        }


        this.isAnalyzing =
            true;


        try {

            console.log(
                "WM Tapper: loading Essentia..."
            );


            const essentia =
                await getEssentia();


            console.log(
                "WM Tapper: decoding audio...",
                file.name
            );


            const decodedBuffer =
                await decodeAudioFile(
                    file
                );


            console.log(
                "WM Tapper: decoded audio.",
                {
                    duration:
                        decodedBuffer.duration,

                    sampleRate:
                        decodedBuffer.sampleRate,

                    channels:
                        decodedBuffer.numberOfChannels
                }
            );


            console.log(
                "WM Tapper: resampling audio to 44100 Hz..."
            );


            const signal =
                await resampleTo44100(
                    decodedBuffer
                );


            console.log(
                "WM Tapper: running Essentia analysis..."
            );


            const result =
                await analyzeDecodedAudio(
                    essentia,
                    signal
                );


            const normalizedResult = {

                bpm:
                    result.bpm,

                key:
                    result.key,

                scale:
                    result.scale,

                keyLabel:
                    result.key &&
                    result.scale
                        ? `${result.key} ${result.scale}`
                        : null,

                strength:
                    result.strength,

                rhythmConfidence:
                    result.rhythmConfidence

            };


            console.log(
                "WM Tapper: analysis complete.",
                normalizedResult
            );


            return normalizedResult;

        } catch (error) {

            console.error(
                "WM Tapper: audio analysis failed.",
                error
            );


            throw error;

        } finally {

            this.isAnalyzing =
                false;
        }
    }
}
