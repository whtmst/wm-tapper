/* =========================================================
   WM TAPPER
   Tap Tempo Engine
   ========================================================= */


/* =========================================================
   CONSTANTS
   ========================================================= */

const MIN_BPM = 20;
const MAX_BPM = 300;


/* =========================================================
   TAP ENGINE
   ========================================================= */

export class TapEngine {

    constructor() {

        this.tapTimes = [];

        this.bpmValues = [];

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
    configure({
        sessionTimeout,
        historyLength
    }) {

        if (
            Number.isFinite(sessionTimeout) &&
            sessionTimeout > 0
        ) {

            this.sessionTimeout =
                sessionTimeout;
        }


        if (
            Number.isInteger(historyLength) &&
            historyLength > 0
        ) {

            this.historyLength =
                historyLength;
        }


        /*
         * Keep already collected history
         * within the new configured limit.
         */

        if (
            this.tapTimes.length >
            this.historyLength
        ) {

            this.tapTimes =
                this.tapTimes.slice(
                    -this.historyLength
                );
        }


        if (
            this.bpmValues.length >
            this.historyLength - 1
        ) {

            this.bpmValues =
                this.bpmValues.slice(
                    -(this.historyLength - 1)
                );
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
    registerTap(
        timestamp = performance.now()
    ) {

        if (
            !Number.isFinite(timestamp)
        ) {

            throw new TypeError(
                "WM Tapper: invalid tap timestamp."
            );
        }


        /* ---------------------------------------------
           First tap
           --------------------------------------------- */

        if (
            this.tapTimes.length === 0
        ) {

            this.tapTimes.push(
                timestamp
            );


            return this.createResult({
                bpm: null,
                isNewSession: true
            });
        }


        /* ---------------------------------------------
           Session timeout
           --------------------------------------------- */

        const previousTimestamp =
            this.tapTimes[
                this.tapTimes.length - 1
            ];


        const interval =
            timestamp -
            previousTimestamp;


        const timeout =
            this.sessionTimeout *
            1000;


        if (
            interval > timeout
        ) {

            /*
             * The previous series has ended.
             * This tap becomes the first tap
             * of a completely new series.
             */

            this.tapTimes = [
                timestamp
            ];


            this.bpmValues = [];


            return this.createResult({
                bpm: null,
                isNewSession: true
            });
        }


        /* ---------------------------------------------
           Invalid / unusable interval
           --------------------------------------------- */

        if (
            interval <= 0
        ) {

            return this.createResult({
                bpm: null,
                isNewSession: false
            });
        }


        const bpm =
            60000 /
            interval;


        /*
         * Reject values outside a sensible
         * musical tempo range.
         */

        if (
            bpm < MIN_BPM ||
            bpm > MAX_BPM
        ) {

            return this.createResult({
                bpm: null,
                isNewSession: false
            });
        }


        /* ---------------------------------------------
           Store tap
           --------------------------------------------- */

        this.tapTimes.push(
            timestamp
        );


        this.bpmValues.push(
            bpm
        );


        /* ---------------------------------------------
           Limit history
           --------------------------------------------- */

        if (
            this.tapTimes.length >
            this.historyLength
        ) {

            this.tapTimes =
                this.tapTimes.slice(
                    -this.historyLength
                );
        }


        if (
            this.bpmValues.length >
            this.historyLength - 1
        ) {

            this.bpmValues =
                this.bpmValues.slice(
                    -(this.historyLength - 1)
                );
        }


        /* ---------------------------------------------
           Result
           --------------------------------------------- */

        return this.createResult({
            bpm,
            isNewSession: false
        });
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
    createResult({
        bpm,
        isNewSession
    }) {

        return {
            bpm,

            averageBpm:
                this.getAverageBpm(),

            history:
                this.getHistory(),

            isNewSession
        };
    }


    /* =====================================================
       AVERAGE BPM
       ===================================================== */

    /**
     * Get arithmetic average BPM
     * for the current session.
     *
     * @returns {number|null}
     */
    getAverageBpm() {

        if (
            this.bpmValues.length === 0
        ) {

            return null;
        }


        const total =
            this.bpmValues.reduce(
                (sum, bpm) => {
                    return sum + bpm;
                },
                0
            );


        return (
            total /
            this.bpmValues.length
        );
    }


    /* =====================================================
       HISTORY
       ===================================================== */

    /**
     * Get tap history.
     *
     * Returns timestamps belonging to
     * the current session.
     *
     * @returns {number[]}
     */
    getHistory() {

        return [
            ...this.tapTimes
        ];
    }


    /* =====================================================
       RESET
       ===================================================== */

    /**
     * Reset current session.
     */
    reset() {

        this.tapTimes = [];

        this.bpmValues = [];
    }
}
