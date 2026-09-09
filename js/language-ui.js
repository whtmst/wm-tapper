/* =========================================================
   WM TAPPER
   Language UI
   ========================================================= */

/* =========================================================
   FACTORY
   ========================================================= */

/**
 * Create language UI controller.
 *
 * @param {Object} elements
 * @param {HTMLElement} elements.languageSwitcher
 * @param {HTMLElement} elements.averageLabel
 * @param {HTMLElement} elements.resetButton
 * @param {HTMLElement} elements.analyzeButton
 * @param {HTMLElement} elements.analysisRunButton
 * @param {HTMLElement} elements.analysisModeValue
 * @param {HTMLElement} elements.analysisModeMenu
 * @param {HTMLElement} elements.settingsHeader
 * @param {HTMLElement} elements.tapKeyLabel
 * @param {HTMLElement} elements.sessionLabel
 * @param {HTMLElement} elements.historyLabel
 * @param {HTMLElement} elements.languageLabel
 * @param {HTMLElement} elements.madeByText
 * @param {HTMLElement} elements.sessionValue
 * @param {HTMLElement} elements.sessionMenu
 * @param {HTMLElement} elements.historyValue
 * @param {HTMLElement} elements.historyMenu
 * @param {HTMLElement} elements.tapConfidence
 * @param {HTMLElement} elements.tapKey
 *
 * @param {Object} dependencies
 * @param {Object} dependencies.settings
 * @param {Array<string>} dependencies.supportedLanguages
 * @param {Function} dependencies.getTranslations
 * @param {Function} dependencies.formatDecimal
 * @param {Function} dependencies.formatAnalysisKey
 * @param {Function} dependencies.formatConfidence
 * @param {Object} dependencies.tapKeyController
 * @param {Object} dependencies.tapUI
 * @param {Object} dependencies.dropdowns
 *
 * @returns {Object}
 */
