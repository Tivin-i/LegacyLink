#!/usr/bin/env node
/**
 * Bump project version (patch | minor | major).
 * Updates package.json and changelog.md. Prints git tag and push commands.
 * Usage: node scripts/bump-version.js [patch|minor|major]
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const bump = process.argv[2];
if (!bump || !["patch", "minor", "major"].includes(bump)) {
  console.error("Usage: node scripts/bump-version.js <patch|minor|major>");
  process.exit(1);
}

const pkgPath = join(root, "package.json");
const changelogPath = join(root, "changelog.md");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

let nextVersion;
if (bump === "major") {
  nextVersion = `${major + 1}.0.0`;
} else if (bump === "minor") {
  nextVersion = `${major}.${minor + 1}.0`;
} else {
  nextVersion = `${major}.${minor}.${patch + 1}`;
}

pkg.version = nextVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

const today = new Date().toISOString().slice(0, 10);
let changelog = readFileSync(changelogPath, "utf8");

const unreleasedHeading = "## [Unreleased]";
if (!changelog.includes(unreleasedHeading)) {
  console.error("changelog.md: no ## [Unreleased] section found.");
  process.exit(1);
}

changelog = changelog.replace(
  unreleasedHeading,
  `## [${nextVersion}] – ${today}`
);

const introBlurb = "All notable changes to LegacyLink are documented here.\n\n";
const afterIntro = introBlurb + "## [";
if (!changelog.includes(afterIntro)) {
  console.error("changelog.md: expected intro then ## [ section.");
  process.exit(1);
}
changelog = changelog.replace(
  afterIntro,
  introBlurb + "## [Unreleased]\n\n## ["
);

writeFileSync(changelogPath, changelog, "utf8");

console.log(`Bumped to ${nextVersion}.`);
console.log("Next: commit package.json and changelog.md, then create and push the tag:");
console.log(`  git add package.json changelog.md && git commit -m "chore: release v${nextVersion}"`);
console.log(`  git tag -a v${nextVersion} -m "Release v${nextVersion}"`);
console.log(`  git push origin main && git push origin v${nextVersion}`);
