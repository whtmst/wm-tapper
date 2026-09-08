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

const RHYTHM_MAX_TEMPO = 250;

const RHYTHM_MIN_TEMPO = 40;

const RHYTHM_METHOD = "multifeature";

/* =========================================================
   GENRE BPM RANGES
   ========================================================= */

/*
 * Genre ranges are soft hints for the BPM decision layer.
 *
 * They are NOT hard limits.
 * A detected BPM outside the selected genre range
 * must still remain valid.
 */

const GENRE_KEY_PROFILE_WEIGHTS = {
    auto: {
        bgate: 1.0,
        edma: 0.8,
        edmm: 0.7,
    },

    house: {
        bgate: 0.85,
        edma: 1.0,
        edmm: 0.9,
    },

    techno: {
        bgate: 0.85,
        edma: 1.0,
        edmm: 0.9,
    },

    trance: {
        bgate: 0.85,
        edma: 1.0,
        edmm: 0.9,
    },

    "drum-and-bass": {
        bgate: 0.8,
        edma: 1.0,
        edmm: 0.9,
    },

    dubstep: {
        bgate: 0.85,
        edma: 1.0,
        edmm: 0.9,
    },

    hardstyle: {
        bgate: 0.8,
        edma: 1.0,
        edmm: 0.9,
    },

    hardcore: {
        bgate: 0.8,
        edma: 1.0,
        edmm: 0.9,
    },

    frenchcore: {
        bgate: 0.8,
        edma: 1.0,
        edmm: 0.9,
    },

    "hip-hop-trap": {
        bgate: 1.0,
        edma: 0.65,
        edmm: 0.45,
    },

    pop: {
        bgate: 1.0,
        edma: 0.65,
        edmm: 0.45,
    },

    rock: {
        bgate: 1.0,
        edma: 0.6,
        edmm: 0.4,
    },

    "other-electronic": {
        bgate: 0.85,
        edma: 1.0,
        edmm: 0.9,
    },

    other: {
        bgate: 1.0,
        edma: 0.8,
        edmm: 0.7,
    },
};

const GENRE_BPM_RANGES = {
    house: {
        min: 115,
        max: 135,
    },

    techno: {
        min: 120,
        max: 155,
    },

    trance: {
        min: 125,
        max: 150,
    },

    "drum-and-bass": {
        min: 160,
        max: 190,
    },

    dubstep: {
        min: 135,
        max: 150,
    },

    hardstyle: {
        min: 145,
        max: 165,
    },

    hardcore: {
        min: 160,
        max: 220,
    },

    frenchcore: {
        min: 180,
        max: 240,
    },

    "hip-hop-trap": {
        min: 60,
        max: 170,
    },

    pop: {
        min: 80,
        max: 140,
    },

    rock: {
        min: 70,
        max: 160,
    },

    "other-electronic": {
        min: 80,
        max: 220,
    },

    other: {
        min: 40,
        max: 250,
    },
};

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
 * Measure execution time.
 *
 * @param {string} label
 * @param {Function} callback
 * @returns {*}
 */
