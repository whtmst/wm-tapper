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

        confidence: "CONFIDENCE",

        major: "Major",

        minor: "Minor",

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

        confidence: "УВЕРЕННОСТЬ",

        major: "Мажор",

        minor: "Минор",

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

        confidence: "ƏMİNLİK",

        major: "Major",

        minor: "Minor",

        madeBy: "Wht Mst tərəfindən",
    },
};

/* =========================================================
   NOTE NAMES
   ========================================================= */

/**
 * English note names used by Essentia.
 */
export const englishNoteNames = {
    C: "C",

    "C#": "C#",

    D: "D",

    "D#": "D#",

    E: "E",

    F: "F",

    "F#": "F#",

    G: "G",

    "G#": "G#",

    A: "A",

    "A#": "A#",

    B: "B",
};

/**
 * Russian note names.
 *
 * These are used only for the Russian
 * explanation in parentheses.
 */
export const russianNoteNames = {
    C: "До",

    "C#": "До-диез",

    D: "Ре",

    "D#": "Ре-диез",

    E: "Ми",

    F: "Фа",

    "F#": "Фа-диез",

    G: "Соль",

    "G#": "Соль-диез",

    A: "Ля",

    "A#": "Ля-диез",

    B: "Си",
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

/* =========================================================
   ANALYSIS RESULT HELPERS
   ========================================================= */

/**
 * Format confidence percentage.
 *
 * @param {number} strength
 * @param {string} language
 * @returns {string}
 */
export function formatConfidence(strength, language) {
    if (!Number.isFinite(strength)) {
        return "";
    }

    const text = getTranslations(language);

    return `${Math.round(strength * 100)}% ${text.confidence}`;
}

/**
 * Normalize Essentia scale name.
 *
 * @param {string|null} scale
 * @param {string} language
 * @returns {string}
 */
export function translateScale(scale, language) {
    const text = getTranslations(language);

    if (scale === "major") {
        return text.major;
    }

    if (scale === "minor") {
        return text.minor;
    }

    return typeof scale === "string" ? scale : "";
}

/**
 * Format a detected key according to language.
 *
 * EN:
 * E minor
 *
 * AZ:
 * E MINOR
 *
 * RU:
 * E minor (Ми минор)
 *
 * @param {string|null} key
 * @param {string|null} scale
 * @param {string} language
 * @returns {string}
 */
export function formatAnalysisKey(key, scale, language) {
    if (typeof key !== "string" || typeof scale !== "string") {
        return "";
    }

    const normalizedKey = englishNoteNames[key] || key;

    if (language === "ru") {
        const russianKey = russianNoteNames[key] || key;

        const englishScale =
            scale === "major"
                ? "Major"
                : scale === "minor"
                  ? "Minor"
                  : scale;

        const russianScale =
            scale === "major"
                ? "мажор"
                : scale === "minor"
                  ? "минор"
                  : scale;

        return `${normalizedKey} ${englishScale} (${russianKey} ${russianScale})`;
    }

    const translatedScale = translateScale(scale, language);

    return `${normalizedKey} ${translatedScale}`;
}
