const readPkgUp = require('read-pkg-up');
const glob = require('glob-promise');
const path = require('path');

async function resolveWorkspaces() {
  const pkgInfo = await readPkgUp();

  if (!('workspaces' in pkgInfo.package)) {
    throw new Error(`Workspaces configuration not found in ${pkgInfo.path}`);
  }

  const rootPath = path.dirname(pkgInfo.path);
  const workspaces = pkgInfo.package.workspaces;
  const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages;

  const packages = (await Promise.all(
    patterns.map(pattern => glob(pattern, { cwd: rootPath }))
  ))
    .reduce((arr, filePaths) => {
      arr.push(...filePaths);
      return arr;
    }, [])
    .map(dir => path.join(rootPath, dir, 'package.json'));

  return {
    root: {
      path: rootPath,
      packagePath: pkgInfo.path,
      package: pkgInfo.package,
    },
    packages,
  };
}

module.exports = resolveWorkspaces;
