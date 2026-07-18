(function () {
  "use strict";

  var lists = Array.from(document.querySelectorAll("[data-scramble-list]"));
  if (!lists.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    lists.forEach(function (list) {
      list.classList.add("is-complete");
    });
    return;
  }

  // Noise is width-matched: each lowercase letter scrambles to a random
  // letter from the same width class, and anything else (capitals,
  // punctuation, digits, spaces) stays fixed. Finer buckets mean each
  // frame's word widths stay within a few px of the real text, so the
  // centered, wrapping headline keeps its line breaks and centering.
  var WIDTH_POOLS = ["ijl", "ftr", "csvxyz", "aeou", "bdghknpq", "mw"];
  var TICK_MS = 45;
  var TARGET_DURATION_MS = 1200;
  var ROW_STAGGER_MS = 100;
  var VIEW_THRESHOLD = 0.6;
  var PAGE_REVEAL_DELAY_MS = 1200;

  var segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

  function splitText(text) {
    if (!segmenter) return Array.from(text);
    return Array.from(segmenter.segment(text), function (part) {
      return part.segment;
    });
  }

  function isWhitespace(character) {
    return /^\s$/u.test(character);
  }

  /* The opening words never scramble. data-scramble-lead is a word count; the
     characters it covers render as real text from the first frame, so the line
     reads as copy resolving out of noise instead of a noise field that later
     turns into words. Returns the character offset the reveal starts from. */
  function leadOffset(characters, wordCount) {
    var index = 0;
    var words = 0;

    while (words < wordCount && index < characters.length) {
      while (index < characters.length && !isWhitespace(characters[index])) index += 1;
      while (index < characters.length && isWhitespace(characters[index])) index += 1;
      words += 1;
    }

    return index;
  }

  function noiseFor(character) {
    for (var i = 0; i < WIDTH_POOLS.length; i++) {
      var pool = WIDTH_POOLS[i];
      if (pool.indexOf(character) >= 0) {
        return pool.charAt(Math.floor(Math.random() * pool.length));
      }
    }
    return character;
  }

  /* Every frame is full length: unresolved characters render as noise, not
     blanks. This keeps centered wrapped text from re-measuring and shifting. */
  function renderFrame(characters, resolvedCount) {
    return characters.map(function (character, index) {
      if (index < resolvedCount) return character;
      return noiseFor(character);
    }).join("");
  }

  function initialiseList(list) {
    var activeTimers = new Set();
    var completedRows = 0;
    var hasPlayed = false;
    var observer = null;

    function clearTimers() {
      activeTimers.forEach(function (timer) {
        clearTimeout(timer);
        clearInterval(timer);
      });
      activeTimers.clear();
    }

    var items = Array.from(list.querySelectorAll("[data-scramble-row]")).map(function (row, index) {
      var source = row.querySelector("[data-scramble-source]");
      var text = source.textContent.trim();
      var characters = splitText(text);
      var lead = leadOffset(characters, parseInt(row.getAttribute("data-scramble-lead"), 10) || 0);
      var visual = document.createElement("span");

      visual.className = "scramble-reveal__visual";
      visual.setAttribute("aria-hidden", "true");
      visual.textContent = text;
      source.insertAdjacentElement("afterend", visual);
      row.style.setProperty("--scramble-delay", (index * ROW_STAGGER_MS) + "ms");

      return {
        text: text,
        characters: characters,
        lead: lead,
        visual: visual
      };
    });

    list.classList.add("is-enhanced");

    function markRowComplete(item, interval) {
      clearInterval(interval);
      activeTimers.delete(interval);
      item.visual.textContent = item.text;
      completedRows += 1;

      if (completedRows === items.length) {
        list.classList.add("is-complete");
      }
    }

    function animateRow(item) {
      var resolvedCount = item.lead;
      // Scale the resolve step so copy length does not extend the duration.
      var step = Math.max(1, Math.ceil((item.characters.length - item.lead) / (TARGET_DURATION_MS / TICK_MS)));

      item.visual.textContent = renderFrame(item.characters, resolvedCount);

      var interval = setInterval(function () {
        resolvedCount += step;
        while (resolvedCount < item.characters.length && isWhitespace(item.characters[resolvedCount])) {
          resolvedCount += 1;
        }

        item.visual.textContent = renderFrame(item.characters, resolvedCount);

        if (resolvedCount >= item.characters.length) {
          markRowComplete(item, interval);
        }
      }, TICK_MS);

      activeTimers.add(interval);
    }

    function scheduleRow(item, delay) {
      var timeout = setTimeout(function () {
        activeTimers.delete(timeout);
        animateRow(item);
      }, delay);

      activeTimers.add(timeout);
    }

    function finishImmediately() {
      clearTimers();
      hasPlayed = true;
      if (observer) observer.disconnect();
      items.forEach(function (item) {
        item.visual.textContent = item.text;
      });
      list.classList.add("is-complete");
    }

    function play() {
      if (hasPlayed) return;
      hasPlayed = true;

      items.forEach(function (item, index) {
        item.visual.textContent = renderFrame(item.characters, item.lead);
        scheduleRow(item, index * ROW_STAGGER_MS);
      });

      list.classList.add("is-running");
    }

    /* Experience reveals use their own case-study card as the trigger and
       wait until that card reaches the top 30% of the viewport. The homepage
       hero has no card and observes its list at the 0.6 threshold. */
    var trigger = list.closest(".case-study") || list;
    var observerOptions = trigger === list
      ? { threshold: VIEW_THRESHOLD }
      : { threshold: 0, rootMargin: "0px 0px -70% 0px" };

    function observeTrigger() {
      if (hasPlayed) return;
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || hasPlayed) return;
          observer.disconnect();
          play();
        });
      }, observerOptions);

      observer.observe(trigger);
    }

    function observeAfterPageReveal() {
      if (hasPlayed) return;
      var timeout = setTimeout(function () {
        activeTimers.delete(timeout);
        observeTrigger();
      }, PAGE_REVEAL_DELAY_MS);
      activeTimers.add(timeout);
    }

    if (!("IntersectionObserver" in window)) {
      finishImmediately();
    } else if (trigger === list) {
      observeTrigger();
    } else if (document.readyState === "complete") {
      observeAfterPageReveal();
    } else {
      window.addEventListener("load", observeAfterPageReveal, { once: true });
    }

    return {
      clearTimers: clearTimers,
      finishImmediately: finishImmediately,
      hasPlayed: function () { return hasPlayed; }
    };
  }

  var contexts = lists.map(initialiseList);

  function handleMotionChange(event) {
    if (!event.matches) return;
    contexts.forEach(function (context) {
      context.finishImmediately();
    });
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(handleMotionChange);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) return;
    contexts.forEach(function (context) {
      if (context.hasPlayed()) context.finishImmediately();
    });
  });

  window.addEventListener("pagehide", function () {
    contexts.forEach(function (context) {
      context.clearTimers();
    });
  });
})();
