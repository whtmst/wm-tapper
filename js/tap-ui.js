/* =========================================================
   WM TAPPER
   Tap UI
   ========================================================= */


/* =========================================================
   FACTORY
   ========================================================= */

/**
 * Create Tap UI controller.
 *
 * @param {Object} elements
 * @param {HTMLElement} elements.tapValue
 * @param {HTMLElement} elements.averageValue
 * @param {HTMLElement} elements.tapHistory
 * @param {Object} dependencies
 * @param {Object} dependencies.tapEngine
 * @param {Function} dependencies.getCurrentLanguage
 * @param {Function} dependencies.formatBpm
 * @param {Function} dependencies.getTranslations
 * @returns {Object}
 */
export function createTapUI(
    {
        tapValue,
        averageValue,
        tapHistory
    },
    {
        tapEngine,
        getCurrentLanguage,
        formatBpm,
        getTranslations
    }
) {

    /* =====================================================
       TAP DISPLAY
       ===================================================== */

    function showTap() {

        tapValue.textContent =
            getTranslations(
                getCurrentLanguage()
            ).tap;
    }


    /**
     * Display current measured BPM.
     *
     * @param {number|null} bpm
     */
    function showCurrentBpm(bpm) {

        if (
            !Number.isFinite(bpm)
        ) {
            return;
        }


        tapValue.textContent =
            `${Math.round(
                bpm
            )} BPM`;
    }


    /**
     * Display final session average BPM.
     *
     * @param {number|null} bpm
     */
    function showFinalBpm(bpm) {

        if (
            !Number.isFinite(bpm)
        ) {
            return;
        }


        tapValue.textContent =
            `${Math.round(
                bpm
            )} BPM`;
    }


    /**
     * Update average BPM display.
     *
     * @param {number|null} bpm
     */
    function showAverageBpm(bpm) {

        if (
            Number.isFinite(bpm)
        ) {

            averageValue.textContent =
                formatBpm(
                    bpm
                );

        } else {

            averageValue.textContent =
                "—";
        }
    }


    /* =====================================================
       LANGUAGE DISPLAY
       ===================================================== */

    /**
     * Update tap display after language change.
     *
     * Numeric BPM values are preserved.
     *
     * @param {string} language
     */
    function updateLanguage(language) {

        const text =
            getTranslations(
                language
            );


        const currentValue =
            tapValue.textContent.trim();


        const isTapState =
            currentValue === "TAP" ||
            currentValue === "ТАП";


        if (isTapState) {

            tapValue.textContent =
                text.tap;
        }


        showAverageBpm(
            tapEngine.getAverageBpm()
        );
    }


    /* =====================================================
       TAP HISTORY
       ===================================================== */

    /**
     * Render tap history.
     *
     * Horizontal position represents actual
     * time between taps.
     *
     * @param {number[]} timestamps
     */
    function renderTapHistory(timestamps) {

        tapHistory.innerHTML =
            "";


        if (
            !Array.isArray(timestamps) ||
            timestamps.length === 0
        ) {
            return;
        }


        const firstTime =
            timestamps[0];


        const lastTime =
            timestamps[
                timestamps.length - 1
            ];


        const timeRange =
            lastTime -
            firstTime;


        const leftPadding = 6;
        const rightPadding = 6;


        const historyWidth =
            tapHistory.clientWidth;


        const usableWidth =
            Math.max(
                0,
                historyWidth -
                leftPadding -
                rightPadding
            );


        /*
         * One tap has no interval yet.
         */

        if (
            timestamps.length === 1 ||
            timeRange <= 0
        ) {

            createTapPoint(
                50
            );

            return;
        }


        timestamps.forEach(
            (timestamp) => {

                const normalized =
                    (
                        timestamp -
                        firstTime
                    ) /
                    timeRange;


                const x =
                    leftPadding +
                    (
                        normalized *
                        usableWidth
                    );


                const percent =
                    historyWidth > 0
                        ? (
                            x /
                            historyWidth
                        ) * 100
                        : 50;


                createTapPoint(
                    percent
                );
            }
        );


        renderTapConnectors(
            timestamps,
            leftPadding,
            usableWidth,
            historyWidth
        );
    }


    /**
     * Create one tap point.
     *
     * @param {number} leftPercent
     */
    function createTapPoint(leftPercent) {

        const point =
            document.createElement(
                "div"
            );


        point.className =
            "tap-point";


        point.style.left =
            `${leftPercent}%`;


        point.style.top =
            "50%";


        tapHistory.appendChild(
            point
        );
    }


    /**
     * Render connectors between tap points.
     *
     * @param {number[]} timestamps
     * @param {number} leftPadding
     * @param {number} usableWidth
     * @param {number} historyWidth
     */
    function renderTapConnectors(
        timestamps,
        leftPadding,
        usableWidth,
        historyWidth
    ) {

        const firstTime =
            timestamps[0];


        const lastTime =
            timestamps[
                timestamps.length - 1
            ];


        const timeRange =
            lastTime -
            firstTime;


        if (
            timeRange <= 0 ||
            historyWidth <= 0
        ) {
            return;
        }


        for (
            let index = 0;
            index < timestamps.length - 1;
            index += 1
        ) {

            const startNormalized =
                (
                    timestamps[index] -
                    firstTime
                ) /
                timeRange;


            const endNormalized =
                (
                    timestamps[index + 1] -
                    firstTime
                ) /
                timeRange;


            const startX =
                leftPadding +
                (
                    startNormalized *
                    usableWidth
                );


            const endX =
                leftPadding +
                (
                    endNormalized *
                    usableWidth
                );


            const connector =
                document.createElement(
                    "div"
                );


            connector.className =
                "tap-connector";


            connector.style.left =
                `${startX}px`;


            connector.style.width =
                `${Math.max(
                    0,
                    endX - startX
                )}px`;


            connector.style.top =
                "50%";


            tapHistory.appendChild(
                connector
            );
        }
    }


    /* =====================================================
       RESET
       ===================================================== */

    function reset() {

        tapValue.textContent =
            getTranslations(
                getCurrentLanguage()
            ).tap;


        averageValue.textContent =
            "—";


        tapHistory.innerHTML =
            "";
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {
        showTap,
        showCurrentBpm,
        showFinalBpm,
        showAverageBpm,
        updateLanguage,
        renderTapHistory,
        reset
    };
}
