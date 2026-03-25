# Contributing

## Setup

```sh
git clone https://github.com/dy/define-element.git
cd define-element
npm install
npx playwright install chromium
```

## Tests

```sh
npm test            # jsdom unit tests
npm run test:browser # headless Chromium (DSD, shadow DOM, late-define)
```

All tests must pass before submitting a PR.

## Structure

```
define-element.js    # the library (~250 lines, zero deps)
define-element.d.ts  # TypeScript declarations
index.html           # landing page
test/
  test.js            # jsdom test suite
  browser.js         # Playwright runner
  browser.html       # browser-only tests (DSD, late-define)
  nested-each.html   # sprae nested :each regression
docs/
  alternatives.md    # comparison with other approaches
```

## Guidelines

- Keep the library small. Every line should earn its place.
- No build step, no bundler, no dependencies.
- Tests for every behavior. If you fix a bug, add a regression test.
- The library is side-effect only (registers `<define-element>` on import). No exports.
