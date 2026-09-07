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
 *
 * @param {HTMLElement} elements.sessionControl
 * @param {HTMLElement} elements.sessionMenu
 *
 * @param {HTMLElement} elements.historyControl
 * @param {HTMLElement} elements.historyMenu
 *
 * @param {HTMLElement} elements.analysisMode
 * @param {HTMLElement} elements.analysisModeControl
 * @param {HTMLElement} elements.analysisModeMenu
 *
 * @param {Object} callbacks
 * @param {Function} callbacks.onSessionChange
 * @param {Function} callbacks.onHistoryChange
 * @param {Function} callbacks.onAnalysisModeChange
 *
 * @returns {Object}
 */
export function createDropdownController(
    {
        sessionControl,
        sessionMenu,
        historyControl,
        historyMenu,
        analysisMode,
        analysisModeControl,
        analysisModeMenu,
        analysisGenre,
        analysisGenreControl,
        analysisGenreMenu,
    },
    {
        onSessionChange,
        onHistoryChange,
        onAnalysisModeChange,
        onAnalysisGenreChange,
    },
) {
    /* =====================================================
       SELECTED OPTION
       ===================================================== */

    function updateSelectedOption(menu, value) {
        if (!menu) {
            return;
        }

		menu.querySelectorAll(
		    ".dropdown-option, .analysis-mode__option, .analysis-genre__option",
		).forEach((option) => {
            const isSelected = option.dataset.value === String(value);

            option.classList.toggle("is-selected", isSelected);

            option.setAttribute("aria-selected", String(isSelected));
        });
    }

    /* =====================================================
       CLOSE ALL
       ===================================================== */

		function closeAll() {
		    sessionControl.classList.remove("is-open");
		
		    historyControl.classList.remove("is-open");
		
		    analysisMode.classList.remove("is-open");
		
		    analysisGenre.classList.remove("is-open");
		
		    sessionControl.setAttribute("aria-expanded", "false");
		
		    historyControl.setAttribute("aria-expanded", "false");
		
		    analysisModeControl.setAttribute("aria-expanded", "false");
		
		    analysisGenreControl.setAttribute("aria-expanded", "false");
		}

    /* =====================================================
       TOGGLE
       ===================================================== */

    function toggle(control) {
        const isOpen = control.classList.contains("is-open");

        closeAll();

        if (!isOpen) {
            control.classList.add("is-open");

            control.setAttribute("aria-expanded", "true");
        }
    }

	/* =====================================================
	   ANALYSIS MODE VALUE
	   ===================================================== */
	
	function setAnalysisMode(value) {
	    const normalizedValue = String(value);
	
	    updateSelectedOption(analysisModeMenu, normalizedValue);
	
	    const selectedOption = analysisModeMenu.querySelector(
	        `[data-value="${normalizedValue}"]`,
	    );
	
	    if (selectedOption) {
	        const valueElement =
	            analysisModeControl.querySelector("#analysisModeValue");
	
	        if (valueElement) {
	            valueElement.textContent = selectedOption.textContent.trim();
	        }
	    }
	}
	
	/* =====================================================
	   ANALYSIS GENRE VALUE
	   ===================================================== */
	
	function setAnalysisGenre(value) {
	    const normalizedValue = String(value);
	
	    updateSelectedOption(analysisGenreMenu, normalizedValue);
	
	    const selectedOption = analysisGenreMenu.querySelector(
	        `[data-value="${normalizedValue}"]`,
	    );
	
	    if (selectedOption) {
	        const valueElement =
	            analysisGenreControl.querySelector("#analysisGenreValue");
	
	        if (valueElement) {
	            valueElement.textContent = selectedOption.textContent.trim();
	        }
	    }
	}

    /* =====================================================
       SESSION DROPDOWN
       ===================================================== */

    sessionControl.addEventListener("click", (event) => {
        if (event.target.closest(".dropdown-option")) {
            return;
        }

        event.stopPropagation();

        toggle(sessionControl);
    });

    /* =====================================================
       HISTORY DROPDOWN
       ===================================================== */

    historyControl.addEventListener("click", (event) => {
        if (event.target.closest(".dropdown-option")) {
            return;
        }

        event.stopPropagation();

        toggle(historyControl);
    });

	/* =====================================================
	   ANALYSIS MODE DROPDOWN
	   ===================================================== */
	
	analysisModeControl.addEventListener("click", (event) => {
	    event.stopPropagation();
	
	    toggle(analysisMode);
	});
	
	/* =====================================================
	   ANALYSIS GENRE DROPDOWN
	   ===================================================== */
	
	analysisGenreControl.addEventListener("click", (event) => {
	    event.stopPropagation();
	
	    toggle(analysisGenre);
	});

    /* =====================================================
       SESSION OPTIONS
       ===================================================== */

    sessionMenu.querySelectorAll(".dropdown-option").forEach((option) => {
        option.addEventListener("click", (event) => {
            event.stopPropagation();

            const value = Number(option.dataset.value);

            if (Number.isNaN(value)) {
                return;
            }

            updateSelectedOption(sessionMenu, option.dataset.value);

            onSessionChange(value);

            closeAll();
        });
    });

    /* =====================================================
       HISTORY OPTIONS
       ===================================================== */

    historyMenu.querySelectorAll(".dropdown-option").forEach((option) => {
        option.addEventListener("click", (event) => {
            event.stopPropagation();

            const value = Number(option.dataset.value);

            if (Number.isNaN(value)) {
                return;
            }

            updateSelectedOption(historyMenu, option.dataset.value);

            onHistoryChange(value);

            closeAll();
        });
    });

    /* =====================================================
       ANALYSIS MODE OPTIONS
       ===================================================== */

    analysisModeMenu
        .querySelectorAll(".analysis-mode__option")
        .forEach((option) => {
            option.addEventListener("click", (event) => {
                event.stopPropagation();

                const value = option.dataset.value;

                if (!value) {
                    return;
                }

                setAnalysisMode(value);

                if (typeof onAnalysisModeChange === "function") {
                    onAnalysisModeChange(value);
                }

                closeAll();
            });
        });

	/* =====================================================
	   ANALYSIS GENRE OPTIONS
	   ===================================================== */
	
	analysisGenreMenu
	    .querySelectorAll(".analysis-genre__option")
	    .forEach((option) => {
	        option.addEventListener("click", (event) => {
	            event.stopPropagation();
	
	            const value = option.dataset.value;
	
	            if (!value) {
	                return;
	            }
	
	            setAnalysisGenre(value);
	
	            if (typeof onAnalysisGenreChange === "function") {
	                onAnalysisGenreChange(value);
	            }
	
	            closeAll();
	        });
	    });
	
    /* =====================================================
       OUTSIDE CLICK
       ===================================================== */

    document.addEventListener("click", () => {
        closeAll();
    });

    /* =====================================================
       ESCAPE
       ===================================================== */

    document.addEventListener("keydown", (event) => {
        if (event.code === "Escape") {
            closeAll();
        }
    });

    /* =====================================================
       PUBLIC API
       ===================================================== */

	return {
	    closeAll,
	
	    updateSelectedOption,
	
	    setAnalysisMode,
	
	    setAnalysisGenre,
	};
}
