/* =========================================================
   WM TAPPER
   Analysis Web Worker
   ========================================================= */

import {
    analyzeDecodedBuffer,
    createAudioBufferFromChannels,
} from "./analyzer.js";

self.onmessage = async (event) => {
    try {
        const { channelBuffers, sampleRate, options } = event.data || {};

        if (!channelBuffers || !sampleRate) {
            throw new Error("WM Tapper: worker missing audio payload.");
        }

        const decodedBuffer = createAudioBufferFromChannels(
            channelBuffers,
            sampleRate,
        );

        const result = await analyzeDecodedBuffer(decodedBuffer, options || {});

        self.postMessage({ ok: true, result });
    } catch (error) {
        self.postMessage({
            ok: false,
            error:
                error && typeof error.message === "string"
                    ? error.message
                    : "WM Tapper: worker analysis failed.",
        });
    }
};
