// `/` is only the language gate: an inline script redirects before paint, so the page ships
// no app JavaScript — otherwise every visit starts ~10 module preloads the redirect aborts.
export const csr = false;
