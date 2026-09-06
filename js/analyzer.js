/* =========================================================
   WM TAPPER
   Track Analyzer
   ========================================================= */


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
     * Future pipeline:
     *
     * File
     *  ↓
     * Decode
     *  ↓
     * BPM detection
     *  ↓
     * Key detection
     *  ↓
     * Confidence
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


        this.isAnalyzing = true;


        try {

            /*
             * Audio analysis will be implemented later.
             */

            return {
                bpm: null,
                key: null,
                confidence: null
            };

        } finally {

            this.isAnalyzing = false;
        }
    }
}
