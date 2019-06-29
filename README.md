# set-version

A CLI tool to set the version of leaf packages in a monorepo.

## Install

```
yarn add set-versions
```

## Usage

```
set-versions [options] <version> <packages>
```

### Options
`--workspaces` (alias `-w`)

Use workspaces from `package.json`.
If no version is specified, it uses the version from `package.json`.

## Examples

```
$ set-versions 2.0.0 packages/*/package.json
# Set the version of packages/*/package.json to 2.0.0 and also
# updates any dependencies between packages

$ set-versions --workspaces
# Takes the version from root package.json and then updates all the
# leaf packages

$ set-versions 1.5.0 --workspaces
# Set version of the root package.json and leaf packages to 1.5.0
```

## Related

* [Yarn Workspaces](https://yarnpkg.com/lang/en/docs/workspaces/)
