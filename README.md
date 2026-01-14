# slacky

![Playwright Tests](https://github.com/kirankunigiri/slacky/actions/workflows/playwright.yml/badge.svg)

A browser extension with simple improvements for Slack

Have an idea for a new feature? Feel free to open a PR or [create a new issue](https://github.com/kirankunigiri/slacky/issues/new) for a feature request.

---

### Development
```
bun i
bun dev
```

- Restart dev server after changing content script website match regex strings
- Assets go in public/ or src/assets/

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

Pages
- options.html - The settings menu, accessible by: right-click the extension icon in your browser toolbar to open the context menu -> click options
- popup.html - The settings menu popup, accessible by clicking the extension icon
- settings.html - The settings menu embedded into Slack, accessible from the Slacky icon in the Slack toolbar (injected via content script)
- tutorial.html - The tutorial page, which automatically opens post-installation. Also accessible by clicking "View tutorial" in any settings page

---

### 🧪 Tests

This project uses e2e tests with Playwright
- Playwright doesn't support browser extension testing for Firefox/Safari, so only chrome is tested
- Each feature has its own test
- Tests are unreliable because Slack just may not load sometimes or cause issues with tests. This project's playwright config allows for 2 retries, which is reliable enough to verify if the tests actually work. Tests may be marked as flaky but it's expected.
- Tests run once a week through GitHub actions to ensure there haven't been any UI changes to Slack that break the extension.

Running tests locally
- To run tests, setup your env file with the required variables in `tests/test-env.ts`. You need to create a Slack channel, and create a new channel for each test so they can run in parallel - see the test file for the naming scheme
- You can either use the password login in `--headed` mode to manually solve any potential captcha, or create a testmail.app account and setup your .env (and create a slack account with that email) which will use the magic link auth without any manual intervention needed. CI always uses magic link auth.
- Tests always run a build step and auth step. After running them once, you can skip them in the future with `bun run test:fast` or `bun run SKIP_BUILD=1 SKIP_AUTH=1 playwright test`
- `bun run setup-test:auth-password` for password based auth, `bun run setup-test:auth-magic-link` for magic link auth with testmail.app

My local testing workflow
- `bun run setup-test:build` to build after any code changes
- `bun run setup-test:auth-password` if my Slack login has expired in the playwright browser
- `bun run test:fast` whenever testing with build + auth ready

### Notes
If there ends up being any new features to add, I would migrate this project over to CRXJS. Saving any content script file takes 5+ seconds to reload with WXT and it's basically unusable for development until [support for ESM](https://github.com/wxt-dev/wxt/issues/357) is added.