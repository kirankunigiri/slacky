# slacky
A browser extension with simple improvements for Slack

---

### Development
```
bun i
bun dev
```

- Restart dev server after changing content script website match regex strings
- Assets go in public/ or src/assets/
- If bun install hangs on wxt generating types, run `rm -rf node_modules` and try again

---

### 📚 Libraries
- WXT
- React + TypeScript
- Mantine (component library) with the [MantineHub](https://github.com/RubixCube-Innovations/mantine-theme-builder) Shadcn theme with customizations
- Tailwind
- @webext-core/proxy-service (messaging between content and background scripts)
- Playwright (testing)

---

### ⚛︎ State
**Legend State + WXT Storage**

A custom observable is defined with Legend State that automatically updates and reacts to changes using WXT storage.
Because storage is async, you must ensure that settings are loaded first before using, or the default values will be used for a few ms causing flickering of stale values.
- In react, use the `withStorageLoaded` wrapper to make a component hidden until storage loads. Ex: `const SettingsPage = withStorageLoaded(SettingsPageImpl);` This is used on all top level components (ui pages/content script buttons)
- Outside react, call `await loadStorage()` from `store.ts` before using the settings store

---

### 🧪 Tests

This project uses e2e tests with Playwright.
- Playwright doesn't support browser extension testing for Firefox/Safari, so only chrome is tested
- Each feature has its own test
- To run tests, setup your env file with the required variables in `tests/test-env.ts`. You need to create a Slack channel, and create a new channel for each test so they can run in parallel - see the test file for the naming scheme
- Tests always run a build step and auth step. After running them once, you can skip either in the future with `bun run test:fast` or `bun run SKIP_BUILD=1 SKIP_AUTH=1 playwright test`