import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DOMAIN = 'zooberiahsystems.com';
const PHONE = '525522699563';
const DISPLAY_PHONE = '+52 55 2269 9563';
const ROUTES = [
  { path: '/', pageId: 'default' },
  { path: '/404', pageId: 'not-found' },
];
const PAGE_IDS = ROUTES.map(({ pageId }) => pageId);
const REQUIRED_PAGE_FILES = [
  'page-config.json',
  'components.json',
  'variables.json',
  'angora-combos.json',
  'i18n/es.json',
];
const HOME_SECTIONS = [
  'consultoria',
  'soluciones',
  'aplicaciones',
  'como-trabajamos',
  'nosotros',
  'preguntas-frecuentes',
  'contacto',
];
const EVENT_NAMES = [
  'page_view',
  'nav_click',
  'section_view',
  'scroll_depth',
  'faq_open',
  'cta_click',
  'whatsapp_click',
];
const TRACK_FIELDS = ['language', 'platform', 'screenWidth', 'screenHeight', 'timezone'];
const GENERAL_MESSAGE = 'Hola, ZooBeriah Systems. Me interesa conocer sus servicios de consultoría tecnológica, datos e IA o una solución digital para mi negocio. ¿Podemos conversar sobre mi proyecto?';
const WHATSAPP_MESSAGES = new Set([
  GENERAL_MESSAGE,
  'Hola, ZooBeriah Systems. Me interesa conversar sobre consultoría tecnológica para mi negocio.',
  'Hola, ZooBeriah Systems. Me interesa conversar sobre consultoría de datos para mi negocio.',
  'Hola, ZooBeriah Systems. Me interesa conversar sobre un proyecto de IA para mi negocio.',
  'Hola, ZooBeriah Systems. Me interesa conversar sobre Zooblog para mi negocio.',
]);

const fixtureUrl = (relativePath) => new URL(`../${relativePath}`, import.meta.url);
const readJson = (relativePath) => {
  const url = fixtureUrl(relativePath);
  assert.ok(existsSync(url), `Missing required draft file: ${relativePath}`);
  return JSON.parse(readFileSync(url, 'utf8'));
};
const readText = (relativePath) => readFileSync(fixtureUrl(relativePath), 'utf8');
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const collectStrings = (value) => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectStrings);
};
const collectKeys = (value) => {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (!isRecord(value)) return [];
  return [...Object.keys(value), ...Object.values(value).flatMap(collectKeys)];
};
const localizedSpanish = (value) => typeof value === 'string' ? value : value?.es;
const valueAtPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value);
const robotsTokens = (value) => new Set(localizedSpanish(value).split(',').map((token) => token.trim()));
const allPayloadPaths = () => [
  'site-config.json',
  'components.json',
  'variables.json',
  'angora-combos.json',
  'i18n/es.json',
  ...PAGE_IDS.flatMap((pageId) => REQUIRED_PAGE_FILES.map((file) => `${pageId}/${file}`)),
];
const allPayloads = () => allPayloadPaths().map(readJson);
const allComponents = () => [
  ...readJson('components.json').components,
  ...PAGE_IDS.flatMap((pageId) => readJson(`${pageId}/components.json`).components),
];

