# Dynamic JavaScript DOM Logic & RESTful API Client

A product browser built with vanilla ES6+ JavaScript that fetches live data from [FakeStoreAPI](https://fakestoreapi.com).

## Features
- **async/await fetch** with a timeout, normalized `ApiError` messages and an in-memory response cache (`js/api.js`)
- **Real-time search** (debounced), **category tabs** and **sorting**, all updating the DOM without page reloads (`js/app.js`)
- **localStorage state**: cart items, search text, category, sort order and theme survive a refresh (`js/storage.js`)
- **Loading skeletons** while fetching and an **error banner** with a "Try again" button
- Reuses the responsive design tokens and glassmorphism styles from the CSS task

## Project structure
```
index.html
style.css
js/
  api.js       REST calls + error handling
  storage.js   localStorage helpers
  app.js       state, filtering, rendering, events
```

## Run locally
ES modules do not load from `file://`, so serve the folder:
```
python -m http.server 8000
```
Then open http://localhost:8000.

## Test the error state
In DevTools > Network, choose "Offline" and reload to see the error banner. Switch back to "No throttling" and click "Try again".
