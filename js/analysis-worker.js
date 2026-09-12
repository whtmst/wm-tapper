/* =========================================================
   WM TAPPER
   Analysis Web Worker
   ========================================================= */

/* Minimal DOM stubs — Essentia glue expects them */
if (typeof globalThis.document === "undefined") {
    globalThis.document = {
        currentScript: null,
        getElementsByTagName() {
            return [];
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        createElement() {
            return {
                src: "",
                async: true,
                style: {},
                setAttribute() {},
                addEventListener() {},
                removeEventListener() {},
            };
        },
        head: {
            appendChild() {},
        },
        body: null,
    };
}

if (typeof globalThis.window === "undefined") {
    globalThis.window = globalThis;
}

self.onmessage = async (event) => {
    try {
        const { signalBuffer, signalLength, duration, options } =
            event.data || {};

        if (!signalBuffer || !signalLength) {
            throw new Error(
                "WM Tapper: worker missing mono signal payload.",
            );
        }

        const { analyzeMonoSignal } = await import("./analyzer.js");

        const fullSignal = new Float32Array(signalBuffer, 0, signalLength);

        const result = await analyzeMonoSignal(
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