function measureTime(label, callback) {
    const start = performance.now();

    const result = callback();

    const elapsed = performance.now() - start;

    console.log(`WM Tapper: TIME ${label}.`, {
        milliseconds: Number(elapsed.toFixed(2)),
        seconds: Number((elapsed / 1000).toFixed(3)),
    });

    return result;
}

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
        const percivalResult = measureTime("PercivalBpmEstimator", () =>
            essentia.PercivalBpmEstimator(
                signalVector,
                1024,
                2048,
                128,
                128,
                RHYTHM_MAX_TEMPO,
                RHYTHM_MIN_TEMPO,
                TARGET_SAMPLE_RATE,
            ),
        );

        console.log("WM Tapper: PERCIVAL BPM.", {
            bpm: percivalResult?.bpm,
        });

        /* -------------------------------------------------
       BPM
       ------------------------------------------------- */

        const rhythmResult = measureTime("RhythmDescriptors", () =>
            essentia.RhythmDescriptors(signalVector),
        );

        const rhythmTestResult = measureTime("RhythmExtractor2013", () =>
            essentia.RhythmExtractor2013(
                signalVector,
                RHYTHM_MAX_TEMPO,
                RHYTHM_METHOD,
                RHYTHM_MIN_TEMPO,
            ),
        );

        console.log("WM Tapper: RHYTHM EXTRACTOR TEST.", {
            bpm: rhythmTestResult?.bpm,
            confidence: rhythmTestResult?.confidence,
        });

        console.log("WM Tapper: RHYTHM HISTOGRAM.", {
            firstPeakBpm: rhythmResult?.first_peak_bpm,
            firstPeakWeight: rhythmResult?.first_peak_weight,
            secondPeakBpm: rhythmResult?.second_peak_bpm,
            secondPeakWeight: rhythmResult?.second_peak_weight,

            histogramAt92: rhythmResult?.histogram?.get
                ? rhythmResult.histogram.get(92)
                : null,

            histogramAt185: rhythmResult?.histogram?.get
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

        const keyProfileTypes = [
            "bgate",
            "edma",
            "edmm",
            "braw",
            "shaath",
            "krumhansl",
            "temperley",
            "temperley2005",
            "thpcp",
            "gomez",
            "noland",
            "diatonic",
            "tonictriad",
            "weichai",
        ];

        const keyProfiles = [];

        keyProfileTypes.forEach((profile) => {
            try {
                const result = measureTime(`KeyExtractor:${profile}`, () =>
                    essentia.KeyExtractor(
                        signalVector,
                        true,
                        4096,
                        4096,
                        36,
                        3500,
                        60,
                        25,
                        0.2,
                        profile,
                        TARGET_SAMPLE_RATE,
                        0.0001,
                        440,
                        "cosine",
                        "hann",
                    ),
                );

                keyProfiles.push({
                    profile,
                    result,
                });
            } catch (error) {
                console.warn(
                    `WM Tapper: KEY PROFILE FAILED (${profile}).`,
                    error,
                );
            }
        });

        const normalizedKeyProfiles = keyProfiles
            .map(({ profile, result }) => {
                const key = typeof result?.key === "string" ? result.key : null;

                const scale =
                    typeof result?.scale === "string" ? result.scale : null;

                const strength = Number(result?.strength);

                return {
                    profile,

                    key,

                    scale,

                    strength: Number.isFinite(strength) ? strength : null,
                };
            })
            .filter((result) => {
                return result.key && result.scale;
            });

        console.log(
            "WM Tapper: KEY PROFILE RESULTS.",
            normalizedKeyProfiles.map((profileResult) => {
                return {
                    profile: profileResult.profile,
                    key: profileResult.key,
                    scale: profileResult.scale,
                    strength: Number(profileResult.strength.toFixed(4)),
                };
            }),
        );

        const keyProfileWeights = getGenreKeyProfileWeights("auto");

        console.table(
            normalizedKeyProfiles.map((profileResult) => {
                const weight =
                    Number(keyProfileWeights[profileResult.profile]) || 0;

                return {
                    profile: profileResult.profile,
                    key: profileResult.key,
                    scale: profileResult.scale,
                    strength: Number(profileResult.strength.toFixed(4)),
                    weight,
                    weightedScore: Number(
                        (profileResult.strength * weight).toFixed(4),
                    ),
                };
            }),
        );

        const bpm = Number(rhythmResult?.bpm);

        const rhythmConfidence = Number(rhythmResult?.confidence);

        return {
            bpm: Number.isFinite(bpm) ? bpm : null,

            keyProfiles: normalizedKeyProfiles,

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
 * Extract one time range from an already resampled signal.
 *
 * @param {Float32Array} signal
 * @param {number} startTime
 * @param {number} endTime
 * @returns {Float32Array}
 */
function sliceSignalByTime(signal, startTime, endTime) {
    const startSample = Math.max(0, Math.floor(startTime * TARGET_SAMPLE_RATE));

    const endSample = Math.min(
        signal.length,
        Math.ceil(endTime * TARGET_SAMPLE_RATE),
    );

    if (endSample <= startSample) {
        throw new Error("WM Tapper: selected signal range is empty.");
    }

    return signal.slice(startSample, endSample);
}

/**
 * Get key profile weights for the selected genre.
 *
 * @param {string} genre
 * @returns {Object}
 */
function getGenreKeyProfileWeights(genre) {
    return GENRE_KEY_PROFILE_WEIGHTS[genre] || GENRE_KEY_PROFILE_WEIGHTS.auto;
}

/**
 * Select final key using profile and segment consensus.
 *
 * @param {Object[][]} profileSets
 * @param {string} genre
 * @returns {Object|null}
 */
function selectKeyConsensus(profileSets, genre = "auto") {
    const candidates = [];

    /*
     * Profiles are grouped into families so closely related
     * profiles do not count as fully independent votes.
     */
    const PROFILE_FAMILIES = {
        bgate: "beatport",
        braw: "beatport",

        edma: "edm",
        edmm: "edm",

        krumhansl: "popular",
        shaath: "popular",
        gomez: "popular",

        temperley: "temperley",
        temperley2005: "temperley",

        noland: "noland",

        thpcp: "thpcp",

        diatonic: "diatonic",

        tonictriad: "tonictriad",

        weichai: "weichai",
    };

    /*
     * Relative major/minor belong to the same tonal pair.
     *
     * Example:
     * C minor <-> Eb major
     * F minor <-> Ab major
     */
    const RELATIVE_MAJOR = {
        C: "Eb",
        "C#": "E",
        D: "F",
        "Eb": "F#",
        E: "G",
        F: "Ab",
        "F#": "A",
        G: "Bb",
        "Ab": "B",
        A: "C",
        Bb: "C#",
        B: "D",
    };

    const getRelativeKey = (key, scale) => {
        if (!key || !scale) {
            return null;
        }

        if (scale === "minor") {
            return {
                key: RELATIVE_MAJOR[key] || null,
                scale: "major",
            };
        }

        const relativeMinor = Object.entries(RELATIVE_MAJOR).find(
            ([minorKey, majorKey]) => {
                return majorKey === key;
            },
        );

        if (!relativeMinor) {
            return null;
        }

        return {
            key: relativeMinor[0],
            scale: "minor",
        };
    };

    profileSets.forEach((profiles, segmentIndex) => {
        if (!Array.isArray(profiles)) {
            return;
        }

        profiles.forEach((profileResult) => {
            if (
                !profileResult?.key ||
                !profileResult?.scale ||
                !Number.isFinite(profileResult.strength)
            ) {
                return;
            }

            const strength = Math.max(0, profileResult.strength);

            candidates.push({
                key: profileResult.key,

                scale: profileResult.scale,

                strength,

                profile: profileResult.profile,

                family:
                    PROFILE_FAMILIES[profileResult.profile] ||
                    profileResult.profile,

                segmentIndex,
            });
        });
    });

    if (candidates.length === 0) {
        return null;
    }

    const groups = new Map();

    /*
     * First group by exact key + scale.
     */
    candidates.forEach((candidate) => {
        const id = `${candidate.key} ${candidate.scale}`;

        if (!groups.has(id)) {
            groups.set(id, {
                key: candidate.key,

                scale: candidate.scale,

                profiles: [],

                families: new Set(),

                segments: new Set(),

                strengthSum: 0,

                bestStrength: -Infinity,
            });
        }

        const group = groups.get(id);

        group.profiles.push(candidate);

        group.families.add(candidate.family);

        group.segments.add(candidate.segmentIndex);

        group.strengthSum += candidate.strength;

        group.bestStrength = Math.max(
            group.bestStrength,
            candidate.strength,
        );
    });

    /*
     * Calculate score for each exact key candidate.
     *
     * Important:
     * - strength matters
     * - profile agreement matters
     * - independent profile families matter
     *
     * This is deliberately NOT based on the old profile weights.
     */
    const rankedGroups = Array.from(groups.values()).map((group) => {
        const profileCount = group.profiles.length;

        const familyCount = group.families.size;

        const segmentCount = group.segments.size;

        /*
         * Average strength prevents a large number of weak
         * profiles from winning purely by quantity.
         */
        const averageStrength =
            profileCount > 0 ? group.strengthSum / profileCount : 0;

        /*
         * Agreement bonus grows slower than linearly.
         *
         * 1 profile  -> 1.00
         * 4 profiles -> 2.00
         * 9 profiles -> 3.00
         */
        const profileAgreement = Math.sqrt(profileCount);

        /*
         * Independent families are more valuable than
         * multiple profiles from the same family.
         */
        const familyAgreement = Math.sqrt(familyCount);

        /*
         * FAST mode gets an additional segment agreement signal.
         * FULL / SELECTION have only one segment.
         */
        const segmentAgreement =
            segmentCount > 1 ? Math.sqrt(segmentCount) : 1;

        /*
         * Base evidence.
         */
        let score =
            averageStrength *
            profileAgreement *
            familyAgreement *
            segmentAgreement;

        /*
         * Small bonus for the strongest individual profile.
         *
         * This prevents a very strong result from being
         * completely buried by several mediocre results.
         */
        score += group.bestStrength * 0.35;

        /*
         * Relative-major/minor support.
         *
         * A relative key is not treated as direct support,
         * but it is treated as related evidence.
         */
        const relativeKey = getRelativeKey(group.key, group.scale);

        let relativeSupport = 0;

        if (relativeKey) {
            const relativeId = `${relativeKey.key} ${relativeKey.scale}`;

            const relativeGroup = groups.get(relativeId);

            if (relativeGroup) {
                relativeSupport = relativeGroup.profiles.length;

                score +=
                    Math.sqrt(relativeSupport) *
                    0.15 *
                    relativeGroup.bestStrength;
            }
        }

        return {
            ...group,

            score,

            averageStrength,

            profileAgreement,

            familyAgreement,

            segmentAgreement,

            relativeSupport,
        };
    });

    rankedGroups.sort((left, right) => {
        return right.score - left.score;
    });

    const best = rankedGroups[0];

    console.log("WM Tapper: KEY CONSENSUS.", {
        genre,

        selected: {
            key: best.key,

            scale: best.scale,

            score: Number(best.score.toFixed(3)),

            bestStrength: Number(best.bestStrength.toFixed(3)),

            averageStrength: Number(best.averageStrength.toFixed(3)),

            profileAgreement: best.profiles.length,

            familyAgreement: best.families.size,

            segmentAgreement: best.segments.size,

            relativeSupport: best.relativeSupport,
        },

        candidates: rankedGroups.map((group) => {
            return {
                key: group.key,

                scale: group.scale,

                score: Number(group.score.toFixed(3)),

                bestStrength: Number(
                    group.bestStrength.toFixed(3),
                ),

                averageStrength: Number(
                    group.averageStrength.toFixed(3),
                ),

                profileAgreement: group.profiles.length,

                familyAgreement: group.families.size,

                segmentAgreement: group.segments.size,

                relativeSupport: group.relativeSupport,

                families: Array.from(group.families),

                profiles: group.profiles.map((profile) => {
                    return {
                        profile: profile.profile,

                        family: profile.family,

                        strength: Number(
                            profile.strength.toFixed(3),
                        ),

                        segmentIndex: profile.segmentIndex + 1,
                    };
                }),
            };
        }),
    });

    return {
        key: best.key,

        scale: best.scale,

        strength: Number.isFinite(best.bestStrength)
            ? best.bestStrength
            : null,
    };
}

/**
 * Choose the strongest BPM result.
 *
 * @param {Object[]} results
 * @returns {number|null}
 */
/**
 * Get BPM range for the selected genre.
 *
 * @param {string} genre
 * @returns {{min:number,max:number}}
 */
function getGenreBpmRange(genre) {
    if (!genre || genre === "auto") {
        return {
            min: RHYTHM_MIN_TEMPO,
            max: RHYTHM_MAX_TEMPO,
        };
    }

    return (
        GENRE_BPM_RANGES[genre] || {
            min: RHYTHM_MIN_TEMPO,
            max: RHYTHM_MAX_TEMPO,
        }
    );
}

/**
 * Calculate a soft genre preference for a BPM candidate.
 *
 * @param {number} bpm
 * @param {string} genre
 * @returns {number}
 */
function getGenreBpmBonus(bpm, genre) {
    if (!Number.isFinite(bpm) || !genre || genre === "auto") {
        return 0;
    }

    const range = getGenreBpmRange(genre);

    if (bpm >= range.min && bpm <= range.max) {
        return 2;
    }

    const distance = bpm < range.min ? range.min - bpm : bpm - range.max;

    return Math.max(0, 1 - distance / 30);
}

/**
 * Select the best BPM result from several FAST segments.
 *
 * Each detected BPM produces three possible interpretations:
 *
 *   1x  - detected tempo
 *   2x  - double-time interpretation
 *   0.5x - half-time interpretation
 *
 * Candidates are grouped by proximity.
 * Each segment can contribute only once to a cluster,
 * so one segment cannot vote three times for the same BPM.
 *
 * @param {Object[]} results
 * @param {string} genre
 * @returns {number|null}
 */
function selectBpmResult(results, genre = "auto") {
    const validResults = results.filter((result) => {
        return result && Number.isFinite(result.bpm);
    });

    if (validResults.length === 0) {
        return null;
    }

    const candidates = [];

    validResults.forEach((result, segmentIndex) => {
        const bpm = Number(result.bpm);

        const confidence =
            Number.isFinite(result.rhythmConfidence) &&
            result.rhythmConfidence > 0
                ? result.rhythmConfidence
                : 1;

        const variants = [
            {
                bpm,
                weight: 1,
                interpretation: "1x",
            },

            {
                bpm: bpm * 2,
                weight: 0.85,
                interpretation: "2x",
            },

            {
                bpm: bpm / 2,
                weight: 0.85,
                interpretation: "0.5x",
            },
        ];

        variants.forEach((variant) => {
            if (
                !Number.isFinite(variant.bpm) ||
                variant.bpm < RHYTHM_MIN_TEMPO ||
                variant.bpm > RHYTHM_MAX_TEMPO
            ) {
                return;
            }

            candidates.push({
                bpm: variant.bpm,
                weight: variant.weight,
                confidence,
                segmentIndex,
                interpretation: variant.interpretation,
            });
        });
    });

    /*
     * Sort by BPM so nearby interpretations can be grouped.
     */
    candidates.sort((left, right) => {
        return left.bpm - right.bpm;
    });

    const clusters = [];

    candidates.forEach((candidate) => {
        let targetCluster = null;

        /*
         * A tolerance of 3 BPM allows small differences
         * between Essentia segment estimates.
         */
        for (let index = 0; index < clusters.length; index += 1) {
            const cluster = clusters[index];

            if (Math.abs(cluster.center - candidate.bpm) <= 3) {
                targetCluster = cluster;

                break;
            }
        }

        if (!targetCluster) {
            clusters.push({
                center: candidate.bpm,

                candidates: [candidate],
            });

            return;
        }

        targetCluster.candidates.push(candidate);

        const totalWeight = targetCluster.candidates.reduce((sum, item) => {
            return sum + item.weight;
        }, 0);

        targetCluster.center =
            targetCluster.candidates.reduce((sum, item) => {
                return sum + item.bpm * item.weight;
            }, 0) / totalWeight;
    });

    /*
     * Score each BPM cluster.
     */
    let bestCluster = null;

    let bestScore = -Infinity;

    clusters.forEach((cluster) => {
        /*
         * One segment can support a cluster only once.
         *
         * Among all interpretations from that segment,
         * keep only the strongest contribution.
         */
        const segmentScores = new Map();

        cluster.candidates.forEach((candidate) => {
            const candidateScore = candidate.confidence * candidate.weight;

            const previousScore =
                segmentScores.get(candidate.segmentIndex) || 0;

            if (candidateScore > previousScore) {
                segmentScores.set(candidate.segmentIndex, candidateScore);
            }
        });

        let score = 0;

        segmentScores.forEach((value) => {
            score += value;
        });

        /*
         * Reward agreement between independent segments.
         */
        score += segmentScores.size * 0.75;

        /*
         * Genre provides a soft preference only.
         */
        score += getGenreBpmBonus(cluster.center, genre);

        cluster.score = score;

        if (score > bestScore) {
            bestScore = score;

            bestCluster = cluster;
        }
    });

    if (!bestCluster) {
        return null;
    }

    console.log("WM Tapper: FAST BPM consensus.", {
        genre,
        selectedBpm: bestCluster.center,
        score: bestScore,

        clusters: clusters.map((cluster) => {
            return {
                bpm: Number(cluster.center.toFixed(3)),
                score: Number(cluster.score.toFixed(3)),
                candidates: cluster.candidates.map((candidate) => {
                    return {
                        bpm: Number(candidate.bpm.toFixed(3)),
                        confidence: Number(candidate.confidence.toFixed(3)),
                        weight: candidate.weight,
                        segmentIndex: candidate.segmentIndex + 1,
                        interpretation: candidate.interpretation,
                    };
                }),
            };
        }),
    });

    return bestCluster.center;
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

            const genre =
                typeof options?.genre === "string" ? options.genre : "auto";

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

                const decodeStartedAt = performance.now();

                decodedBuffer = await decodeAudioFile(file);

                const decodeElapsed = performance.now() - decodeStartedAt;

                console.log("WM Tapper: TIME Decode.", {
                    milliseconds: Number(decodeElapsed.toFixed(2)),
                    seconds: Number((decodeElapsed / 1000).toFixed(3)),
                });
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

                const resampleStartedAt = performance.now();

                const signal = await resampleRangeTo44100(
                    decodedBuffer,
                    0,
                    duration,
                );

                const resampleElapsed = performance.now() - resampleStartedAt;

                console.log("WM Tapper: TIME Resample.", {
                    milliseconds: Number(resampleElapsed.toFixed(2)),
                    seconds: Number((resampleElapsed / 1000).toFixed(3)),
                });

                console.log("WM Tapper: running Essentia analysis...");

                const result = await analyzeSignal(essentia, signal);

                const keyConsensus = measureTime("KeyConsensus", () =>
                    selectKeyConsensus([result.keyProfiles], genre),
                );

                const normalizedResult = normalizeResult(
                    {
                        ...result,

                        bpm: selectBpmResult([result], genre),

                        key: keyConsensus?.key ?? null,

                        scale: keyConsensus?.scale ?? null,

                        strength: keyConsensus?.strength ?? null,
                    },
                    "full",
                );

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

                if (endTime - startTime < 30) {
                    throw new Error(
                        "WM Tapper: selected range must be at least 30 seconds.",
                    );
                }

                console.log("WM Tapper: analyzing SELECTION.", {
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                });

                const resampleStartedAt = performance.now();

                const signal = await resampleRangeTo44100(
                    decodedBuffer,
                    startTime,
                    endTime,
                );

                const resampleElapsed = performance.now() - resampleStartedAt;

                console.log("WM Tapper: TIME Resample.", {
                    milliseconds: Number(resampleElapsed.toFixed(2)),
                    seconds: Number((resampleElapsed / 1000).toFixed(3)),
                });

                console.log("WM Tapper: running Essentia analysis...");

                const result = await analyzeSignal(essentia, signal);

                const keyConsensus = measureTime("KeyConsensus", () =>
                    selectKeyConsensus([result.keyProfiles], genre),
                );

                const normalizedResult = normalizeResult(
                    {
                        ...result,

                        bpm: selectBpmResult([result], genre),

                        key: keyConsensus?.key ?? null,

                        scale: keyConsensus?.scale ?? null,

                        strength: keyConsensus?.strength ?? null,
                    },
                    "selection",
                );

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

            /*
             * Resample the complete track only once.
             *
             * FAST segments are extracted from this already
             * resampled mono signal using sample indexes.
             */
            console.log("WM Tapper: resampling track for FAST mode...");

            const resampleStartedAt = performance.now();

            const fastSignal = await resampleRangeTo44100(
                decodedBuffer,
                0,
                duration,
            );

            const resampleElapsed = performance.now() - resampleStartedAt;

            console.log("WM Tapper: TIME Resample.", {
                milliseconds: Number(resampleElapsed.toFixed(2)),
                seconds: Number((resampleElapsed / 1000).toFixed(3)),
            });

            console.log("WM Tapper: FAST track resampled.", {
                samples: fastSignal.length,
                sampleRate: TARGET_SAMPLE_RATE,
                duration: fastSignal.length / TARGET_SAMPLE_RATE,
            });

            for (let index = 0; index < segments.length; index += 1) {
                const segment = segments[index];

                console.log("WM Tapper: FAST segment.", {
                    index: index + 1,

                    total: segments.length,

                    startTime: segment.startTime,

                    endTime: segment.endTime,
                });

                const signal = sliceSignalByTime(
                    fastSignal,
                    segment.startTime,
                    segment.endTime,
                );

                const result = await analyzeSignal(essentia, signal);

                segmentResults.push(result);
            }

            const bpm = selectBpmResult(segmentResults, genre);

            const keyConsensus = measureTime("KeyConsensus", () =>
                selectKeyConsensus(
                    segmentResults.map((result) => {
                        return result.keyProfiles;
                    }),
                    genre,
                ),
            );

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

                    key: keyConsensus?.key ?? null,

                    scale: keyConsensus?.scale ?? null,

                    strength: keyConsensus?.strength ?? null,

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
