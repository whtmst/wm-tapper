/* =========================================================
   WM TAPPER
   Dropdown Controller
   ========================================================= */


/* =========================================================
   FACTORY
   ========================================================= */

/**
 * Create dropdown controller.
 *
 * @param {Object} elements
 * @param {HTMLElement} elements.sessionControl
 * @param {HTMLElement} elements.sessionMenu
 * @param {HTMLElement} elements.historyControl
 * @param {HTMLElement} elements.historyMenu
 * @param {Object} callbacks
 * @param {Function} callbacks.onSessionChange
 * @param {Function} callbacks.onHistoryChange
 * @returns {Object}
 */
export function createDropdownController(
    {
        sessionControl,
        sessionMenu,
        historyControl,
        historyMenu
    },
    {
        onSessionChange,
        onHistoryChange
    }
) {


    /* =====================================================
       SELECTED OPTION
       ===================================================== */

    function updateSelectedOption(
        menu,
        value
    ) {

        if (!menu) {
            return;
        }


        menu
            .querySelectorAll(
                ".dropdown-option"
            )
            .forEach(
                (option) => {

                    const isSelected =
                        option.dataset.value === value;


                    option.classList.toggle(
                        "is-selected",
                        isSelected
                    );


                    option.setAttribute(
                        "aria-selected",
                        String(isSelected)
                    );
                }
            );
    }


    /* =====================================================
       CLOSE
       ===================================================== */

    function closeAll() {

        sessionControl.classList.remove(
            "is-open"
        );

        historyControl.classList.remove(
            "is-open"
        );


        sessionControl.setAttribute(
            "aria-expanded",
            "false"
        );


        historyControl.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    /* =====================================================
       TOGGLE
       ===================================================== */

    function toggle(control) {

        const isOpen =
            control.classList.contains(
                "is-open"
            );


        closeAll();


        if (!isOpen) {

            control.classList.add(
                "is-open"
            );


            control.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }


    /* =====================================================
       SESSION DROPDOWN
       ===================================================== */

    sessionControl.addEventListener(
        "click",
        (event) => {

            if (
                event.target.closest(
                    ".dropdown-option"
                )
            ) {
                return;
            }


            event.stopPropagation();


            toggle(
                sessionControl
            );
        }
    );


    /* =====================================================
       HISTORY DROPDOWN
       ===================================================== */

    historyControl.addEventListener(
        "click",
        (event) => {

            if (
                event.target.closest(
                    ".dropdown-option"
                )
            ) {
                return;
            }


            event.stopPropagation();


            toggle(
                historyControl
            );
        }
    );


    /* =====================================================
       SESSION OPTIONS
       ===================================================== */

    sessionMenu
        .querySelectorAll(
            ".dropdown-option"
        )
        .forEach(
            (option) => {

                option.addEventListener(
                    "click",
                    (event) => {

                        event.stopPropagation();


                        const value =
                            Number(
                                option.dataset.value
                            );


                        if (
                            Number.isNaN(value)
                        ) {
                            return;
                        }


                        onSessionChange(
                            value
                        );


                        closeAll();
                    }
                );
            }
        );


    /* =====================================================
       HISTORY OPTIONS
       ===================================================== */

    historyMenu
        .querySelectorAll(
            ".dropdown-option"
        )
        .forEach(
            (option) => {

                option.addEventListener(
                    "click",
                    (event) => {

                        event.stopPropagation();


                        const value =
                            Number(
                                option.dataset.value
                            );


                        if (
                            Number.isNaN(value)
                        ) {
                            return;
                        }


                        onHistoryChange(
                            value
                        );


                        closeAll();
                    }
                );
            }
        );


    /* =====================================================
       OUTSIDE CLICK
       ===================================================== */

    document.addEventListener(
        "click",
        () => {

            closeAll();
        }
    );


    /* =====================================================
       ESCAPE
       ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.code === "Escape"
            ) {

                closeAll();
            }
        }
    );


    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {
        closeAll,
        updateSelectedOption
    };
}
