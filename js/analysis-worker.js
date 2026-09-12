/* =========================================================
   WM TAPPER
   Analysis Web Worker
   (Essentia: essentia-wasm.es.js — official worker build)
   ========================================================= */

import { EssentiaWASM } from "../lib/essentia/essentia-wasm.es.js";
import Essentia from "../lib/essentia/essentia.js-core.es.js";
import { analyzeMonoSignalWithEssentia } from "./analyzer-worker-api.js";

const essentia = new Essentia(EssentiaWASM);

self.onmessage = async (event) => {
    try {
        const { signalBuffer, signalLength, duration, options } =
            event.data || {};

        if (!signalBuffer || !signalLength) {
            throw new Error(
                "WM Tapper: worker missing mono signal payload.",
            );
        }

        const fullSignal = new Float32Array(signalBuffer, 0, signalLength);

        const result = await analyzeMonoSignalWithEssentia(
            essentia,
            fullSignal,
            Number(duration),
            options || {},
        );

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