test('QA-001 declares only the approved Spanish home and 404 routes', () => {
  const site = readJson('site-config.json');
  assert.equal(site.domain, DOMAIN);
  assert.equal(site.defaultPageId, 'default');
  assert.equal(site.notFoundPageId, 'not-found');
  assert.deepEqual(site.aliases, []);
  assert.deepEqual(site.routes.map(({ path, pageId }) => ({ path, pageId })), ROUTES);
  assert.equal(site.site?.i18n?.defaultLanguage, 'es');
  assert.deepEqual(site.site?.i18n?.supportedLanguages?.map(({ code, label }) => ({ code, label })), [{ code: 'es', label: 'ES' }]);

  const sharedComponents = readJson('components.json').components;
  const skipLink = sharedComponents.find(({ id }) => id === 'skipToMainLink');
  assert.equal(skipLink?.config?.href, '#main-content');
  assert.equal(skipLink?.eventInstructions, 'skipToMain:main-content');
  assert.deepEqual(site.runtime?.navigation?.scrollRestoration, { mode: 'preserve', behavior: 'auto' });

  for (const id of ['brandLink', 'footerBrandLink']) {
    const link = sharedComponents.find((component) => component.id === id);
    assert.deepEqual(link?.config?.scrollRestoration, { mode: 'top', behavior: 'auto' });
  }

  for (const pageId of PAGE_IDS) {
    for (const file of REQUIRED_PAGE_FILES) assert.ok(existsSync(fixtureUrl(`${pageId}/${file}`)), `${pageId}/${file}`);
    const page = readJson(`${pageId}/page-config.json`);
    assert.equal(page.domain, DOMAIN);
    assert.equal(page.pageId, pageId);
    assert.deepEqual(page.rootIds, ['skipToMainLink', 'siteHeader', 'pageStack', 'siteFooter']);

    const pageComponents = readJson(`${pageId}/components.json`).components;
    const effectiveIds = new Set([...sharedComponents, ...pageComponents].map(({ id }) => id));
    for (const rootId of page.rootIds) assert.ok(effectiveIds.has(rootId), `${pageId} root ${rootId} must resolve`);

    const pageMain = pageComponents.find(({ id }) => id === 'pageStack');
    assert.equal(pageMain?.config?.tag, 'main');
    assert.equal(pageMain?.config?.id, 'main-content');
    assert.equal(pageMain?.config?.role, 'main');
    assert.equal(pageMain?.config?.tabindex, -1);

    if (pageId === 'not-found') {
      const homeLink = pageComponents.find(({ id }) => id === 'notFoundHome');
      assert.deepEqual(homeLink?.config?.scrollRestoration, { mode: 'top', behavior: 'auto' });
    }
  }
});

test('QA-002 preserves the approved brand, one-page sections, products and applications', () => {
  const payloads = allPayloads();
  const copy = collectStrings(payloads).join('\n');
  assert.match(copy, /ZooBeriah Systems/);
  assert.match(copy, /Tecnología, datos e IA para dar el siguiente paso\./);
  assert.doesNotMatch(copy, /ZooBeriha|Zooberiha|Zooberiah Systems/);

  const home = readJson('default/page-config.json');
  assert.deepEqual(home.analytics?.sectionIds, HOME_SECTIONS);
  assert.deepEqual(home.analytics?.scrollMilestones, [25, 50, 75, 100]);
  const sectionIds = new Set(readJson('default/components.json').components.map(({ config }) => config?.id).filter(Boolean));
  for (const sectionId of HOME_SECTIONS) assert.ok(sectionIds.has(sectionId), `Missing home section #${sectionId}`);

  const consultingGrid = readJson('default/components.json').components.find(({ id }) => id === 'consultingGrid');
  assert.match(consultingGrid?.config?.classes ?? '', /ank-gridTemplateColumns-lg-repeatSD3COM1frED/);

  for (const name of ['Zoolandingpage', 'Zoositioweb', 'Zooblog', 'Zootiendadigital', 'RoadMap2U', 'Despensa Lista']) {
    assert.ok(copy.includes(name), `Missing approved offering: ${name}`);
  }
});

