(function () {
  "use strict";

  var list = document.querySelector("[data-scramble-list]");
  if (!list) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    list.classList.add("is-complete");
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
  var activeTimers = new Set();
  var completedRows = 0;
  var hasPlayed = false;

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

  /* Every frame is FULL LENGTH: unresolved characters render as noise, not
     blanks. Blank tails collapse at line ends, which makes centered wrapped
     text re-measure and shift every tick; full-length, width-matched frames
     keep the same word widths so line breaks and centering stay stable. */
  function renderFrame(characters, resolvedCount) {
    return characters.map(function (character, index) {
      if (index < resolvedCount) return character;
      return noiseFor(character);
    }).join("");
  }

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
    // Resolve enough characters per tick that the reveal finishes in about
    // TARGET_DURATION_MS however long the copy is. The lead words are already
    // resolved, so the step scales to what is actually left to reveal.
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

  /* On the experience page the reveal belongs to its dark case-study card,
     and it waits until the reader has scrolled the card to the top of the
     screen: the -70% bottom rootMargin keeps only the top 30% of the
     viewport as the trigger zone, so the card's company header is near the
     viewport top when the animation starts. The homepage hero has no card
     and keeps observing the list at the 0.6 threshold. */
  var trigger = list.closest(".case-study") || list;
  var observerOptions = trigger === list
    ? { threshold: VIEW_THRESHOLD }
    : { threshold: 0, rootMargin: "0px 0px -70% 0px" };

  if (!("IntersectionObserver" in window)) {
    finishImmediately();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || hasPlayed) return;
        observer.disconnect();
        play();
      });
    }, observerOptions);

    observer.observe(trigger);
  }

  function handleMotionChange(event) {
    if (event.matches) {
      if (hasPlayed) {
        finishImmediately();
      } else if (observer) {
        observer.disconnect();
        finishImmediately();
      }
    }
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else if (reducedMotion.addListener) {
    reducedMotion.addListener(handleMotionChange);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && hasPlayed) finishImmediately();
  });
  window.addEventListener("pagehide", clearTimers);
})();
