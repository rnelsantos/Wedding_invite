/**
 * ============================================================
 *  WEDDING SITE CONFIGURATION
 * ------------------------------------------------------------
 *  Edit the values below to make this invitation your own.
 *  No other file needs to change for the Google integrations
 *  to work.
 * ============================================================
 */
window.WEDDING_CONFIG = {
    /* -------- Couple & event basics -------- */
    coupleNames: "Jude & Nicaela",

    /* Ceremony start (local time). Format: YYYY, MM(0-11), DD, HH, MM */
    eventStart: new Date(2026, 8, 12, 16, 0), // Sep 12 2026, 4:00 PM
    eventEnd: new Date(2026, 8, 12, 23, 0), // Sep 12 2026, 11:00 PM

    venueName: "Enchanted Castle Estate",
    venueAddress: "1260 Channel Drive, Santa Barbara, CA 93108",

    /* -------------------------------------------------------
     *  SAVE THE DATE VIDEO
     * -------------------------------------------------------
     *  Paste a YouTube (or Google Drive) embed URL here once
     *  the video is ready. Until then, the site shows a
     *  "coming soon" placeholder automatically.
     * ----------------------------------------------------- */
    saveTheDateVideoUrl: "", // e.g. "https://www.youtube.com/embed/VIDEO_ID"

    /* -------------------------------------------------------
     *  GOOGLE FORM (RSVP) INTEGRATION
     * -------------------------------------------------------
     *  1. Create a Google Form with the questions you want.
     *  2. Click the three-dot menu -> "Get pre-filled link".
     *  3. Fill each field with a placeholder and copy the link.
     *     You'll see parameters like:  entry.123456789=Sample
     *  4. Match each form field to your Google Form's entry ID
     *     below. The action URL is your form's URL with
     *     "/viewform" replaced by "/formResponse".
     * ----------------------------------------------------- */
    googleForm: {
        // Replace FORM_ID with your real form id.
        actionUrl:
            "https://docs.google.com/forms/d/e/FORM_ID/formResponse",

        // Map the site's fields -> your Google Form entry IDs.
        entries: {
            name: "entry.1111111111",
            email: "entry.2222222222",
            attending: "entry.3333333333",
            guests: "entry.4444444444",
            meal: "entry.5555555555",
            message: "entry.6666666666",
        },
    },
};
