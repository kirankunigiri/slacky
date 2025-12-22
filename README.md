# slacky
A browser extension with simple improvements for Slack

### Libraries
- WXT
- React
- TypeScript

### Development
```
bun i
bun dev
```

- Restart dev server after changing content script website match regex strings
- Assets go in public/ or src/assets/
- If bun install hangs on wxt generating types, run `rm -rf node_modules` and try again

### Mantine
Used [MantineHub](https://github.com/RubixCube-Innovations/mantine-theme-builder) Shadcn theme as a base.

### State
Legend State + WXT Storage
A custom observable is defined with Legend State that automatically updates and reacts to changes using WXT storage.
Because storage is async, you must ensure that settings are loaded first before using, or the default values get used.
- In react, see the example at the top of app.tsx on how loading state is observed
- Outside react, call `loadSettings` from `store.ts` before using the settings store