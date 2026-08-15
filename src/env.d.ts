/**
 * Build-time flag injected by esbuild `--define`:
 *   - dev build (`npm run build` / `npm run dev`)  -> true  (debug command registered)
 *   - release build (`npm run build:release`)        -> false (debug code tree-shaken out)
 */
declare const DEV_MODE: boolean;
