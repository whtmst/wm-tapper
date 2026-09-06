/* =========================================================
   WM TAPPER
   Internationalization
   ========================================================= */

/* =========================================================
   SUPPORTED LANGUAGES
   ========================================================= */

export const supportedLanguages = ["en", "ru", "az"];

/* =========================================================
   TRANSLATIONS
   ========================================================= */

export const translations = {
    /* =====================================================
       ENGLISH
       ===================================================== */

    en: {
        tap: "TAP",

        average: "Average BPM:",

        analyzeFile: "ANALYZE FILE",

        analyze: "ANALYZE",

        reset: "RESET",

        settings: "SETTINGS",

        tapKey: "Tap Key",

        newSession: "New Session After",

        history: "History",

        language: "Language",

        pressKey: "PRESS KEY...",

        seconds: "SEC",

        taps: "TAPS",

        full: "FULL",

        selection: "SELECTION",

        fast: "FAST",

        madeBy: "Made by Wht Mst",
    },

    /* =====================================================
       RUSSIAN
       ===================================================== */

    ru: {
        tap: "ТАП",

        average: "Средний BPM:",

        analyzeFile: "АНАЛИЗ ФАЙЛА",

        analyze: "АНАЛИЗ",

        reset: "СБРОС",

        settings: "НАСТРОЙКИ",

        tapKey: "Клавиша тапа",

        newSession: "Новая серия после",

        history: "История",

        language: "Язык",

        pressKey: "НАЖМИТЕ КЛАВИШУ...",

        seconds: "СЕК",

        taps: "ТАПОВ",

        full: "ВЕСЬ ТРЕК",

        selection: "ФРАГМЕНТ",

        fast: "БЫСТРЫЙ",

        madeBy: "Сделано Wht Mst",
    },

    /* =====================================================
       AZERBAIJANI
       ===================================================== */

    az: {
        tap: "TAP",

        average: "Orta BPM:",

        analyzeFile: "FAYLI TƏHLİL ET",

        analyze: "TƏHLİL ET",

        reset: "SIFIRLA",

        settings: "AYARLAR",

        tapKey: "Tap düyməsi",

        newSession: "Yeni sessiyadan sonra",

        history: "Tarixçə",

        language: "Dil",

        pressKey: "DÜYMƏYƏ BASIN...",

        seconds: "SAN",

        taps: "TAP",

        full: "BÜTÖV TREK",

        selection: "SEÇİM",

        fast: "SÜRƏTLİ",

        madeBy: "Wht Mst tərəfindən",
    },
};

/* =========================================================
   LANGUAGE HELPERS
   ========================================================= */

/**
 * Format a decimal according to language.
 *
 * EN:
 * 3.0
 *
 * RU / AZ:
 * 3,0
 *
 * @param {number} value
 * @param {string} language
 * @returns {string}
 */
export function formatDecimal(value, language) {
    const formatted = value.toFixed(1);

    if (language === "ru" || language === "az") {
        return formatted.replace(".", ",");
    }

    return formatted;
}

/**
 * Get translation object.
 *
 * @param {string} language
 * @returns {Object}
 */
export function getTranslations(language) {
    return translations[language] || translations.en;
}
