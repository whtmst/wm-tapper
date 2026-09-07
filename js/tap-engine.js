/* =========================================================
   WM TAPPER
   Tap Tempo Engine
   ========================================================= */

/* =========================================================
   CONSTANTS
   ========================================================= */

const MIN_BPM = 20;
const MAX_BPM = 300;

/*
 * Number of latest intervals used for the
 * current BPM shown on the main button.
 *
 * A small moving average makes the display
 * much more stable than using only the
 * immediately previous tap interval.
 */
const CURRENT_BPM_INTERVALS = 4;

/* =========================================================
   TAP ENGINE
   ========================================================= */

export class TapEngine {
    constructor() {
        this.tapTimes = [];

        this.sessionTimeout = 3;

        this.historyLength = 12;
    }

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    /**
     * Configure engine.
     *
     * @param {Object} config
     * @param {number} config.sessionTimeout
     * @param {number} config.historyLength
     */
    configure({ sessionTimeout, historyLength }) {
        if (Number.isFinite(sessionTimeout) && sessionTimeout > 0) {
            this.sessionTimeout = sessionTimeout;
        }

        if (Number.isInteger(historyLength) && historyLength > 0) {
            this.historyLength = historyLength;
        }

        /*
         * Keep history within the currently
         * configured limit.
         */

        if (this.tapTimes.length > this.historyLength) {
            this.tapTimes = this.tapTimes.slice(-this.historyLength);
        }
    }

    /* =====================================================
       REGISTER TAP
       ===================================================== */

    /**
     * Register a tap.
     *
     * @param {number} timestamp
     * @returns {Object}
     */
    registerTap(timestamp = performance.now()) {
        if (!Number.isFinite(timestamp)) {
            throw new TypeError("WM Tapper: invalid tap timestamp.");
        }

        /* ---------------------------------------------
           First tap
           --------------------------------------------- */

        if (this.tapTimes.length === 0) {
            this.tapTimes.push(timestamp);

            return this.createResult({
                bpm: null,
                isNewSession: true,
            });
        }

        /* ---------------------------------------------
           Session timeout
           --------------------------------------------- */

        const previousTimestamp = this.tapTimes[this.tapTimes.length - 1];

        const interval = timestamp - previousTimestamp;

        const timeout = this.sessionTimeout * 1000;

        if (interval > timeout) {
            /*
             * The old session has ended.
             *
             * This tap becomes the first tap
             * of a completely new session.
             */

            this.tapTimes = [timestamp];

            return this.createResult({
                bpm: null,
                isNewSession: true,
            });
        }

        /* ---------------------------------------------
           Invalid interval
           --------------------------------------------- */

        if (interval <= 0) {
            return this.createResult({
                bpm: null,
                isNewSession: false,
            });
        }

        /* ---------------------------------------------
           Instant BPM
           --------------------------------------------- */

        const instantBpm = 60000 / interval;

        /*
         * Reject physically implausible tap intervals.
         */

        if (instantBpm < MIN_BPM || instantBpm > MAX_BPM) {
            return this.createResult({
                bpm: null,
                isNewSession: false,
            });
        }

        /* ---------------------------------------------
           Store tap
           --------------------------------------------- */

        this.tapTimes.push(timestamp);

        /* ---------------------------------------------
           Limit history
           --------------------------------------------- */

        if (this.tapTimes.length > this.historyLength) {
            this.tapTimes = this.tapTimes.slice(-this.historyLength);
        }

        /* ---------------------------------------------
           Current BPM
           --------------------------------------------- */

        const bpm = this.getCurrentBpm();

        /* ---------------------------------------------
           Result
           --------------------------------------------- */

        return this.createResult({
            bpm,
            isNewSession: false,
        });
    }

    /* =====================================================
       CURRENT BPM
       ===================================================== */

    /**
     * Calculate the current BPM using the latest
     * few intervals.
     *
     * Instead of averaging BPM values directly,
     * we average the actual time intervals and
     * convert that average interval to BPM.
     *
     * @returns {number|null}
     */
    getCurrentBpm() {
        if (this.tapTimes.length < 2) {
            return null;
        }

        const startIndex = Math.max(
            0,
            this.tapTimes.length - CURRENT_BPM_INTERVALS - 1,
        );

        const relevantTimes = this.tapTimes.slice(startIndex);

        if (relevantTimes.length < 2) {
            return null;
        }

        const totalInterval =
            relevantTimes[relevantTimes.length - 1] - relevantTimes[0];

        const intervalCount = relevantTimes.length - 1;

        if (totalInterval <= 0) {
            return null;
        }

        const bpm = (60000 * intervalCount) / totalInterval;

        if (bpm < MIN_BPM || bpm > MAX_BPM) {
            return null;
        }

        return bpm;
    }

    /* =====================================================
       AVERAGE BPM
       ===================================================== */

    /**
     * Calculate the BPM of the complete current
     * session using total elapsed time.
     *
     * This is intentionally NOT the arithmetic
     * average of individual BPM values.
     *
     * @returns {number|null}
     */
    getAverageBpm() {
        if (this.tapTimes.length < 2) {
            return null;
        }

        const firstTime = this.tapTimes[0];

        const lastTime = this.tapTimes[this.tapTimes.length - 1];

        const totalTime = lastTime - firstTime;

        const intervalCount = this.tapTimes.length - 1;

        if (totalTime <= 0 || intervalCount <= 0) {
            return null;
        }

        const bpm = (60000 * intervalCount) / totalTime;

        if (bpm < MIN_BPM || bpm > MAX_BPM) {
            return null;
        }

        return bpm;
    }

    /* =====================================================
       HISTORY
       ===================================================== */

    /**
     * Get tap history timestamps.
     *
     * @returns {number[]}
     */
    getHistory() {
        return [...this.tapTimes];
    }

    /* =====================================================
       RESULT
       ===================================================== */

    /**
     * Create standardized engine result.
     *
     * @param {Object} data
     * @param {number|null} data.bpm
     * @param {boolean} data.isNewSession
     * @returns {Object}
     */
    createResult({ bpm, isNewSession }) {
        return {
            bpm,

            averageBpm: this.getAverageBpm(),

            history: this.getHistory(),

            isNewSession,
        };
    }

    /* =====================================================
       RESET
       ===================================================== */

    /**
     * Reset current session.
     */
    reset() {
        this.tapTimes = [];
    }
}
