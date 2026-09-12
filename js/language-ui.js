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
        tapKeyAlts,
        tapKeyAltsTitle,
        tapKeyAltsList,
        tapButton,
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

    function updateAnalysisResult(result) {
        analysisResult = result || null;

        renderAnalysisResult();
    }

    function renderAnalysisResult() {
        const language = getCurrentLanguage();
        const text = getTranslations(language);

        if (!analysisResult) {
            if (tapConfidence) {
                tapConfidence.textContent = "";
            }

            if (tapKey) {
                tapKey.textContent = "";
            }

            if (tapKeyAlts) {
                tapKeyAlts.hidden = true;
                tapKeyAlts.setAttribute("hidden", "");
            }

            if (tapKeyAltsList) {
                tapKeyAltsList.innerHTML = "";
            }

            if (tapButton) {
                tapButton.classList.remove("tap-button--has-alts");
            }

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

        /* -----------------------------------------
           Alternatives (relative conflict only)
           ----------------------------------------- */

        const alternatives = Array.isArray(analysisResult.alternatives)
            ? analysisResult.alternatives.slice(0, 2)
            : [];

        const shouldShowAlts =
            analysisResult.hasTonalityConflict && alternatives.length > 0;

        if (shouldShowAlts && tapKeyAlts && tapKeyAltsList) {
            if (tapKeyAltsTitle) {
                tapKeyAltsTitle.textContent =
                    text.alsoPossible || "Also possible";
            }

            tapKeyAltsList.innerHTML = "";

            alternatives.forEach((item) => {
                if (!item?.key || !item?.scale) {
                    return;
                }

                const row = document.createElement("span");
                row.className = "tap-button__alt";

                const keySpan = document.createElement("span");
                keySpan.textContent = formatAnalysisKey(
                    item.key,
                    item.scale,
                    language,
                );

                row.appendChild(keySpan);

                if (Number.isFinite(item.strength)) {
                    const strengthSpan = document.createElement("span");
                    strengthSpan.className = "tap-button__alt-strength";
                    strengthSpan.textContent = `${Math.round(item.strength * 100)}%`;
                    row.appendChild(strengthSpan);
                }

                tapKeyAltsList.appendChild(row);
            });

            tapKeyAlts.hidden = false;
            tapKeyAlts.removeAttribute("hidden");

            if (tapButton) {
                tapButton.classList.add("tap-button--has-alts");
            }
        } else {
            if (tapKeyAlts) {
                tapKeyAlts.hidden = true;
                tapKeyAlts.setAttribute("hidden", "");
            }

            if (tapKeyAltsList) {
                tapKeyAltsList.innerHTML = "";
            }

            if (tapButton) {
                tapButton.classList.remove("tap-button--has-alts");
            }
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
            "downtempo-ambient": text.genreDowntempoAmbient,
            "hip-hop-trap": text.genreHipHopTrap,
            pop: text.genrePop,
            rock: text.genreRock,
            house: text.genreHouse,
            techno: text.genreTechno,
            trance: text.genreTrance,
            dubstep: text.genreDubstep,
            hardstyle: text.genreHardstyle,
            "drum-and-bass": text.genreDrumAndBass,
            hardcore: text.genreHardcore,
            frenchcore: text.genreFrenchcore,
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
    };
}
