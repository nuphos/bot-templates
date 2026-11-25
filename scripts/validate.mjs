#!/usr/bin/env node
// Validates every template in templates/. No dependencies; needs Node 20+.
// The rules mirror the Nuphos bot bundle schema for templates, plus catalog
// rules that only apply to this repository.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TEMPLATES = join(ROOT, 'templates');
const CATALOG = join(ROOT, 'catalog.json');
const WRITE = process.argv.includes('--write');

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const AVATARS = new Set([
  '01-vermeer-girl.svg', '02-leonardo.svg', '03-mona-lisa.svg', '04-venus.svg', '05-rembrandt.svg',
  '06-beethoven.svg', '07-ada.svg', '08-socrates.svg', '09-frida.svg', '10-van-gogh.svg',
  '11-mozart.svg', '12-newton.svg', '13-shakespeare.svg', '14-napoleon.svg', '15-cleopatra.svg',
  '16-athena.svg', '17-the-scream.svg', '18-american-gothic.svg', '19-the-fifer.svg',
  '20-son-of-man.svg', '21-the-milkmaid.svg', '22-lady-with-an-ermine.svg', '23-girl-with-peaches.svg',
  '24-the-blue-boy.svg', '25-infanta.svg', '26-the-swing.svg', '27-the-astronomer.svg',
  '28-the-sleeping-gypsy.svg', '29-amelia-earhart.svg',
]);
const CATEGORIES = new Set([
  'Getting started', 'Research', 'Writing', 'Marketing', 'Productivity', 'Learning', 'For developers',
]);
// Strings that look like credentials. A template must never carry one.
const SECRET_PATTERNS = [
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
];

let failures = 0;

function check(id, condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`✗ ${id}: ${message}`);
  }
}

const isString = (value, min, max) =>
  typeof value === 'string' && value.trim().length >= min && value.length <= max;
const onlyKeys = (object, allowed) =>
  object && typeof object === 'object' && !Array.isArray(object) &&
  Object.keys(object).every((key) => allowed.includes(key));
const isTimeZone = (value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return typeof value === 'string' && value.length <= 100;
  } catch {
    return false;
  }
};
const unique = (values) => new Set(values).size === values.length;

function readJson(id, file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    check(id, false, `${file.slice(ROOT.length)} is not valid JSON (${error.message})`);
    return undefined;
  }
}

function validateSchedule(id, routine) {
  const where = `schedule "${routine?.key}"`;
  check(id, onlyKeys(routine, ['key', 'name', 'prompt', 'requestedEnabled', 'timeZone', 'schedule']), `${where} has unknown fields`);
  check(id, KEY.test(routine.key ?? '') && routine.key.length <= 64, `${where} key must be kebab-case`);
  check(id, isString(routine.name, 1, 120), `${where} needs a name of 1-120 characters`);
  check(id, isString(routine.prompt, 1, 8000), `${where} needs a prompt of 1-8000 characters`);
  check(id, routine.requestedEnabled !== true, `${where} must ship turned off (requestedEnabled: false)`);
  check(id, isTimeZone(routine.timeZone), `${where} needs an IANA time zone`);
  const { schedule } = routine;
  if (schedule?.kind === 'cron') {
    check(id, onlyKeys(schedule, ['kind', 'expression']) && isString(schedule.expression, 1, 200), `${where} has an invalid cron`);
    check(id, schedule.expression?.trim().split(/\s+/).length === 5, `${where} cron must have five fields`);
  } else if (schedule?.kind === 'interval') {
    check(
      id,
      onlyKeys(schedule, ['kind', 'seconds']) && Number.isInteger(schedule.seconds) &&
        schedule.seconds >= 180 && schedule.seconds <= 365 * 86400,
      `${where} interval must be 180 seconds to one year`,
    );
  } else {
    check(id, false, `${where} must be a cron or interval schedule`);
  }
}

