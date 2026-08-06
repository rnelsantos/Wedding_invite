/**
 * Wedding invitation — interactions & Google integrations.
 */
(function () {
    "use strict";

    var cfg = window.WEDDING_CONFIG || {};

    /* ---------------------------------------------------------
     *  Navigation: scroll state + mobile toggle
     * ------------------------------------------------------- */
    var nav = document.getElementById("nav");
    var navToggle = document.getElementById("navToggle");
    var navLinks = document.getElementById("navLinks");

    window.addEventListener("scroll", function () {
        if (window.scrollY > 60) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }
    });

    if (navToggle) {
        navToggle.addEventListener("click", function () {
            navToggle.classList.toggle("open");
            navLinks.classList.toggle("open");
        });
        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navToggle.classList.remove("open");
                navLinks.classList.remove("open");
            });
        });
    }

    /* ---------------------------------------------------------
     *  Reveal-on-scroll animations
     * ------------------------------------------------------- */
    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );
        revealEls.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add("visible");
        });
    }

    /* ---------------------------------------------------------
     *  Countdown timer
     * ------------------------------------------------------- */
    var target = cfg.eventStart ? cfg.eventStart.getTime() : null;
    var elDays = document.getElementById("cd-days");
    var elHours = document.getElementById("cd-hours");
    var elMins = document.getElementById("cd-mins");
    var elSecs = document.getElementById("cd-secs");

    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function tick() {
        if (!target) return;
        var diff = target - Date.now();
        if (diff <= 0) {
            elDays.textContent = elHours.textContent = "00";
            elMins.textContent = elSecs.textContent = "00";
            return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        var secs = Math.floor((diff % 60000) / 1000);
        elDays.textContent = pad(days);
        elHours.textContent = pad(hours);
        elMins.textContent = pad(mins);
        elSecs.textContent = pad(secs);
    }

    if (target) {
        tick();
        setInterval(tick, 1000);
    }

    /* ---------------------------------------------------------
     *  Save the Date video: swap the placeholder for a real
     *  embed once WEDDING_CONFIG.saveTheDateVideoUrl is set.
     * ------------------------------------------------------- */
    var videoFrame = document.getElementById("videoFrame");
    var videoPlaceholder = document.getElementById("videoPlaceholder");
    if (videoFrame && cfg.saveTheDateVideoUrl) {
        var iframeEl = document.createElement("iframe");
        iframeEl.src = cfg.saveTheDateVideoUrl;
        iframeEl.title = "Save the Date video";
        iframeEl.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframeEl.allowFullscreen = true;
        iframeEl.loading = "lazy";
        videoFrame.replaceChild(iframeEl, videoPlaceholder);
    }

    /* ---------------------------------------------------------
     *  Google Calendar "Add to calendar" link
     * ------------------------------------------------------- */
    function toGCalDate(date) {
        // Format as YYYYMMDDTHHMMSSZ (UTC)
        return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }

    var calBtn = document.getElementById("addToCalendar");
    if (calBtn && cfg.eventStart && cfg.eventEnd) {
        var params = new URLSearchParams({
            action: "TEMPLATE",
            text: (cfg.coupleNames || "Our") + " Wedding",
            dates: toGCalDate(cfg.eventStart) + "/" + toGCalDate(cfg.eventEnd),
            details:
                "We can't wait to celebrate with you! Join us for the wedding of " +
                (cfg.coupleNames || "the happy couple") +
                ".",
            location:
                (cfg.venueName ? cfg.venueName + ", " : "") +
                (cfg.venueAddress || ""),
        });
        calBtn.href =
            "https://calendar.google.com/calendar/render?" + params.toString();
    }

    /* ---------------------------------------------------------
     *  RSVP form -> Google Form submission
     *  Uses a hidden iframe so the browser's no-cors policy
     *  doesn't block the POST and the page doesn't navigate away.
     * ------------------------------------------------------- */
    var form = document.getElementById("rsvpForm");
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("rsvpSubmit");

    function setStatus(message, type) {
        status.textContent = message;
        status.className = "form__status" + (type ? " " + type : "");
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            var gf = cfg.googleForm || {};
            if (
                !gf.actionUrl ||
                gf.actionUrl.indexOf("FORM_ID") !== -1
            ) {
                setStatus(
                    "RSVP isn't connected yet. Add your Google Form details in js/config.js.",
                    "error"
                );
                return;
            }

            submitBtn.disabled = true;
            setStatus("Sending your RSVP…", "");

            // Build a hidden form that targets a hidden iframe.
            var iframeName = "gform_target_" + Date.now();
            var iframe = document.createElement("iframe");
            iframe.name = iframeName;
            iframe.style.display = "none";
            document.body.appendChild(iframe);

            var hiddenForm = document.createElement("form");
            hiddenForm.action = gf.actionUrl;
            hiddenForm.method = "POST";
            hiddenForm.target = iframeName;
            hiddenForm.style.display = "none";

            var data = new FormData(form);
            var entries = gf.entries || {};
            Object.keys(entries).forEach(function (field) {
                var input = document.createElement("input");
                input.type = "hidden";
                input.name = entries[field];
                input.value = data.get(field) || "";
                hiddenForm.appendChild(input);
            });

            document.body.appendChild(hiddenForm);

            var done = false;
            function finish() {
                if (done) return;
                done = true;
                setStatus(
                    "Thank you! Your RSVP has been received. 💛",
                    "success"
                );
                form.reset();
                submitBtn.disabled = false;
                setTimeout(function () {
                    hiddenForm.remove();
                    iframe.remove();
                }, 1000);
            }

            // Google Forms returns an opaque response; the iframe load
            // event is our best signal that the POST completed.
            iframe.addEventListener("load", finish);
            // Fallback in case the load event never fires.
            setTimeout(finish, 2500);

            hiddenForm.submit();
        });
    }
})();
