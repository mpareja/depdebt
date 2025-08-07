# depdebt

A high-performance [libyear](https://libyear.com/) dependency debt analyzer for large scale usage across an entire organization.

### Quick start

To compute the libyears for the package in your current directory, run:

```bash
npx depdebt
```

You can specify the `package.json` files to look at on the command-line:

```bash
npx depdebt something/package.json
```

If you have many files to analyze, pipe in a newline delimited list of file paths and pass `-` as the filename:

```bash
find -name package.json -not -path '*/node_modules/*' | npx depdebt -
```

## Usage

`depdebt` inspects `package.json` files to determine the dependencies to analyze. It compares the actual version of a dependency to the latest version available. The number of years between the actual and latest release dates make up the number of libyears. (See [Actual version determination](#actual-version-determination) for more details.)

### Command-Line arguments

```
Usage: depdebt [options] [package.json ...]

Options:
  -t, --tag-precedence <tag>  Tag precedence (default: "latest", allows multiple with left-to-right priority)
  -m, --missing <strategy>    Missing package strategy (default: "throw", supports "ignore")
  -h, --help                  Show this help

If file names are not supplied on the command line, defaults to "package.json". The special file name "-" instructs depdebt to listens for newline delimited file names from stdin.

Examples:
  depdebt
  depdebt package.json
  depdebt -t lts -t latest package.json
  find -name package.json -not -path '*/node_modules/*' | depdebt

Version: 0.3.0
```

### Tag precedence

`depdebt` considers the release tagged with `latest` as the desired version. You can specify an ordered list of tags to consider as latest.

If, for instance, you don't like living life on the wild side, you might want to set the precedence to "lts" and then "latest":

```bash
depdebt -t lts -t latest
```

### Missing package strategy

You can tell `depdebt` to ignore "not found" errors when retrieving package metadata. 

It is useful to ignore "not found" errors for mono-repos. In these cases, the packages are locally-linked, so the dependency cannot be out of date.

To be clear, `depdebt` supports private registries out of the box, so this is not a workaround.

You can ignore missing packages by specifying `ignore` as the missing package strategy: `depdebt -m ignore`.

The final result data includes ignored packages. You can identify ignored packages by looking for a `missing: true` field:

```bash
depdebt | jq '.packages[].dependencies[] | select(.missing == true)'
{
  "name": "@some-org/some-package",
  "spec": "^1.0.0",
  "libyears": 0,
  "missing": true
}
```

### Actual version determination

The presence of a lock file influences the "actual" version of a dependency.

If a `package-lock.json` file is present, `depdebt` uses the version found in the lock file. Otherwise, `depdebt` uses the latest version wanted by the version spec in `package.json`.

For applications deployed _based_ on the `package-lock.json` committed into source control, the `package-lock.json` should certainly be used. For libraries that are later installed based on the `package.json` file, it's best to use the `package.json` version rather than `package-lock.json` version.

### Useful Examples

You're in a monorepo and want a summary of the libyears for the whole repo and packages in the repo:

```bash
$ find -name package.json -not -path '*/node_modules/*' | depdebt - | jq '.packages |= with_entries(.value |= {libyears})'
{
  "packages": {
    "/depdebt/tests/fixtures/mono/packages/pack-c/package.json": {
      "libyears": 0
    },
    "/depdebt/tests/fixtures/mono/packages/pack-a/package.json": {
      "libyears": 0
    },
    "/depdebt/tests/fixtures/mono/packages/pack-b/package.json": {
      "libyears": 0
    },
    "/depdebt/tests/fixtures/mono/package.json": {
      "libyears": 0
    }
  },
  "tagPrecedence": [
    "latest"
  ],
  "missingPackageStrategy": "throw",
  "libyears": 0
}
```

