# Vendored libraries

- `three.min.js` — Three.js r158 (MIT, see THREE-LICENSE), the last release
  that ships a classic non-module build. It is vendored so the game runs by
  opening `index.html` directly from disk, with no server, bundler, or
  network. The r150+ "please use ES modules" console warning has been
  stripped from this copy; nothing else is modified.