export function createLanguageUI(
    {
        languageSwitcher,
        averageLabel,
        resetButton,
        analyzeButton,
        analysisRunButton,
        analysisModeValue,
        analysisModeMenu,
        settingsHeader,
        tapKeyLabel,
        sessionLabel,
        historyLabel,
        languageLabel,
        madeByText,
        sessionValue,
        sessionMenu,
        historyValue,
        historyMenu,
        tapConfidence,
        tapKey,
        tonalityConflictTip,
        tonalityTooltip,
        tonalityTooltipTitle,
        tonalityTooltipList,
    },
    {
        settings,
        supportedLanguages,
        getTranslations,
        formatDecimal,
        formatAnalysisKey,
        formatConfidence,
        tapKeyController,
        tapUI,
        dropdowns,
    },
) {
    /* =====================================================
       CURRENT LANGUAGE
       ===================================================== */

    function getCurrentLanguage() {
        const language = settings.get("language");

        if (supportedLanguages.includes(language)) {
            return language;
        }

        return "en";
    }

    /* =====================================================
       ANALYSIS RESULT
       ===================================================== */

    let analysisResult = null;

    function hideTonalityTooltip() {
        if (!tonalityTooltip || !tonalityConflictTip) {
            return;
        }

        tonalityTooltip.classList.remove("is-visible");
        tonalityTooltip.setAttribute("aria-hidden", "true");
        tonalityTooltip.hidden = true;

        tonalityConflictTip.classList.remove("is-open");
        tonalityConflictTip.setAttribute("aria-expanded", "false");
    }

    function showTonalityTooltip() {
        if (
            !tonalityTooltip ||
            !tonalityConflictTip ||
            !analysisResult?.hasTonalityConflict
        ) {
            return;
        }

        const language = getCurrentLanguage();
        const text = getTranslations(language);

        if (tonalityTooltipTitle) {
            tonalityTooltipTitle.textContent =
                text.alsoPossible || "Also possible";
        }

        if (tonalityTooltipList) {
            tonalityTooltipList.innerHTML = "";

            const alternatives = Array.isArray(analysisResult.alternatives)
                ? analysisResult.alternatives
                : [];

            alternatives.forEach((item) => {
                if (!item?.key || !item?.scale) {
                    return;
                }

                const li = document.createElement("li");
                li.className = "tonality-tooltip__item";

                const keySpan = document.createElement("span");
                keySpan.textContent = formatAnalysisKey(
                    item.key,
                    item.scale,
                    language,
                );

                const strengthSpan = document.createElement("span");
                strengthSpan.className = "tonality-tooltip__strength";

                if (Number.isFinite(item.strength)) {
                    strengthSpan.textContent = `${Math.round(item.strength * 100)}%`;
                } else {
                    strengthSpan.textContent = "";
                }

                li.appendChild(keySpan);
                li.appendChild(strengthSpan);
                tonalityTooltipList.appendChild(li);
            });
        }

        /* Position relative to the icon */
        const iconRect = tonalityConflictTip.getBoundingClientRect();
        const appWindow = document.querySelector(".app-window");
        const windowRect = appWindow
            ? appWindow.getBoundingClientRect()
            : { left: 0, top: 0 };

        const top = iconRect.bottom - windowRect.top + 6;
        const left = iconRect.left + iconRect.width / 2 - windowRect.left;

        tonalityTooltip.style.top = `${top}px`;
        tonalityTooltip.style.left = `${left}px`;
        tonalityTooltip.style.transform = "translateX(-50%)";

        tonalityTooltip.hidden = false;
        tonalityTooltip.setAttribute("aria-hidden", "false");
        tonalityTooltip.classList.add("is-visible");

        tonalityConflictTip.classList.add("is-open");
        tonalityConflictTip.setAttribute("aria-expanded", "true");
    }

    function updateTonalityTipVisibility() {
        if (!tonalityConflictTip) {
            return;
        }

        const shouldShow =
            analysisResult &&
            analysisResult.hasTonalityConflict &&
            Array.isArray(analysisResult.alternatives) &&
            analysisResult.alternatives.length > 0;

        if (shouldShow) {
            tonalityConflictTip.hidden = false;
            tonalityConflictTip.removeAttribute("hidden");
        } else {
            hideTonalityTooltip();
            tonalityConflictTip.hidden = true;
            tonalityConflictTip.setAttribute("hidden", "");
        }
    }

    function updateAnalysisResult(result) {
        analysisResult = result || null;

        renderAnalysisResult();
    }

    function renderAnalysisResult() {
        const language = getCurrentLanguage();

        if (!analysisResult) {
            if (tapConfidence) {
                tapConfidence.textContent = "";
            }

            if (tapKey) {
                tapKey.textContent = "";
            }

            updateTonalityTipVisibility();

            return;
        }

        /* -----------------------------------------
           Confidence
           ----------------------------------------- */

        if (tapConfidence && Number.isFinite(analysisResult.strength)) {
            tapConfidence.textContent = formatConfidence(
                analysisResult.strength,
                language,
            );
        } else if (tapConfidence) {
            tapConfidence.textContent = "";
        }

        /* -----------------------------------------
           Key
           ----------------------------------------- */

        if (tapKey && analysisResult.key && analysisResult.scale) {
            tapKey.textContent = formatAnalysisKey(
                analysisResult.key,
                analysisResult.scale,
                language,
            );
        } else if (tapKey) {
            tapKey.textContent = "";
        }
    }

    /* =====================================================
       LANGUAGE BUTTONS
       ===================================================== */

    function updateLanguageButtons(language) {
        const buttons = languageSwitcher.querySelectorAll(".language-button");

        buttons.forEach((button) => {
            button.classList.remove("is-active");

            if (button.dataset.language === language) {
                button.classList.add("is-active");
            }
        });
    }

    /* =====================================================
       SESSION DISPLAY
       ===================================================== */

    function updateSessionDisplay() {
        const language = getCurrentLanguage();

        const text = getTranslations(language);

        const value = Number(settings.get("sessionTimeout"));

        sessionValue.textContent = `${formatDecimal(
            value,
            language,
        )} ${text.seconds}`;

        dropdowns.updateSelectedOption(sessionMenu, String(value));
    }

    /* =====================================================
       HISTORY DISPLAY
       ===================================================== */

    function updateHistoryDisplay() {
        const language = getCurrentLanguage();

        const text = getTranslations(language);

        const value = Number(settings.get("historyLength"));

        historyValue.textContent = `${value} ${text.taps}`;

        dropdowns.updateSelectedOption(historyMenu, String(value));
    }

    /* =====================================================
       ANALYSIS MODE DISPLAY
       ===================================================== */

    function updateAnalysisModeDisplay() {
        if (!analysisModeValue || !analysisModeMenu) {
            return;
        }

        const language = getCurrentLanguage();

        const text = getTranslations(language);

        const selectedOption = analysisModeMenu.querySelector(
            ".analysis-mode__option.is-selected",
        );

        if (!selectedOption) {
            return;
        }

        const value = selectedOption.dataset.value;

        if (!value || !text[value]) {
            return;
        }

        analysisModeValue.textContent = text[value];
    }

    /* =====================================================
       DROPDOWN TRANSLATIONS
       ===================================================== */

    function updateDropdownTranslations(language) {
        const text = getTranslations(language);

        /* -----------------------------------------
             Session
             ----------------------------------------- */

        sessionMenu.querySelectorAll(".dropdown-option").forEach((option) => {
            const value = Number(option.dataset.value);

            if (Number.isNaN(value)) {
                return;
            }

            option.textContent = `${formatDecimal(
                value,
                language,
            )} ${text.seconds}`;
        });

        /* -----------------------------------------
             History
             ----------------------------------------- */

        historyMenu.querySelectorAll(".dropdown-option").forEach((option) => {
            const value = Number(option.dataset.value);

            if (Number.isNaN(value)) {
                return;
            }

            option.textContent = `${value} ${text.taps}`;
        });

        /* -----------------------------------------
             Analysis Mode
             ----------------------------------------- */

        analysisModeMenu
            .querySelectorAll(".analysis-mode__option")
            .forEach((option) => {
                const value = option.dataset.value;

                if (!value || !text[value]) {
                    return;
                }

                option.textContent = text[value];
            });

        /* -----------------------------------------
             Analysis Genre
             ----------------------------------------- */

        const genreTranslations = {
            auto: text.genreAuto,
            house: text.genreHouse,
            techno: text.genreTechno,
            trance: text.genreTrance,
            "drum-and-bass": text.genreDrumAndBass,
            dubstep: text.genreDubstep,
            hardstyle: text.genreHardstyle,
            hardcore: text.genreHardcore,
            frenchcore: text.genreFrenchcore,
            "hip-hop-trap": text.genreHipHopTrap,
            pop: text.genrePop,
            rock: text.genreRock,
            "other-electronic": text.genreOtherElectronic,
            other: text.genreOther,
        };

        const analysisGenreMenu = document.getElementById("analysisGenreMenu");
        const analysisGenreValue =
            document.getElementById("analysisGenreValue");

        if (analysisGenreMenu) {
            analysisGenreMenu
                .querySelectorAll(".analysis-genre__option")
                .forEach((option) => {
                    const value = option.dataset.value;
                    const translatedValue = genreTranslations[value];

                    if (!translatedValue) {
                        return;
                    }

                    option.textContent = translatedValue;
                });
        }

        if (analysisGenreValue) {
            const selectedGenre = analysisGenreMenu?.querySelector(
                ".analysis-genre__option.is-selected",
            );

            if (selectedGenre) {
                const value = selectedGenre.dataset.value;
                const translatedValue = genreTranslations[value];

                if (translatedValue) {
                    analysisGenreValue.textContent = translatedValue;
                }
            }
        }

        updateAnalysisModeDisplay();
    }

    /* =====================================================
       SET LANGUAGE
       ===================================================== */

    function setLanguage(language) {
        if (!supportedLanguages.includes(language)) {
            return;
        }

        settings.set("language", language);

        applyLanguage(language);

        updateLanguageButtons(language);
    }

    /* =====================================================
       APPLY LANGUAGE
       ===================================================== */

    function applyLanguage(language) {
        const text = getTranslations(language);

        /* -----------------------------------------
           Front side
           ----------------------------------------- */

        averageLabel.textContent = text.average;

        analyzeButton.textContent = text.analyzeFile;

        resetButton.textContent = text.reset;

        if (analysisRunButton) {
            analysisRunButton.textContent = text.analyze;
        }

        /* -----------------------------------------
           Settings
           ----------------------------------------- */

        settingsHeader.textContent = text.settings;

        tapKeyLabel.textContent = text.tapKey;

        sessionLabel.textContent = text.newSession;

        historyLabel.textContent = text.history;

        languageLabel.textContent = text.language;

        /* -----------------------------------------
           Footer
           ----------------------------------------- */

        if (madeByText) {
            madeByText.textContent = text.madeBy;
        }

        /* -----------------------------------------
           Tap Key
           ----------------------------------------- */

        tapKeyController.updateDisplay();

        /* -----------------------------------------
           Session / History
           ----------------------------------------- */

        updateSessionDisplay();

        updateHistoryDisplay();

        /* -----------------------------------------
           Dropdown translations
           ----------------------------------------- */

        updateDropdownTranslations(language);

        /* -----------------------------------------
           Language buttons
           ----------------------------------------- */

        updateLanguageButtons(language);

        /* -----------------------------------------
           Tap UI
           ----------------------------------------- */

        tapUI.updateLanguage(language);

        /* -----------------------------------------
           Analysis result
           ----------------------------------------- */

        renderAnalysisResult();

        updateTonalityTipVisibility();
    }

    /* =====================================================
       LANGUAGE EVENTS
       ===================================================== */

    languageSwitcher.querySelectorAll(".language-button").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            setLanguage(button.dataset.language);
        });
    });

    /* =====================================================
       TONALITY TIP EVENTS
       ===================================================== */

    if (tonalityConflictTip) {
        tonalityConflictTip.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (tonalityTooltip?.classList.contains("is-visible")) {
                hideTonalityTooltip();
            } else {
                showTonalityTooltip();
            }
        });

        tonalityConflictTip.addEventListener("mouseenter", () => {
            showTonalityTooltip();
        });

        tonalityConflictTip.addEventListener("mouseleave", () => {
            /*
             * A short delay to allow the user
             * to hover over the tooltip itself.
             */

            setTimeout(() => {
                if (
                    tonalityTooltip &&
                    !tonalityTooltip.matches(":hover") &&
                    !tonalityConflictTip.matches(":hover")
                ) {
                    hideTonalityTooltip();
                }
            }, 120);
        });
    }

    if (tonalityTooltip) {
        tonalityTooltip.addEventListener("mouseleave", () => {
            hideTonalityTooltip();
        });
    }

    document.addEventListener("click", (event) => {
        if (
            !tonalityConflictTip ||
            !tonalityTooltip ||
            tonalityConflictTip.contains(event.target) ||
            tonalityTooltip.contains(event.target)
        ) {
            return;
        }

        hideTonalityTooltip();
    });

    /* =====================================================
       PUBLIC API
       ===================================================== */

    return {
        getCurrentLanguage,

        updateLanguageButtons,

        updateSessionDisplay,

        updateHistoryDisplay,

        updateAnalysisModeDisplay,

        updateDropdownTranslations,

        updateAnalysisResult,

        setLanguage,

        applyLanguage,

        hideTonalityTooltip,
    };
}
