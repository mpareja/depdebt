## v0.3.0: show version information (2025-08-07)

### Highlights

- The `--help` usage output includes the depdebt version
- Adds `--version` and `-v` to output the depdebt version

### Commits

- ([`98fb8cf`](https://github.com/mpareja/depdebt/commit/98fb8cf9593784a718b8930ce9a492870bbd2434)) support showing package version

## v0.2.0: Improved monorepo support (2025-08-01)

### Highlights

- ignore `file:` and `workspace:` dependencies that can't be out of date
- support redirected packages with `npm:` version specs
- **BREAKING**: require Node.js >= 22

### Commits

- ([`12fbbe9`](https://github.com/mpareja/depdebt/commit/12fbbe9df30b4a9ebfb30968e324062f1b74e039)) package: bump version to 0.2.0
- ([`e5de441`](https://github.com/mpareja/depdebt/commit/e5de44167c70ff827392d3912091b929bb88041b)) PackageAnalyser: support ignoring workspace references
- ([`4c31080`](https://github.com/mpareja/depdebt/commit/4c310807276390ded70e4587a2c9accbd4332117)) README: add example for summarizing libyears
- ([`ab269b8`](https://github.com/mpareja/depdebt/commit/ab269b811d35f055f747d8cccb7ae19f04897a16)) handle dependencies with "npm:" prefixes
- ([`c0c4930`](https://github.com/mpareja/depdebt/commit/c0c4930a88d0b0c86554636be25423ed6ecd032f)) PackageAnalysis: ignore local file dependencies
- ([`a7b2b9f`](https://github.com/mpareja/depdebt/commit/a7b2b9fb114d4f66c436553e484c01849a5aabba)) PackageAnalysis: remove moved method

## v0.1.2: Account for @npmcli/config changes (2023-11-12)

### Highlights

- `depdebt` depends on `@npmcli/config` internals. Update the usage to account for breaking changes and pin the dependency version.

### Commits

- ([`c1b4ba5`](https://github.com/mpareja/depdebt/commit/c1b4ba58bec06093c78d4ef57aebc84a56d5d0a5)) package: update and pin npm packages since we're using internals

## v0.1.1: Packaging improvements (2023-06-13)

### Highlights

- reduced size: 26.0 kB from 1.6 MB
- corrected GitHub repository URLs

### Commits

- ([`37cf3cb`](https://github.com/mpareja/depdebt/commit/37cf3cbfdad2c8071cead891c8504edcdd3ad2b0)) npmignore: initial commit
- ([`bdf409c`](https://github.com/mpareja/depdebt/commit/bdf409c95f9abf94b114135297aa749a65e5349a)) package: correct github repository urls

## v0.1.0: Initial Release (2023-06-07)

### Highlights

Initial release!