test('QA-003 keeps verified external destinations and single-owner conversion events', () => {
  const strings = collectStrings(allPayloads());
  for (const url of ['https://zoolandingpage.com.mx/', 'https://zoositioweb.com.mx/planes', 'https://roadmap2u.com']) {
    assert.ok(strings.includes(url), `Missing verified destination: ${url}`);
  }

  const instructions = allComponents().map(({ eventInstructions }) => eventInstructions).filter(Boolean);
  for (const slug of ['zoolandingpage', 'zoositioweb', 'roadmap2u']) {
    const matches = instructions.filter((value) => value === `trackEvent:cta_click,cta,${slug},location,soluciones` || value === `trackEvent:cta_click,cta,${slug},location,aplicaciones`);
    assert.equal(matches.length, 1, `${slug} must emit one cta_click`);
  }
  assert.equal(
    instructions.filter((value) => value === 'trackEventWhen:event.eventData.expanded,true,faq_open,faq,event.eventData.id').length,
    1,
    'FAQ must emit faq_open only when a panel expands',
  );
  assert.equal(instructions.some((value) => value.includes('trackEvent:nav_click')), false, 'anchor navigation is tracked automatically');

  for (const [componentsPath, dictionaryPath] of [
    ['components.json', 'i18n/es.json'],
    ['default/components.json', 'default/i18n/es.json'],
    ['not-found/components.json', 'not-found/i18n/es.json'],
  ]) {
    const dictionary = readJson(dictionaryPath).dictionary;
    const links = readJson(componentsPath).components.filter(({ type, config }) => type === 'link' && config?.target === '_blank');
    for (const link of links) {
      const ariaPath = link.valueInstructions?.match(/set:config\.ariaLabel,i18n,([^;]+)/)?.[1];
      const textPath = link.valueInstructions?.match(/set:config\.text,i18n,([^;]+)/)?.[1];
      const ariaLabel = ariaPath ? valueAtPath(dictionary, ariaPath) : undefined;
      const text = textPath ? valueAtPath(dictionary, textPath) : undefined;
      assert.equal(typeof ariaLabel, 'string', `${link.id} needs a localized aria-label`);
      assert.ok(ariaLabel.includes(text), `${link.id} aria-label must contain its visible label`);
      assert.match(ariaLabel, /; se abre en una pestaña nueva$/i, `${link.id} must announce its new tab`);
    }
  }
});

