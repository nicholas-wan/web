(function () {
  "use strict";

  var list = document.querySelector("[data-scramble-list]");
  if (!list) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    list.classList.add("is-complete");
    return;
  }

  var CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var TICK_MS = 45;
  var ROW_STAGGER_MS = 100;
  var SCRAMBLE_TAIL = 7;
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

  function randomCharacter() {
    return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }

  function renderFrame(characters, resolvedCount) {
    return characters.map(function (character, index) {
      if (index < resolvedCount) return character;
      if (isWhitespace(character)) return character;
      if (index < resolvedCount + SCRAMBLE_TAIL) return randomCharacter();
      return " ";
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
    var visual = document.createElement("span");

    visual.className = "scramble-reveal__visual";
    visual.setAttribute("aria-hidden", "true");
    visual.textContent = text;
    source.insertAdjacentElement("afterend", visual);
    row.style.setProperty("--scramble-delay", (index * ROW_STAGGER_MS) + "ms");

    return {
      text: text,
      characters: characters,
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
    var resolvedCount = 0;

    item.visual.textContent = renderFrame(item.characters, resolvedCount);

    var interval = setInterval(function () {
      resolvedCount += 1;
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
      item.visual.textContent = renderFrame(item.characters, 0);
      scheduleRow(item, index * ROW_STAGGER_MS);
    });

    list.classList.add("is-running");
  }

  if (!("IntersectionObserver" in window)) {
    finishImmediately();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || hasPlayed) return;
        observer.disconnect();
        play();
      });
    }, { threshold: VIEW_THRESHOLD });

    observer.observe(list);
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
