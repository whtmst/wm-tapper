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
 * For stereo and multichannel audio, all available channels
 * are analyzed together. Each channel contributes its average
 * absolute amplitude to the current block, and the final peak
 * value is the average across all channels.
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
        !audioBuffer.length ||
        !audioBuffer.numberOfChannels
    ) {

        return [];
    }


    const channelCount =
        audioBuffer.numberOfChannels;


    const safePeakCount =
        Math.max(
            1,
            Math.min(
                peakCount,
                audioBuffer.length
            )
        );


    const blockSize =
        Math.max(
            1,
            Math.floor(
                audioBuffer.length /
                safePeakCount
            )
        );


    const channelData = [];


    for (
        let channelIndex = 0;
        channelIndex < channelCount;
        channelIndex += 1
    ) {

        channelData.push(
            audioBuffer.getChannelData(
                channelIndex
            )
        );
    }


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
                ? audioBuffer.length
                : Math.min(
                    audioBuffer.length,
                    start + blockSize
                );


        let totalAmplitude =
            0;


        let sampleCount =
            0;


        for (
            let sampleIndex = start;
            sampleIndex < end;
            sampleIndex += 1
        ) {

            let sampleAmplitude =
                0;


            for (
                let channelIndex = 0;
                channelIndex < channelData.length;
                channelIndex += 1
            ) {

                sampleAmplitude +=
                    Math.abs(
                        channelData[channelIndex][
                            sampleIndex
                        ]
                    );
            }


            sampleAmplitude /=
                channelData.length;


            totalAmplitude +=
                sampleAmplitude;


            sampleCount += 1;
        }


        peaks.push(
            sampleCount > 0
                ? totalAmplitude / sampleCount
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


    /**
     * Resize Canvas for the current CSS size
     * and device pixel ratio.
     *
     * @returns {{
     *     context: CanvasRenderingContext2D,
     *     width: number,
     *     height: number
     * }}
     */
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


    /**
     * Render waveform bars.
     */
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


            context.fillStyle =
                "rgba(222, 238, 176, 0.66)";


            context.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );
        }
    }


    /**
     * Replace current waveform peaks.
     *
     * @param {number[]} nextPeaks
     */
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


    /**
     * Clear waveform.
     */
    function clear() {

        peaks =
            [];


        render();
    }


    /**
     * Re-render waveform after resize.
     */
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
