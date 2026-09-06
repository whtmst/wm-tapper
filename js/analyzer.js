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
    "../lib/essentia/essentia-wasm.web.js";

const TARGET_SAMPLE_RATE = 44100;

const MIN_TEMPO = 40;
const MAX_TEMPO = 208;

const RHYTHM_METHOD = "multifeature";


/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Load the asynchronous Essentia WASM web build once.
 *
 * The web build exposes EssentiaWASM as a global function.
 *
 * @returns {Promise<Object>}
 */
function loadEssentiaWasm() {

    if (globalThis.__wmEssentiaWasmPromise) {

        return globalThis.__wmEssentiaWasmPromise;
    }


    globalThis.__wmEssentiaWasmPromise = new Promise(
        (resolve, reject) => {

            if (
                typeof globalThis.EssentiaWASM === "function"
            ) {

                globalThis.EssentiaWASM()
                    .then(resolve)
                    .catch(reject);

                return;
            }


            const script =
                document.createElement("script");

            script.src = ESSENTIA_WASM_SCRIPT;
            script.async = true;


            script.onload = () => {

                if (
                    typeof globalThis.EssentiaWASM !== "function"
                ) {

                    reject(
                        new Error(
                            "WM Tapper: EssentiaWASM was not found after loading the WASM script."
                        )
                    );

                    return;
                }


                globalThis.EssentiaWASM()
                    .then(resolve)
                    .catch(reject);
            };


            script.onerror = () => {

                reject(
                    new Error(
                        "WM Tapper: failed to load Essentia WASM backend."
                    )
                );
            };


            document.head.appendChild(script);
        }
    );


    return globalThis.__wmEssentiaWasmPromise;
}


/**
 * Create or reuse an Essentia instance.
 *
 * @returns {Promise<Essentia>}
 */
async function getEssentia() {

    if (globalThis.__wmEssentiaInstance) {

        return globalThis.__wmEssentiaInstance;
    }


    const essentiaWasm =
        await loadEssentiaWasm();


    const essentia =
        new Essentia(essentiaWasm);


    globalThis.__wmEssentiaInstance =
        essentia;


    return essentia;
}


/**
 * Decode an audio File through Web Audio API.
 *
 * @param {File} file
 * @returns {Promise<AudioBuffer>}
 */
async function decodeAudioFile(file) {

    const arrayBuffer =
        await file.arrayBuffer();


    const audioContext =
        new AudioContext();


    try {

        return await audioContext.decodeAudioData(
            arrayBuffer
        );

    } finally {

        await audioContext.close();
    }
}


/**
 * Resample an AudioBuffer to 44.1 kHz.
 *
 * RhythmExtractor2013 requires a 44100 Hz signal.
 *
 * @param {AudioBuffer} sourceBuffer
 * @returns {Promise<Float32Array>}
 */
async function resampleTo44100(sourceBuffer) {

    const sourceLength =
        sourceBuffer.length;

    const duration =
        sourceBuffer.duration;


    const targetLength =
        Math.ceil(
            duration * TARGET_SAMPLE_RATE
        );


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


    source.start(0);


    const renderedBuffer =
        await offlineContext.startRendering();


    const leftChannel =
        renderedBuffer.getChannelData(0);


    return new Float32Array(leftChannel);
}


/**
 * Convert the signal into the vector type expected by Essentia.
 *
 * @param {Essentia} essentia
 * @param {Float32Array} signal
 * @returns {Object}
 */
function toEssentiaVector(essentia, signal) {

    return essentia.arrayToVector(signal);
}


/**
 * Convert Essentia key/scale into a single label.
 *
 * @param {string} key
 * @param {string} scale
 * @returns {string|null}
 */
function createKeyLabel(key, scale) {

    if (
        typeof key !== "string" ||
        typeof scale !== "string"
    ) {

        return null;
    }


    const normalizedKey =
        key.trim();


    const normalizedScale =
        scale.trim().toLowerCase();


    if (!normalizedKey || !normalizedScale) {

        return null;
    }


    return `${normalizedKey} ${normalizedScale}`;
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
     * Pipeline:
     *
     * File
     *  ↓
     * Decode
     *  ↓
     * Resample to 44100 Hz
     *  ↓
     * Mono Float32Array
     *  ↓
     * Essentia WASM
     *  ├── RhythmExtractor2013 → BPM
     *  └── KeyExtractor         → Key
     *
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async analyze(file) {

        if (!(file instanceof File)) {

            throw new TypeError(
                "WM Tapper: expected an audio File."
            );
        }


        if (this.isAnalyzing) {

            throw new Error(
                "WM Tapper: an audio analysis is already in progress."
            );
        }


        this.isAnalyzing = true;


        try {

            /* -------------------------------------------------
               Load Essentia
               ------------------------------------------------- */

            const essentia =
                await getEssentia();


            /* -------------------------------------------------
               Decode file
               ------------------------------------------------- */

            const decodedBuffer =
                await decodeAudioFile(file);


            if (
                !decodedBuffer ||
                decodedBuffer.length === 0
            ) {

                throw new Error(
                    "WM Tapper: decoded audio buffer is empty."
                );
            }


            /* -------------------------------------------------
               Resample to 44100 Hz
               ------------------------------------------------- */

            const signal =
                await resampleTo44100(
                    decodedBuffer
                );


            if (
                !signal ||
                signal.length === 0
            ) {

                throw new Error(
                    "WM Tapper: audio signal is empty after resampling."
                );
            }


            /* -------------------------------------------------
               Convert JS array → Essentia VectorFloat
               ------------------------------------------------- */

            const signalVector =
                toEssentiaVector(
                    essentia,
                    signal
                );


            /* -------------------------------------------------
               BPM analysis
               ------------------------------------------------- */

            const rhythmResult =
                essentia.RhythmExtractor2013(
                    signalVector,
                    MAX_TEMPO,
                    RHYTHM_METHOD,
                    MIN_TEMPO
                );


            /* -------------------------------------------------
               Key analysis
               ------------------------------------------------- */

            const keyResult =
                essentia.KeyExtractor(
                    signalVector
                );


            /* -------------------------------------------------
               Extract BPM
               ------------------------------------------------- */

            const bpm =
                Number(
                    rhythmResult?.bpm
                );


            /* -------------------------------------------------
               Extract key
               ------------------------------------------------- */

            const key =
                typeof keyResult?.key === "string"
                    ? keyResult.key
                    : null;


            const scale =
                typeof keyResult?.scale === "string"
                    ? keyResult.scale
                    : null;


            const confidence =
                Number(
                    keyResult?.strength
                );


            /* -------------------------------------------------
               Build final result
               ------------------------------------------------- */

            return {

                bpm:
                    Number.isFinite(bpm)
                        ? bpm
                        : null,

                key,

                scale,

                keyLabel:
                    createKeyLabel(
                        key,
                        scale
                    ),

                confidence:
                    Number.isFinite(confidence)
                        ? confidence
                        : null

            };

        } finally {

            this.isAnalyzing = false;
        }
    }
}