test('QA-004 uses only approved, encoded WhatsApp URLs and PII-free event metadata', () => {
  const strings = collectStrings(allPayloads());
  const urls = [...new Set(strings.filter((value) => value.startsWith('https://wa.me/')))];
  assert.equal(urls.length, WHATSAPP_MESSAGES.size);
  for (const href of urls) {
    const url = new URL(href);
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, `/${PHONE}`);
    const message = url.searchParams.get('text');
    assert.ok(WHATSAPP_MESSAGES.has(message), `Unapproved WhatsApp message: ${message}`);
    assert.equal(href, `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, 'WhatsApp message must be percent-encoded');
  }
  assert.ok(strings.includes(DISPLAY_PHONE), 'The public fallback phone must be visible and copyable');

  const whatsappEvents = allComponents()
    .map(({ eventInstructions }) => eventInstructions)
    .filter((value) => value?.startsWith('trackEvent:whatsapp_click,'));
  assert.ok(whatsappEvents.length >= WHATSAPP_MESSAGES.size);
  for (const instruction of whatsappEvents) {
    assert.doesNotMatch(instruction, /cta_click/);
    assert.equal(instruction.includes(PHONE), false);
    for (const message of WHATSAPP_MESSAGES) assert.equal(instruction.includes(message), false);
  }
});

test('QA-005 configures consented first-party analytics without a Google destination', () => {
  const site = readJson('site-config.json');
  const analytics = site.runtime?.analytics;
  assert.equal(analytics?.enabled, true);
  assert.equal(analytics?.consentUI, 'toast');
  assert.equal(analytics?.consentSnoozeSeconds, 86400);
  assert.deepEqual(analytics?.track, TRACK_FIELDS);
  assert.deepEqual(analytics?.events, Object.fromEntries(EVENT_NAMES.map((name) => [name, name])));
  assert.deepEqual(analytics?.categories, {
    navigation: 'navigation',
    engagement: 'engagement',
    faq: 'faq',
    cta: 'cta',
  });
  assert.deepEqual(analytics?.quickStats, {
    pageView: { event: 'page_view', path: 'metrics.pageViews', by: 1 },
    events: [
      { name: 'cta_click', path: 'metrics.ctaClicks', by: 1 },
      { name: 'whatsapp_click', path: 'metrics.whatsappClicks', by: 1 },
    ],
  });
  assert.equal(Object.hasOwn(analytics, 'googleTag'), false);

  const consent = readJson('i18n/es.json').dictionary?.consent;
  assert.deepEqual(consent, {
    title: 'Ayúdanos a mejorar este sitio',
    intro: 'Si aceptas, usamos identificadores técnicos seudónimos para medir visitas e interacciones. No registramos el contenido de WhatsApp, tu teléfono, nombre, correo, IP ni ubicación precisa.',
    actions: {
      allow: 'Permitir analítica',
      decline: 'No permitir',
      later: 'Más tarde',
    },
    feedback: {
      snoozed: 'Te preguntaremos de nuevo mañana.',
    },
  });

  const serialized = allPayloadPaths().map(readText).join('\n');
  assert.doesNotMatch(serialized, /"googleTag"|\bG-[A-Z0-9]+\b|\bGT-[A-Z0-9]+\b|\bGTM-[A-Z0-9]+\b/);
  assert.doesNotMatch(serialized, /ank-display-inline(?:Flex|-flex)|ank-width-fitContent|ank-boxShadow-lg|ank-border-1px(?=[\s"])/);
});

test('QA-006 keeps page analytics exact and the 404 free of section or scroll tracking', () => {
  const home = readJson('default/page-config.json');
  const notFound = readJson('not-found/page-config.json');
  assert.deepEqual(home.analytics, { sectionIds: HOME_SECTIONS, scrollMilestones: [25, 50, 75, 100] });
  assert.deepEqual(notFound.analytics, { sectionIds: [], scrollMilestones: [] });

  const notFoundInstructions = readJson('not-found/components.json').components
    .map(({ eventInstructions }) => eventInstructions)
    .filter(Boolean);
  assert.deepEqual(notFoundInstructions.map((value) => value.split(':')[1].split(',')[0]).sort(), ['cta_click', 'whatsapp_click']);
  assert.equal(notFoundInstructions.some((value) => /section_view|scroll_depth|nav_click/.test(value)), false);
});

test('QA-007 is test-only, declares route canonicals and uses route-appropriate robots', () => {
  const site = readJson('site-config.json');
  const home = readJson('default/page-config.json');
  const notFound = readJson('not-found/page-config.json');
  for (const page of [site.site?.seo?.robots, home.seo?.robots]) {
    const tokens = robotsTokens(page);
    assert.ok(tokens.has('noindex'));
    assert.ok(tokens.has('nofollow'));
  }
  assert.deepEqual(robotsTokens(notFound.seo?.robots), new Set(['noindex', 'follow']));
  assert.equal(Object.hasOwn(site.site?.seo ?? {}, 'canonicalOrigin'), false);
  assert.equal(home.seo?.canonical, 'https://test.zoolandingpage.com.mx/?draftDomain=zooberiahsystems.com');
  assert.equal(notFound.seo?.canonical, 'https://test.zoolandingpage.com.mx/404?draftDomain=zooberiahsystems.com');
  assert.equal(Object.hasOwn(home, 'structuredData'), false);
  assert.equal(Object.hasOwn(notFound, 'structuredData'), false);
  assert.ok(site.sitemap?.excludePaths?.includes('/404'));

  const config = readJson('draft-repo.config.json');
  assert.equal(config.branches?.test?.deploys, true);
  assert.equal(config.branches?.test?.environment, 'test');
  assert.equal(config.branches?.main?.deploys, false);
  assert.deepEqual(Object.keys(config.githubVariables ?? {}), ['test']);
});

test('QA-008 excludes unsupported claims, placeholders and personal analytics metadata', () => {
  const payloads = allPayloads();
  const copy = collectStrings(payloads).join('\n');
  assert.doesNotMatch(copy, /lorem ipsum|\bTODO\b|\bTBD\b|replace[_ -]?me|example\.com|placeholder/i);
  assert.doesNotMatch(copy, /24\s*\/\s*7|diagn[oó]stico gratuito|resultados? garantizados?|certificaci[oó]n|cobertura nacional|todo M[eé]xico/i);

  const seoKeys = collectKeys(PAGE_IDS.map((pageId) => readJson(`${pageId}/page-config.json`).seo));
  for (const key of ['address', 'openingHours', 'price', 'priceRange', 'rating', 'email', 'telephone']) {
    assert.equal(seoKeys.includes(key), false, `Unsupported SEO metadata key: ${key}`);
  }

  const metadata = allComponents().map(({ eventInstructions }) => eventInstructions).filter(Boolean).join('\n');
  assert.equal(metadata.includes(PHONE), false);
  assert.equal(metadata.includes(DISPLAY_PHONE), false);
  assert.doesNotMatch(metadata, /@|whatsappMessage|phone|email|nombre|correo/i);
});
