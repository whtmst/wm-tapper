/* =========================================================
   WM TAPPER
   Tap Session Controller
   ========================================================= */


/* =========================================================
   FACTORY
   ========================================================= */

/**
 * Create session controller.
 *
 * @param {Object} dependencies
 * @param {Object} dependencies.tapEngine
 * @param {Function} dependencies.onSessionFinished
 * @returns {Object}
 */
export function createSessionController({
    tapEngine,
    onSessionFinished
}) {

    let sessionTimer = null;


    /* =====================================================
       CLEAR TIMER
       ===================================================== */

    function clear() {

        if (
            sessionTimer !== null
        ) {

            clearTimeout(
                sessionTimer
            );

            sessionTimer = null;
        }
    }


    /* =====================================================
       FINISH SESSION
       ===================================================== */

    function finish() {

        sessionTimer = null;


        const averageBpm =
            tapEngine.getAverageBpm();


        if (
            !Number.isFinite(
                averageBpm
            )
        ) {
            return;
        }


        onSessionFinished(
            averageBpm
        );
    }


    /* =====================================================
       RESTART TIMER
       ===================================================== */

    /**
     * Restart session timeout.
     *
     * @param {number} delaySeconds
     */
    function restart(delaySeconds) {

        clear();


        if (
            !Number.isFinite(
                delaySeconds
            ) ||
            delaySeconds <= 0
        ) {
            return;
        }


        sessionTimer =
            setTimeout(
                () => {

                    finish();

                },
                delaySeconds * 1000
            );
    }


    /* =====================================================
       RESET
       ===================================================== */

    function reset() {

        clear();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {
        clear,
        restart,
        reset,
        finish
    };
}
