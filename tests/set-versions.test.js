const fs = require('fs');
const path = require('path');
const util = require('util');
const execa = require('execa');

const mkdirp = util.promisify(require('mkdirp'));
const rimraf = util.promisify(require('rimraf'));
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const setVersions = path.resolve(__dirname, '..', 'bin', 'set-versions');
const testFixturePath = path.resolve(__dirname, 'test-fixture');
const testFixturePath2 = path.resolve(__dirname, 'test-fixture-2');

async function createTestFixture(fixturePath, dirs, packages) {
  await mkdirp(fixturePath);
  await Promise.all(
    dirs.map(dir => mkdirp(path.join(fixturePath, 'packages', dir)))
  );

  return Promise.all(
    Object.entries(packages).map(([file, contents]) =>
      writeFile(path.join(fixturePath, file), JSON.stringify(contents))
    )
  );
}

beforeEach(() => {
  const packages = {
    'package.json': {
      version: '2.0.0',
      workspaces: ['packages/*'],
    },
    'packages/a/package.json': {
      name: 'pre-a',
      version: '1.0.0',
    },
    'packages/b/package.json': {
      name: 'pre-b',
      version: '1.0.0',
      dependencies: {
        'pre-a': '1.0.0',
        'other-c': '1.0.0',
        'other-d': '4.1.3',
      },
    },
    'packages/c/package.json': {
      name: 'other-c',
      version: '1.0.0',
    },
  };

  const packages2 = {
    'package.json': {
      version: '5.0.0',
      workspaces: { packages: ['packages/*'] },
    },
    'packages/a/package.json': {
      name: 'pkg-a',
      version: '1.0.0',
    },
    'packages/b/package.json': {
      name: 'pkg-b',
      version: '1.0.0',
      dependencies: {
        'pkg-a': '1.0.0',
      },
    },
  };

  return Promise.all([
    createTestFixture(testFixturePath, ['a', 'b', 'c'], packages),
    createTestFixture(testFixturePath2, ['a', 'b'], packages2),
  ]);
});

afterEach(() =>
  Promise.all([rimraf(testFixturePath), rimraf(testFixturePath2)])
);

test('Set version with version and files args', async () => {
  const packages = [
    path.join(testFixturePath2, 'packages', 'a', 'package.json'),
    path.join(testFixturePath2, 'packages', 'b', 'package.json'),
  ];
  await execa(setVersions, ['5.0.0', ...packages], { cwd: testFixturePath2 });

  const [aPkg, bPkg] = (await Promise.all(
    packages.map(pkgPath => readFile(pkgPath))
  )).map(json => JSON.parse(json));

  expect(aPkg.version).toBe('5.0.0');
  expect(bPkg.version).toBe('5.0.0');
  expect(bPkg.dependencies['pkg-a']).toBe('5.0.0');
});

test('Set versions with --workspaces', async () => {
  await execa(setVersions, ['--workspaces'], { cwd: testFixturePath });

  const [aPkg, bPkg, cPkg] = (await Promise.all([
    readFile(path.join(testFixturePath, 'packages', 'a', 'package.json')),
    readFile(path.join(testFixturePath, 'packages', 'b', 'package.json')),
    readFile(path.join(testFixturePath, 'packages', 'c', 'package.json')),
  ])).map(json => JSON.parse(json));

  expect(aPkg.version).toBe('2.0.0');
  expect(bPkg.version).toBe('2.0.0');
  expect(cPkg.version).toBe('2.0.0');
  expect(bPkg.dependencies['pre-a']).toBe('2.0.0');
  expect(bPkg.dependencies['other-c']).toBe('2.0.0');
  expect(bPkg.dependencies['other-d']).toBe('4.1.3');
});

test('Set versions reading workspace.packages', async () => {
  await execa(setVersions, ['--workspaces'], {
    cwd: testFixturePath2,
  });

  const [aPkg, bPkg] = (await Promise.all([
    readFile(path.join(testFixturePath2, 'packages', 'a', 'package.json')),
    readFile(path.join(testFixturePath2, 'packages', 'b', 'package.json')),
  ])).map(json => JSON.parse(json));

  expect(aPkg.version).toBe('5.0.0');
  expect(bPkg.version).toBe('5.0.0');
  expect(bPkg.dependencies['pkg-a']).toBe('5.0.0');
});

test('Set versions with --workspaces and version', async () => {
  await execa(setVersions, ['6.0.0', '--workspaces'], { cwd: testFixturePath });

  const [rootPkg, aPkg, bPkg, cPkg] = (await Promise.all([
    readFile(path.join(testFixturePath, 'package.json')),
    readFile(path.join(testFixturePath, 'packages', 'a', 'package.json')),
    readFile(path.join(testFixturePath, 'packages', 'b', 'package.json')),
    readFile(path.join(testFixturePath, 'packages', 'c', 'package.json')),
  ])).map(json => JSON.parse(json));

  expect(rootPkg.version).toBe('6.0.0');
  expect(aPkg.version).toBe('6.0.0');
  expect(bPkg.version).toBe('6.0.0');
  expect(cPkg.version).toBe('6.0.0');
  expect(bPkg.dependencies['pre-a']).toBe('6.0.0');
  expect(bPkg.dependencies['other-c']).toBe('6.0.0');
  expect(bPkg.dependencies['other-d']).toBe('4.1.3');
});
