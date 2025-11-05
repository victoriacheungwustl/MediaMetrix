# MediaMetrix
# 🎬 Netflix Ratings Chrome Extension

A lightweight Tampermonkey userscript that overlays **IMDb** and **Rotten Tomatoes** ratings directly on Netflix title modals in real time.  
Designed to blend seamlessly into Netflix’s native UI using DOM manipulation and the **MutationObserver** pattern.

---

## 🧠 Overview
This extension detects when a new Netflix title is opened, fetches its ratings from the [OMDb API](https://www.omdbapi.com/), and injects a clean, Netflix-styled badge right above the metadata section (year, episodes, maturity rating, etc.).  

It works automatically as you browse — no page reloads needed.

---

## ⚙️ Features
- 🔄 **Real-time Ratings:** Displays IMDb and Rotten Tomatoes scores for any Netflix title.
- ⚡ **Dynamic Detection:** Uses `MutationObserver` to track SPA (single-page app) updates without reloading.
- 🎨 **Native Look:** Badge styling matches Netflix’s layout for a seamless experience.
- 💾 **Caching:** Locally stores API responses for faster load times and fewer API calls.
- 🧩 **Lightweight:** Entire script < 10KB and runs silently in the background.

---

## 🚀 Installation

### 1️⃣ Prerequisites
- Install [Tampermonkey](https://tampermonkey.net/) (available for Chrome, Edge, or Firefox).
- Get a free [OMDb API key](https://www.omdbapi.com/apikey.aspx).

### 2️⃣ Steps
1. Open Tampermonkey → **Create a new script**.  
2. Paste the contents of [`netflix_ratings.user.js`](netflix_ratings.user.js) from this repository.  
3. Replace:
   ```js
   const API_KEY = "YOUR_API_KEY_HERE";

