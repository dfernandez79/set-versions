const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const dependencyTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const updateDependencies = (dependencies, version, names) =>
  Object.entries(dependencies).reduce(
    (obj, [name, depVersion]) =>
      Object.assign(obj, {
        [name]: names.includes(name) ? version : depVersion,
      }),
    {}
  );

function updateVersions(version, filesAndPackages) {
  const names = filesAndPackages
    .map(({ contents: { name } }) => name)
    .filter(name => name !== undefined);

  return filesAndPackages.map(({ file, contents }) => {
    const newContents = JSON.parse(JSON.stringify(contents));
    newContents.version = version;
    dependencyTypes.forEach(dep => {
      if (dep in newContents) {
        newContents[dep] = updateDependencies(newContents[dep], version, names);
      }
    });

    return {
      file,
      contents: newContents,
    };
  });
}

async function setVersions(version, packages) {
  const filesAndPackages = await Promise.all(
    packages.map(file =>
      readFile(file).then(contents => ({
        file,
        contents: JSON.parse(contents),
      }))
    )
  );

  const newPackages = updateVersions(version, filesAndPackages);

  return Promise.all(
    newPackages.map(({ file, contents }) =>
      writeFile(file, JSON.stringify(contents, undefined, 2) + '\n')
    )
  );
}

module.exports = setVersions;
