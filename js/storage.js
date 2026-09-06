/* =========================================================
   WM TAPPER
   Storage Adapter

   Current backend:
   - Browser localStorage

   Future backend:
   - Tauri Store / JSON

   IMPORTANT:
   The rest of the application must not access
   localStorage directly.
   ========================================================= */

/* =========================================================
   STORAGE ADAPTER
   ========================================================= */

export const storage = {
    /**
     * Read and parse a value from persistent storage.
     *
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        try {
            const rawValue = localStorage.getItem(key);

            if (rawValue === null) {
                return null;
            }

            return JSON.parse(rawValue);
        } catch (error) {
            console.error("WM Tapper: failed to read storage.", error);

            return null;
        }
    },

    /**
     * Save a value to persistent storage.
     *
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("WM Tapper: failed to write storage.", error);
        }
    },

    /**
     * Remove a value from persistent storage.
     *
     * @param {string} key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("WM Tapper: failed to remove storage.", error);
        }
    },
};
