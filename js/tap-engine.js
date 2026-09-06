/* =========================================================
   WM TAPPER
   Tap Tempo Engine
   ========================================================= */


/* =========================================================
   TAP ENGINE
   ========================================================= */

export class TapEngine {

    constructor() {

        this.tapTimes = [];

        this.sessionTimeout = 3;

        this.historyLength = 12;
    }


    /**
     * Update engine settings.
     *
     * @param {Object} config
     * @param {number} config.sessionTimeout
     * @param {number} config.historyLength
     */
    configure({
        sessionTimeout,
        historyLength
    }) {

        this.sessionTimeout =
            sessionTimeout;

        this.historyLength =
            historyLength;
    }


    /**
     * Register a tap.
     *
     * Real BPM calculation will be implemented
     * in the next stage.
     *
     * @returns {Object}
     */
    registerTap() {

        /*
         * Placeholder.
         */

        return {
            bpm: null,
            averageBpm: null,
            history: []
        };
    }


    /**
     * Reset the current tap session.
     */
    reset() {

        this.tapTimes = [];
    }
}
