# Hot Reload (vendored)

Vendored from [pjeby/hot-reload](https://github.com/pjeby/hot-reload) **v0.3.1** (ISC License, copyright PJ Eby) for developer convenience — it automatically reloads in-development plugins when their files change.

- `main.js`, `manifest.json`, `LICENSE` are byte-identical to the `0.3.1` release (minAppVersion 1.6.7).
- **How it works:** any plugin directory containing `.git` or a `.hotreload` marker is watched; changes to `main.js`/\`styles.css\` disable + re-enable the plugin after ~0.75 s idle. The marker is dev-only — it never ships to end users via the marketplace (only `main.js`/`styles.css` are downloaded).
- **To update:** re-download the files from the upstream release and bump this note.
