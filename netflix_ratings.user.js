// ==UserScript==
// @name         Netflix Ratings Overlay (OMDb API)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Show IMDb & Rotten Tomatoes ratings on Netflix title modals
// @match        https://www.netflix.com/*
// @grant        GM_xmlhttpRequest
// @connect      www.omdbapi.com
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // 🔑 Replace this with your own OMDb API key from https://www.omdbapi.com/apikey.aspx
  const API_KEY = 'YOUR_API_KEY_HERE';
  const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
  const CACHE_KEY = 'nf_ratings_cache_v4';
  const DEBOUNCE_MS = 600;

  let lastTitle = '';
  let debounceTimer;
  const cache = loadCache();

  console.log('[Netflix Ratings] Script loaded — Tampermonkey working');

  // ---------------- Cache Helpers ----------------
  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveCache(c) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  }

  function getCached(k) {
    const e = cache[k];
    if (!e) return null;
    if (Date.now() - e.ts > CACHE_TTL) {
      delete cache[k];
      saveCache(cache);
      return null;
    }
    return e.data;
  }

  function setCached(k, data) {
    cache[k] = { ts: Date.now(), data };
    saveCache(cache);
  }

  const sanitize = (s) => (s || '').trim().replace(/\s+/g, ' ');

  // ---------------- OMDb Fetch ----------------
  function fetchRatings(title, callback) {
    const cacheKey = title.toLowerCase();
    const cached = getCached(cacheKey);
    if (cached) return callback(cached);

    console.log('[Netflix Ratings] Fetching:', title);

    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`,
      onload: (resp) => {
        try {
          const data = JSON.parse(resp.responseText);
          setCached(cacheKey, data);
          callback(data);
        } catch (err) {
          console.error('Error parsing OMDb response', err);
          callback(null);
        }
      },
      onerror: () => {
        console.error('Error fetching from OMDb');
        callback(null);
      },
    });
  }

  // ---------------- Badge Creation ----------------
  function createBadge() {
    const div = document.createElement('div');
    div.className = 'nf-ratings-overlay';
    div.style.cssText = `
      display: inline-block;
      background: rgba(0, 0, 0, 0.75);
      color: #e5e5e5;
      font-family: 'Netflix Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 15px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 12px;
      margin-bottom: 6px;
      line-height: 1.2;
    `;
    return div;
  }

  // ---------------- Injection ----------------
  function injectRatings(targetEl, imdb, rt) {
    // Find the left metadata container (year, episodes, etc.)
    const metaLeft = document.querySelector('.previewModal--detailsMetadata-left');
    if (!metaLeft) {
      console.warn('[Netflix Ratings] Metadata container not found');
      return;
    }

    // Remove any existing badge first
    const existing = metaLeft.querySelector('.nf-ratings-overlay');
    if (existing) existing.remove();

    // Create the badge element
    const badge = createBadge();
    let badgeContent = `⭐ IMDb: <strong>${imdb}</strong>`;
    if (rt && rt !== 'N/A')
      badgeContent += ` &nbsp; | &nbsp; 🍅 RT: <strong>${rt}</strong>`;
    badge.innerHTML = badgeContent;

    // Insert it right before the first metadata line (so it sits on top)
    metaLeft.insertBefore(badge, metaLeft.firstChild);

    console.log('[Netflix Ratings] Injected badge above metadata:', badgeContent);
  }

  // ---------------- Title Extraction ----------------
  function findNetflixTitle() {
    const el =
      document.querySelector('div.about-header strong') ||
      document.querySelector('.previewModal--player-titleTreatment-text') ||
      document.querySelector('[data-uia="video-title"]') ||
      document.querySelector('h1.title-title');
    return el ? sanitize(el.textContent) : null;
  }

  // ---------------- Main Logic ----------------
  function processNetflixTitle() {
    const title = findNetflixTitle();
    if (!title || title === lastTitle) return;
    lastTitle = title;

    console.log('[Netflix Ratings] New title detected:', title);

    fetchRatings(title, (data) => {
      if (!data || data.Response === 'False') return;
      const imdb = data.imdbRating || 'N/A';
      const rt =
        data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';
      injectRatings(document.body, imdb, rt);
    });
  }

  // ---------------- Observer ----------------
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processNetflixTitle, DEBOUNCE_MS);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[Netflix Ratings] MutationObserver attached');
})();
