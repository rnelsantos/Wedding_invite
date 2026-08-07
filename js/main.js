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
    // Convert any YouTube URL format to embed URL
    function toYTEmbed(url) {
        if (!url) return url;
        if (url.indexOf("youtube.com/embed/") !== -1) return url; // already embed
        var m = url.match(/[?&]v=([^&#]+)/);      // watch?v=ID
        if (m) return "https://www.youtube.com/embed/" + m[1];
        m = url.match(/youtu\.be\/([^?&#]+)/);     // youtu.be/ID
        if (m) return "https://www.youtube.com/embed/" + m[1];
        return url; // pass through as-is
    }

    var videoFrame = document.getElementById("videoFrame");
    var videoPlaceholder = document.getElementById("videoPlaceholder");
    if (videoFrame && cfg.saveTheDateVideoUrl) {
        var iframeEl = document.createElement("iframe");
        // Convert any YouTube URL format to embed and add enablejsapi for music sync
        var _vsrc = toYTEmbed(cfg.saveTheDateVideoUrl);
        _vsrc = _vsrc.indexOf("?") === -1 ? _vsrc + "?enablejsapi=1" :
                _vsrc.indexOf("enablejsapi") === -1 ? _vsrc + "&enablejsapi=1" : _vsrc;
        iframeEl.src = _vsrc;
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

/* ---------------------------------------------------------
 *  Prenup gallery — slow auto-scroll (left → right → reset)
 *  Pauses on any user interaction; resumes after 2.5 s.
 * ------------------------------------------------------- */
(function () {
    var wrap = document.querySelector(".prenup__scroll-wrap");
    if (!wrap) return;

    var speed = 0.35; // px per animation frame — very slow
    var paused = false;
    var resumeTimer;

    function pause() {
        paused = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () {
            paused = false;
        }, 2500);
    }

    // Pause on any manual interaction
    wrap.addEventListener("mousedown",  pause);
    wrap.addEventListener("touchstart", pause, { passive: true });
    wrap.addEventListener("wheel",      pause, { passive: true });

    function tick() {
        if (!paused) {
            var max = wrap.scrollWidth - wrap.clientWidth;
            if (max > 0) {
                if (wrap.scrollLeft >= max - 1) {
                    // Reached the end — reset smoothly to the start
                    wrap.scrollLeft = 0;
                } else {
                    wrap.scrollLeft += speed;
                }
            }
        }
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();

/* ================================================================
 *  PASSWORD GATE
 * ================================================================ */
(function () {
    "use strict";
    var cfg         = window.WEDDING_CONFIG || {};
    var pwGate      = document.getElementById("pwGate");
    var pwForm      = document.getElementById("pwForm");
    var pwInput     = document.getElementById("pwInput");
    var pwError     = document.getElementById("pwError");
    var sitePass    = (cfg.sitePassword || "").trim();

    if (!pwGate) return;

    function unlockSite() {
        pwGate.classList.add("pw-gate--hidden");
        document.body.style.overflow = "";
        try { sessionStorage.setItem("nj_unlocked", "ok:" + sitePass); } catch (e) {}
        window.dispatchEvent(new CustomEvent("siteUnlocked"));
    }

    var alreadyUnlocked = false;
    try { alreadyUnlocked = sessionStorage.getItem("nj_unlocked") === ("ok:" + sitePass); } catch (e) {}

    if (!sitePass || alreadyUnlocked) { unlockSite(); return; }

    document.body.style.overflow = "hidden";
    setTimeout(function () { if (pwInput) pwInput.focus(); }, 100);

    if (pwForm) {
        pwForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var val = pwInput ? pwInput.value.trim() : "";
            if (val === sitePass) {
                unlockSite();
            } else {
                if (pwError) pwError.textContent = "Incorrect password. Please try again. \u2728";
                if (pwInput) {
                    pwInput.value = "";
                    pwInput.classList.remove("pw-gate__input--shake");
                    void pwInput.offsetWidth;
                    pwInput.classList.add("pw-gate__input--shake");
                    pwInput.focus();
                }
            }
        });
    }
})();

/* ================================================================
 *  BACKGROUND MUSIC
 * ================================================================ */
(function () {
    "use strict";
    var cfg        = window.WEDDING_CONFIG || {};
    var musicUrl   = (cfg.bgMusicUrl || "").trim();
    var bgMusic    = document.getElementById("bgMusic");
    var musicBtn   = document.getElementById("musicBtn");
    var musicIcon  = document.getElementById("musicIcon");

    if (!bgMusic || !musicUrl) return;

    bgMusic.src    = musicUrl;
    bgMusic.volume = 0.4;
    if (musicBtn) musicBtn.removeAttribute("hidden");

    var playing    = false;
    var userPaused = false;

    function updateBtn() {
        if (!musicIcon) return;
        musicIcon.innerHTML = playing ? "&#9646;&#9646;" : "&#127925;";
        if (musicBtn) musicBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    }

    function doPlay() {
        var p = bgMusic.play();
        if (p) p.then(function () { playing = true; updateBtn(); }).catch(function () {});
    }

    function doPause(bySystem) {
        if (!bgMusic.paused) bgMusic.pause();
        playing = false;
        if (!bySystem) userPaused = true;
        updateBtn();
    }

    // Expose for video sync
    window._wPause  = function () { doPause(true); };
    window._wResume = function () { if (!userPaused) doPlay(); };

    if (musicBtn) {
        musicBtn.addEventListener("click", function () {
            if (playing) { doPause(false); } else { userPaused = false; doPlay(); }
        });
    }

    // Start after password unlock (user interaction = autoplay allowed)
    window.addEventListener("siteUnlocked", doPlay);

    // If no password / already unlocked, start after a short delay
    var alreadyUnlocked = false;
    try { alreadyUnlocked = sessionStorage.getItem("nj_unlocked") === ("ok:" + (cfg.sitePassword || "")); } catch (e) {};
    if (!(cfg.sitePassword || "") || alreadyUnlocked) setTimeout(doPlay, 300);
})();

/* ================================================================
 *  VIDEO \u2194 MUSIC SYNC  (YouTube postMessage)
 * ================================================================ */
(function () {
    window.addEventListener("message", function (event) {
        try {
            if (typeof event.data !== "string") return;
            var d = JSON.parse(event.data);
            if (d.event === "infoDelivery" && d.info && typeof d.info.playerState !== "undefined") {
                if (d.info.playerState === 1) {
                    if (window._wPause)  window._wPause();   // video playing  \u2192 mute bg
                } else if (d.info.playerState === 2 || d.info.playerState === 0) {
                    if (window._wResume) window._wResume();  // video paused/ended \u2192 resume bg
                }
            }
        } catch (e) {}
    });
})();
