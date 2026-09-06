/* =========================================================
   WM TAPPER
   Waveform Renderer
   ========================================================= */


/* =========================================================
   CONSTANTS
   ========================================================= */

const DEFAULT_PEAK_COUNT = 120;

const DEFAULT_MIN_AMPLITUDE = 0.035;


/* =========================================================
   AUDIO DECODING
   ========================================================= */

/**
 * Decode an audio File using Web Audio API.
 *
 * @param {File} file
 * @returns {Promise<AudioBuffer>}
 */
export async function decodeAudioFile(file) {

    if (!(file instanceof File)) {

        throw new TypeError(
            "WM Tapper: expected an audio File."
        );
    }


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContextClass) {

        throw new Error(
            "WM Tapper: Web Audio API is not supported."
        );
    }


    const arrayBuffer =
        await file.arrayBuffer();


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
   PEAK EXTRACTION
   ========================================================= */

/**
 * Extract normalized amplitude peaks from AudioBuffer.
 *
 * Uses the same basic approach as the WM Tagger waveform:
 * average absolute amplitude over equally sized blocks.
 *
 * @param {AudioBuffer} audioBuffer
 * @param {number} peakCount
 * @returns {number[]}
 */
export function extractPeaks(
    audioBuffer,
    peakCount = DEFAULT_PEAK_COUNT
) {

    if (
        !audioBuffer ||
        !audioBuffer.length
    ) {

        return [];
    }


    const channelData =
        audioBuffer.getChannelData(0);


    const safePeakCount =
        Math.max(
            1,
            Math.min(
                peakCount,
                channelData.length
            )
        );


    const blockSize =
        Math.max(
            1,
            Math.floor(
                channelData.length /
                safePeakCount
            )
        );


    const peaks = [];


    for (
        let index = 0;
        index < safePeakCount;
        index += 1
    ) {

        const start =
            index *
            blockSize;


        const end =
            index === safePeakCount - 1
                ? channelData.length
                : Math.min(
                    channelData.length,
                    start + blockSize
                );


        let sum =
            0;


        let sampleCount =
            0;


        for (
            let sampleIndex = start;
            sampleIndex < end;
            sampleIndex += 1
        ) {

            sum += Math.abs(
                channelData[sampleIndex]
            );


            sampleCount += 1;
        }


        peaks.push(
            sampleCount > 0
                ? sum / sampleCount
                : 0
        );
    }


    const maxPeak =
        Math.max(
            ...peaks
        ) || 1;


    return peaks.map(
        (peak) => {

            return Math.max(
                DEFAULT_MIN_AMPLITUDE,
                peak / maxPeak
            );
        }
    );
}


/* =========================================================
   WAVEFORM RENDERER
   ========================================================= */

/**
 * Create waveform renderer.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Object}
 */
export function createWaveformRenderer(
    canvas
) {

    if (
        !(canvas instanceof HTMLCanvasElement)
    ) {

        throw new TypeError(
            "WM Tapper: waveform canvas is required."
        );
    }


    let peaks = [];


    function resizeCanvas() {

        const rect =
            canvas.getBoundingClientRect();


        const width =
            Math.max(
                1,
                Math.round(
                    rect.width
                )
            );


        const height =
            Math.max(
                1,
                Math.round(
                    rect.height
                )
            );


        const devicePixelRatio =
            Math.max(
                1,
                window.devicePixelRatio || 1
            );


        canvas.width =
            Math.round(
                width *
                devicePixelRatio
            );


        canvas.height =
            Math.round(
                height *
                devicePixelRatio
            );


        const context =
            canvas.getContext(
                "2d"
            );


        context.setTransform(
            devicePixelRatio,
            0,
            0,
            devicePixelRatio,
            0,
            0
        );


        return {
            context,
            width,
            height
        };
    }


    function render() {

        const {
            context,
            width,
            height
        } =
            resizeCanvas();


        context.clearRect(
            0,
            0,
            width,
            height
        );


        if (
            peaks.length === 0
        ) {

            return;
        }


        const barWidth =
            2;


        const gap =
            1;


        const totalBarWidth =
            barWidth +
            gap;


        const totalBars =
            Math.max(
                1,
                Math.floor(
                    width /
                    totalBarWidth
                )
            );


        const centerY =
            height /
            2;


        const maxBarHeight =
            height -
            6;


        /*
         * Draw every amplitude as a narrow vertical bar.
         *
         * The bars are symmetrical around the center line,
         * making the waveform readable at small sizes.
         */

        for (
            let index = 0;
            index < totalBars;
            index += 1
        ) {

            const peakIndex =
                Math.min(
                    peaks.length - 1,
                    Math.floor(
                        (
                            index /
                            totalBars
                        ) *
                        peaks.length
                    )
                );


            const value =
                peaks[peakIndex] ||
                DEFAULT_MIN_AMPLITUDE;


            const barHeight =
                Math.max(
                    2,
                    value *
                    maxBarHeight
                );


            const x =
                index *
                totalBarWidth;


            const y =
                centerY -
                (
                    barHeight /
                    2
                );


            context.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );
        }
    }


    function setPeaks(
        nextPeaks
    ) {

        peaks =
            Array.isArray(
                nextPeaks
            )
                ? nextPeaks
                : [];


        render();
    }


    function clear() {

        peaks =
            [];


        render();
    }


    function handleResize() {

        render();
    }


    window.addEventListener(
        "resize",
        handleResize
    );


    return {

        setPeaks,

        clear,

        render,

        getPeaks() {

            return peaks.slice();
        },

        destroy() {

            window.removeEventListener(
                "resize",
                handleResize
            );

            clear();
        }
    };
}