function validateManifest(id, manifest) {
  check(id, onlyKeys(manifest, ['format', 'version', 'source', 'requirements', 'bots', 'chats']), 'manifest.json has unknown top-level fields');
  check(id, manifest.format === 'nuphos-bot-bundle' && manifest.version === 1, 'format must be "nuphos-bot-bundle" version 1');

  const { source } = manifest;
  check(id, onlyKeys(source, ['application', 'templateId', 'version']), 'source has unknown fields');
  check(id, source?.application === 'nuphos-template', 'source.application must be "nuphos-template"');
  check(id, source?.templateId === id, `source.templateId must match the folder name "${id}"`);
  check(id, SEMVER.test(source?.version ?? ''), 'source.version must be a semantic version such as 1.0.0');

  const requirements = manifest.requirements ?? [];
  check(id, Array.isArray(requirements) && requirements.length <= 64, 'requirements must be a list of at most 64 items');
  for (const item of requirements) {
    check(
      id,
      onlyKeys(item, ['provider', 'required', 'reason']) && KEY.test(item.provider ?? '') &&
        typeof item.required === 'boolean' && isString(item.reason, 1, 1000),
      `requirement "${item?.provider}" needs provider, required and a 1-1000 character reason`,
    );
  }
  check(id, unique(requirements.map((item) => item.provider)), 'each provider can be listed once');

  check(id, (manifest.chats ?? []).length === 0, 'templates cannot contain chats');
  check(id, Array.isArray(manifest.bots) && manifest.bots.length === 1, 'templates contain exactly one Bot');
  const bot = manifest.bots?.[0];
  if (!bot) return;

  check(
    id,
    onlyKeys(bot, ['key', 'name', 'instructions', 'memories', 'schedules', 'manualTasks', 'greeting', 'skills', 'files']),
    'the Bot has unknown fields (avatars go in template.json)',
  );
  check(id, KEY.test(bot.key ?? '') && bot.key.length <= 64, 'Bot key must be kebab-case');
  check(id, isString(bot.name, 1, 120), 'Bot name must be 1-120 characters');
  check(id, isString(bot.instructions, 1, 8000), 'Bot instructions must be 1-8000 characters');
  check(id, bot.greeting === undefined || isString(bot.greeting, 1, 2000), 'greeting must be 1-2000 characters');
  check(id, !(bot.memories ?? []).length, 'templates cannot contain memories');
  check(id, !(bot.files ?? []).length, 'templates cannot contain working files');
  check(id, !(bot.skills ?? []).length, 'skills are not supported in this repository yet');
  check(id, !(bot.manualTasks ?? []).length, 'manual tasks are not supported in this repository yet');

  const schedules = bot.schedules ?? [];
  check(id, Array.isArray(schedules) && schedules.length <= 64, 'at most 64 schedules');
  schedules.forEach((routine) => validateSchedule(id, routine));
  check(id, unique(schedules.map((routine) => routine.key)), 'schedule keys must be unique');
}

function validateCatalog(id, meta) {
  check(
    id,
    onlyKeys(meta, ['author', 'official', 'featured', 'category', 'avatar', 'summary', 'highlights', 'examples']),
    'template.json has unknown fields',
  );
  check(
    id,
    onlyKeys(meta.author, ['name', 'github']) && isString(meta.author?.name, 1, 80) &&
      /^[A-Za-z0-9-]{1,39}$/.test(meta.author?.github ?? ''),
    'author needs a name and a GitHub username',
  );
  check(id, typeof meta.official === 'boolean', 'official must be true or false');
  check(id, meta.featured === undefined || typeof meta.featured === 'boolean', 'featured must be true or false');
  check(id, CATEGORIES.has(meta.category), `category must be one of: ${[...CATEGORIES].join(', ')}`);
  check(id, AVATARS.has(meta.avatar), 'avatar must be one of the built-in Nuphos avatars (see CONTRIBUTING.md)');
  check(id, isString(meta.summary, 10, 140), 'summary must be 10-140 characters');
  for (const [field, min, max] of [['highlights', 2, 5], ['examples', 2, 5]]) {
    const list = meta[field];
    check(
      id,
      Array.isArray(list) && list.length >= min && list.length <= max && list.every((line) => isString(line, 3, 200)),
      `${field} must list ${min}-${max} lines of up to 200 characters`,
    );
  }
}

// catalog.json lists every template the way the Nuphos app and nuphos.ai show it,
// so they can read one file instead of every folder. It is generated from the
// folders: run `node scripts/validate.mjs --write` after changing a template.
const catalog = [];

const ids = readdirSync(TEMPLATES).filter((name) => statSync(join(TEMPLATES, name)).isDirectory()).sort();
for (const id of ids) {
  check(id, KEY.test(id) && id.length <= 64, 'folder name must be kebab-case');
  const files = readdirSync(join(TEMPLATES, id)).sort();
  check(id, files.join(',') === 'manifest.json,template.json', 'folder must hold only manifest.json and template.json');

  const manifestPath = join(TEMPLATES, id, 'manifest.json');
  const metaPath = join(TEMPLATES, id, 'template.json');
  for (const file of [manifestPath, metaPath]) {
    const text = readFileSync(file, 'utf8');
    check(id, !SECRET_PATTERNS.some((pattern) => pattern.test(text)), `${file.slice(ROOT.length)} looks like it contains a credential`);
  }

  const manifest = readJson(id, manifestPath);
  const meta = readJson(id, metaPath);
  if (manifest) validateManifest(id, manifest);
  if (meta) validateCatalog(id, meta);
  if (manifest && meta) {
    catalog.push({
      id,
      version: manifest.source?.version,
      name: manifest.bots?.[0]?.name,
      ...meta,
      requirements: manifest.requirements ?? [],
    });
  }
}

const catalogText = `${JSON.stringify({ templates: catalog }, null, 2)}\n`;
if (WRITE && !failures) writeFileSync(CATALOG, catalogText);
let current = '';
try {
  current = readFileSync(CATALOG, 'utf8');
} catch {
  // Reported below as out of date.
}
check('catalog.json', current === catalogText, 'is out of date; run `node scripts/validate.mjs --write`');

if (failures) {
  console.error(`\n${failures} problem(s) in ${ids.length} template(s).`);
  process.exit(1);
}
console.log(`✓ ${ids.length} template(s) valid.`);
