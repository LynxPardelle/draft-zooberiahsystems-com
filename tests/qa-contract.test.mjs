import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DOMAIN = 'zooberiahsystems.com';
const PHONE = '525522699563';
const DISPLAY_PHONE = '+52 55 2269 9563';
const ROUTES = [
  { path: '/', pageId: 'default' },
  { path: '/servicios', pageId: 'servicios' },
  { path: '/servicios/zoolandingpage', pageId: 'servicios-zoolandingpage' },
  { path: '/servicios/zoositioweb', pageId: 'servicios-zoositioweb' },
  { path: '/servicios/zooblog', pageId: 'servicios-zooblog' },
  { path: '/sitios-web', pageId: 'sitios-web' },
  { path: '/tiendas-en-linea', pageId: 'tiendas-en-linea' },
  { path: '/soluciones-para-negocios', pageId: 'soluciones-para-negocios' },
  { path: '/soluciones-para-negocios/restaurantes', pageId: 'soluciones-restaurantes' },
  { path: '/soluciones-para-negocios/inventario', pageId: 'soluciones-inventario' },
  { path: '/soluciones-para-negocios/seguimiento-de-solicitudes', pageId: 'soluciones-seguimiento' },
  { path: '/proyectos', pageId: 'proyectos' },
  { path: '/productos', pageId: 'productos' },
  { path: '/blog', pageId: 'blog' },
  { path: '/blog/web', pageId: 'blog-category' },
  { path: '/blog/:categorySlug/:articleSlug', pageId: 'blog-article' },
  { path: '/contacto', pageId: 'contacto' },
  { path: '/404', pageId: 'not-found' },
];
const MARKETING_ROUTES = ROUTES.filter(({ pageId }) => !['default', 'not-found', 'blog', 'blog-category', 'blog-article'].includes(pageId));
const MARKETING_PAGES = MARKETING_ROUTES.map(({ pageId }) => pageId);
const PAGE_IDS = ['default', 'not-found', ...MARKETING_PAGES];
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
  'sitios-web',
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
  'Hola, ZooBeriah Systems. Quiero cotizar una tienda en línea a medida para mi negocio.',
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
const classTokens = (value) => String(value ?? '').split(/\s+/).filter(Boolean);
const rgb = (hex) => {
  const clean = hex.replace('#', '').slice(0, 6);
  assert.match(clean, /^[0-9a-f]{6}$/i);
  return [0, 2, 4].map((index) => Number.parseInt(clean.slice(index, index + 2), 16));
};
const luminance = (hex) => rgb(hex)
  .map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  })
  .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (first, second) => {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
};
const assertContrast = (label, foreground, background, minimum) => {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${label}: ${ratio.toFixed(2)}:1 < ${minimum}:1`);
};
const localizedSpanish = (value) => typeof value === 'string' ? value : value?.es;
const valueAtPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value);
const robotsTokens = (value) => new Set(localizedSpanish(value).split(',').map((token) => token.trim()));
const pageFiles = (pageId) => REQUIRED_PAGE_FILES.filter((file) =>
  !MARKETING_PAGES.includes(pageId) || !['variables.json', 'angora-combos.json'].includes(file));
const allPayloadPaths = () => [
  'site-config.json',
  'components.json',
  'variables.json',
  'angora-combos.json',
  'i18n/es.json',
  ...PAGE_IDS.flatMap((pageId) => pageFiles(pageId).map((file) => `${pageId}/${file}`)),
];
const allPayloads = () => allPayloadPaths().map(readJson);
const allComponents = () => [
  ...readJson('components.json').components,
  ...PAGE_IDS.flatMap((pageId) => readJson(`${pageId}/components.json`).components),
];

test('QA-001 declares Spanish marketing pages, the public blog and 404', () => {
  const site = readJson('site-config.json');
  assert.equal(site.domain, DOMAIN);
  assert.equal(site.defaultPageId, 'default');
  assert.equal(site.notFoundPageId, 'not-found');
  assert.deepEqual(site.aliases, ['www.zooberiahsystems.com']);
  assert.deepEqual(site.routes.map(({ path, pageId }) => ({ path, pageId })), ROUTES);
  assert.equal(site.runtime.contentHubs[0].ownerDraftDomain, 'zoositioweb.com.mx');
  assert.equal(site.runtime.contentHubs[0].source, 'authorized');
  assert.equal(site.runtime.contentHubs[0].canonicalMode, 'noindex-shared');
  assert.equal(site.site?.i18n?.defaultLanguage, 'es');
  assert.deepEqual(site.site?.i18n?.supportedLanguages?.map(({ code, label }) => ({ code, label })), [{ code: 'es', label: 'ES' }]);

  const sharedComponents = readJson('components.json').components;
  const skipLink = sharedComponents.find(({ id }) => id === 'skipToMainLink');
  assert.equal(skipLink?.config?.href, '#main-content');
  assert.equal(skipLink?.eventInstructions, 'skipToMain:main-content');
  assert.deepEqual(site.runtime?.navigation?.scrollRestoration, { mode: 'top', behavior: 'auto' });

  for (const id of ['brandLink', 'footerBrandLink']) {
    const link = sharedComponents.find((component) => component.id === id);
    assert.deepEqual(link?.config?.scrollRestoration, { mode: 'top', behavior: 'auto' });
  }

  for (const pageId of PAGE_IDS) {
    for (const file of pageFiles(pageId)) assert.ok(existsSync(fixtureUrl(`${pageId}/${file}`)), `${pageId}/${file}`);
    const page = readJson(`${pageId}/page-config.json`);
    assert.equal(page.domain, DOMAIN);
    assert.equal(page.pageId, pageId);
    assert.deepEqual(page.rootIds, ['skipToMainLink', 'siteHeader', page.rootIds[2], 'siteFooter']);

    const pageComponents = readJson(`${pageId}/components.json`).components;
    const effectiveIds = new Set([...sharedComponents, ...pageComponents].map(({ id }) => id));
    for (const rootId of page.rootIds) assert.ok(effectiveIds.has(rootId), `${pageId} root ${rootId} must resolve`);

    const pageMain = pageComponents.find(({ id }) => id === page.rootIds[2]);
    assert.equal(pageMain?.config?.tag, 'main');
    assert.equal(pageMain?.config?.id, 'main-content');
    assert.equal(pageMain?.config?.tabindex, -1);

    if (pageId === 'not-found') {
      const homeLink = pageComponents.find(({ id }) => id === 'notFoundHome');
      assert.deepEqual(homeLink?.config?.scrollRestoration, { mode: 'top', behavior: 'auto' });
    }
  }
});

test('the discoverable web archive resolves with its own canonical and matching category counts', () => {
  const page = readJson('blog-category/page-config.json');
  assert.equal(page.pageId, 'blog-category');
  assert.equal(page.seo.canonical, 'https://' + DOMAIN + '/blog/web');
  assert.notEqual(page.seo.title, readJson('blog/page-config.json').seo.title);
  const payload = readJson('blog-category/components.json');
  assert.equal(payload.pageId, 'blog-category');
  const sharedIds = new Set(readJson('components.json').components.map(({ id }) => id));
  const localIds = new Set(payload.components.map(({ id }) => id));
  for (const id of page.rootIds) assert.ok(sharedIds.has(id) || localIds.has(id), 'Archive root must resolve: ' + id);
  const cardFilters = payload.components.find(({ id }) => id === 'sharedBlogCards').loopConfig.view.filters;
  const countFilters = payload.components.find(({ id }) => id === 'sharedBlogPagination').config.view.filters;
  assert.deepEqual(cardFilters, countFilters, 'Archive pagination must count the same rows as its cards');
  assert.ok(cardFilters.some(({ path, op, value }) => path === 'categorySlug' && op === 'equals' && value === 'web'));
  assert.match(payload.components.find(({ id }) => id === 'sharedBlogFilters').config.submitEventInstructions, /^navigateWithScopeQuery:\/blog\/web,/);
  const reset = payload.components.find(({ id }) => id === 'sharedBlogResetFilters');
  assert.equal(reset.type, 'button');
  assert.equal(reset.config.type, 'reset');
  assert.match(reset.eventInstructions, /;navigateToUrl:\/blog\/web$/);
  assert.equal(readJson('blog-category/variables.json').variables.activeNav, 'blog');
});

test('QA-002 preserves legacy home anchors and promotes the products on dedicated pages', () => {
  const copy = collectStrings(allPayloads()).join('\n');
  assert.match(copy, /ZooBeriah Systems/);
  assert.doesNotMatch(copy, /ZooBeriha|Zooberiha|Zooberiah Systems/);
  const sectionIds = new Set(readJson('default/components.json').components.map(({ config }) => config?.id).filter(Boolean));
  for (const sectionId of HOME_SECTIONS) assert.ok(sectionIds.has(sectionId), 'Missing home section #' + sectionId);
  for (const name of ['ZooLandingPage', 'ZooSitioWeb', 'ZooBlog', 'RoadMap2U', 'DespensaLista', 'ZooTiendaOnline']) {
    assert.ok(copy.includes(name), 'Missing product: ' + name);
  }
});

test('QA-003 preserves project destinations and names external actions', () => {
  const strings = collectStrings(allPayloads());
  for (const url of ['https://zoolandingpage.com.mx/', 'https://zoositioweb.com.mx/planes', 'https://roadmap2u.com/', 'https://despensalista.com/']) {
    assert.ok(strings.includes(url), 'Missing destination: ' + url);
  }

  const components = allComponents();
  for (const slug of ['zoolandingpage', 'zoositioweb', 'roadmap2u']) {
    assert.equal(components.filter(({ eventInstructions }) => eventInstructions?.startsWith('trackEvent:cta_click,cta,' + slug + ',')).length, 1);
  }
  const sharedDictionary = readJson('i18n/es.json').dictionary;
  for (const pageId of ['allPages', ...PAGE_IDS]) {
    const prefix = pageId === 'allPages' ? '' : pageId + '/';
    const dictionary = { ...sharedDictionary, ...readJson(prefix + 'i18n/es.json').dictionary };
    for (const link of readJson(prefix + 'components.json').components.filter(({ type, config }) => type === 'link' && config?.target === '_blank')) {
      const ariaPath = link.valueInstructions?.match(/set:config\.ariaLabel,i18n,([^;]+)/)?.[1];
      const ariaLabel = ariaPath ? valueAtPath(dictionary, ariaPath) : link.config.ariaLabel;
      assert.match(ariaLabel, /pestaña nueva/i, link.id);
      assert.ok(link.config.rel.includes('noopener'), link.id);
    }
  }
});

test('QA-004 uses only approved, encoded WhatsApp URLs and PII-free event metadata', () => {
  const strings = collectStrings(allPayloads());
  const urls = [...new Set(strings.filter((value) => value.startsWith('https://wa.me/')))];
  const prompts = new Set();
  for (const href of urls) {
    const url = new URL(href);
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, `/${PHONE}`);
    const message = url.searchParams.get('text');
    if (!message) {
      assert.equal(href, `https://wa.me/${PHONE}`, 'Fallback must be an unmodified direct link');
      continue;
    }
    assert.ok(WHATSAPP_MESSAGES.has(message), `Unapproved WhatsApp message: ${message}`);
    assert.equal(href, `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, 'WhatsApp message must be percent-encoded');
    prompts.add(message);
  }
  assert.deepEqual(prompts, WHATSAPP_MESSAGES);
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

test('QA-007 is production-ready, declares route canonicals and uses route-appropriate robots', () => {
  const site = readJson('site-config.json');
  const home = readJson('default/page-config.json');
  const notFound = readJson('not-found/page-config.json');
  for (const page of [site.site?.seo?.robots, home.seo?.robots]) {
    const tokens = robotsTokens(page);
    assert.ok(tokens.has('index'));
    assert.ok(tokens.has('follow'));
  }
  assert.deepEqual(robotsTokens(notFound.seo?.robots), new Set(['noindex', 'follow']));
  assert.equal(site.site?.seo?.canonicalOrigin, 'https://zooberiahsystems.com');
  assert.equal(site.site?.seo?.enforceCanonicalHost, true);
  assert.equal(site.site?.seo?.forceHttps, true);
  assert.equal(home.seo?.canonical, 'https://zooberiahsystems.com/');
  assert.equal(notFound.seo?.canonical, 'https://zooberiahsystems.com/404');
  assert.equal(home.metadata?.status, 'production-ready');
  assert.equal(notFound.metadata?.status, 'production-ready');
  assert.deepEqual(home.structuredData.entries.map((entry) => entry['@type']), ['Organization', 'WebSite']);
  const seenTitles = new Set([localizedSpanish(home.seo.title)]);
  for (const { path, pageId } of MARKETING_ROUTES) {
    const page = readJson(pageId + '/page-config.json');
    const seo = page.seo;
    assert.ok(localizedSpanish(seo.title) && localizedSpanish(seo.description));
    assert.ok(!seenTitles.has(localizedSpanish(seo.title)));
    seenTitles.add(localizedSpanish(seo.title));
    assert.equal(seo.canonical, 'https://' + DOMAIN + path);
    assert.ok(page.structuredData.entries.some((entry) => entry['@type'] === 'BreadcrumbList'));
  }
  assert.equal(Object.hasOwn(notFound, 'structuredData'), false);
  assert.deepEqual(site.sitemap?.excludePaths, ['/404', '/blog/:categorySlug/:articleSlug']);

  const config = readJson('draft-repo.config.json');
  assert.equal(config.branches?.test?.deploys, true);
  assert.equal(config.branches?.test?.environment, 'test');
  assert.equal(config.branches?.main?.deploys, true);
  assert.equal(config.branches?.main?.environment, 'production');
  assert.deepEqual(Object.keys(config.githubVariables ?? {}), ['test', 'production']);
});

test('QA-008 excludes unsupported claims, placeholders and personal analytics metadata', () => {
  const payloads = allPayloads();
  const copy = collectStrings(payloads).join('\n');
  assert.doesNotMatch(copy, /lorem ipsum|replace[_ -]?me|example\.com|placeholder/i);
  assert.doesNotMatch(copy, /\b(?:TODO|TBD)\b/);
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

test('QA-009 keeps action and footer colors as direct utilities', () => {
  for (const [componentsPath, expected] of [
    ['components.json', {
      skipToMainLink: 'ank-color-bgColor',
      headerTalkLink: 'ank-color-textColor',
      siteFooter: 'ank-color-white',
      footerWhatsappLink: 'ank-color-HASH000000',
    }],
    ['default/components.json', {
      heroPrimaryAction: 'ank-color-HASH000000',
      heroSecondaryAction: 'ank-color-white',
      commerceWhatsapp: 'ank-color-bgColor',
      projectOpen: 'ank-color-bgColor',
      contactLink: 'ank-color-bgColor',
    }],
    ['not-found/components.json', {
      notFoundHome: 'ank-color-bgColor',
      notFoundContact: 'ank-color-linkColor',
    }],
  ]) {
    const components = readJson(componentsPath).components;
    for (const [id, color] of Object.entries(expected)) {
      const component = components.find((candidate) => candidate.id === id);
      assert.ok(classTokens(component?.config?.classes).includes(color), `${componentsPath}:${id} needs ${color}`);
    }
  }

  const mobileNav = readJson('components.json').components.find(({ id }) => id === 'headerMobileNav');
  const mobileDirect = new Set(classTokens(mobileNav.config.dropdownConfig.itemLinkClasses));
  assert.ok(mobileDirect.has('ank-color-titleColor'), 'mobile menu links need direct foreground color');
});

test('QA-010 keeps every configured foreground pair WCAG-safe', () => {
  const site = readJson('site-config.json');
  const shared = readJson('angora-combos.json');
  const home = readJson('default/angora-combos.json');
  const comboText = collectStrings([shared.combos, home.combos]).join(' ');
  assert.doesNotMatch(comboText, /\bank-color-HASH[0-9a-f]+\b/i, 'arbitrary text colors compile empty in combos');
  assert.ok(classTokens(shared.combos.zooberiahFooter.join(' ')).includes('ank-color-white'));
  assert.ok(classTokens(shared.combos.zooberiahFooterText.join(' ')).includes('ank-color-white'));

  for (const [mode, palette] of Object.entries(site.site.theme.palettes)) {
    for (const [label, foreground, background, minimum] of [
      ['header primary', palette.bgColor, palette.accentColor, 4.5],
      ['page primary', palette.bgColor, palette.linkColor, 4.5],
      ['text link/page', palette.linkColor, palette.bgColor, 4.5],
      ['text link/card', palette.linkColor, palette.secondaryBgColor, 4.5],
      ['secondary action', palette.titleColor, palette.bgColor, 4.5],
      ['mobile icon', palette.titleColor, palette.secondaryBgColor, 3],
      ['mobile border', palette.accentColor, palette.bgColor, 3],
      ['focus ring', palette.accentColor, palette.bgColor, 3],
      ['development badge', palette.bgColor, palette.accentColor, 4.5],
      ['warning action', palette.onWarningColor, palette.warningColor, 4.5],
    ]) assertContrast(`${mode} ${label}`, foreground, background, minimum);
  }
  assertContrast('footer text', '#FFFFFF', '#000000', 4.5);
});

test('QA-011 shares available routes across desktop, mobile, footer and first-party links', () => {
  const components = readJson('components.json').components;
  const configById = (id) => components.find((component) => component.id === id).config;
  const variables = readJson('variables.json').variables;
  const expected = ['/servicios', '/servicios/zoolandingpage', '/servicios/zoositioweb', '/servicios/zooblog', '/sitios-web', '/tiendas-en-linea', '/soluciones-para-negocios', '/soluciones-para-negocios/restaurantes', '/soluciones-para-negocios/inventario', '/soluciones-para-negocios/seguimiento-de-solicitudes', '/productos', '/proyectos', '/blog', '/contacto'];
  const destinations = (ids) => ids.flatMap((id) => {
    const component = components.find((candidate) => candidate.id === id);
    assert.ok(component, `Missing navigation component ${id}`);
    if (component.type === 'link') return [component.config.href];
    if (component.type === 'dropdown') {
      const variable = component.valueInstructions.match(/set:config\.items,var,([a-zA-Z]+)/)?.[1];
      assert.ok(Array.isArray(variables[variable]), `Dropdown ${id} has no navigation data`);
      return variables[variable].map(({ href }) => href);
    }
    return destinations(component.config.components ?? []);
  });
  assert.deepEqual(destinations(configById('headerNav').components).sort(), [...expected].sort());
  assert.deepEqual(variables.navigation.map(({ href }) => href).sort(), [...expected].sort());
  assert.match(components.find(({ id }) => id === 'headerMobileNav').valueInstructions, /set:config\.items,var,navigation(?:;|$)/, 'The mobile menu must use the same selected navigation');
  const footerDestinations = destinations(configById('footerNav').components);
  for (const path of expected) assert.ok(footerDestinations.includes(path), `The footer must retain ${path}`);
  for (const path of ['/blog', '/contacto']) assert.ok(footerDestinations.includes(path), `Secondary navigation must retain ${path}`);
  assert.equal(new Set(footerDestinations).size, footerDestinations.length, 'The footer must not repeat destinations');
  assert.equal(configById('headerBrandMark').src, readJson('variables.json').variables.assets.logoPrincipalUrl);
  const brandAsset = new URL(configById('headerBrandMark').src, 'https://zooberiahsystems.com');
  assert.equal(brandAsset.origin, 'https://assets.zoolandingpage.com.mx');
  assert.ok(brandAsset.pathname.startsWith('/zooberiahsystems.com/shared/logos/'));
  assert.equal(readJson('site-config.json').site.icons.favicon, readJson('variables.json').variables.assets.faviconUrl);
  for (const { path, pageId } of [...MARKETING_ROUTES, { path: '/blog', pageId: 'blog' }, { path: '/blog', pageId: 'blog-article' }]) {
    assert.equal(readJson(pageId + '/variables.json').variables.activeNav, pageId.startsWith('servicios-') ? 'sitios-web' : path.split('/')[1]);
  }

  const routes = new Map(ROUTES.map(({ path, pageId }) => [path, pageId]));
  for (const component of allComponents().filter(({ type, config }) => type === 'link' && config?.href.startsWith('/'))) {
    const [path, fragment] = component.config.href.split('#');
    const articlePath = /^\/blog\/[a-z0-9-]+\/[a-z0-9-]+$/.test(path);
    assert.ok(routes.has(path) || articlePath, component.id + ' has an unknown route');
    if (fragment) {
      const targetComponents = readJson((routes.get(path) ?? 'blog-article') + '/components.json').components;
      assert.ok(targetComponents.some(({ config }) => config.id === fragment), component.id + ' has an unknown fragment');
    }
  }
});

test('QA-012 presents the three applications separately from the landing page catalogue', () => {
  const products = readJson('productos/variables.json').variables.products?.items;
  assert.ok(Array.isArray(products), 'The products page must declare its application collection');
  assert.deepEqual(products.map(({ title, url }) => [title.replace(/\s+/g, ''), url]), [
    ['RoadMap2U', 'https://roadmap2u.com/'],
    ['DespensaLista', 'https://despensalista.com/'],
    ['GTRLab', 'https://clasesdemusica.zoolandingpage.com.mx/gtr-lab'],
  ]);

  const components = readJson('productos/components.json').components;
  const dictionary = readJson('productos/i18n/es.json').dictionary;
  const destinations = components.filter(({ type, config }) => type === 'link' && config?.href?.startsWith('https://'));
  assert.deepEqual(destinations.map(({ config }) => config.href).sort(), products.map(({ url }) => url).sort());
  for (const product of products) {
    const link = destinations.find(({ config }) => config.href === product.url);
    assert.ok(link, `${product.title} must have a visible destination`);
    assert.ok(product.description?.trim(), `${product.title} needs a description`);
    assert.ok(components.some(({ type, config }) => type === 'media' && config?.src === product.imageSrc && config?.alt === product.imageAlt), `${product.title} needs its accessible product image`);
    assert.ok(collectStrings(dictionary).includes(product.title), `${product.title} must appear in page copy`);
  }
  assert.ok(components.some(({ type, config }) => type === 'link' && config?.href === '/sitios-web'), 'The applications page must link to the website catalogue');
});

test('QA-013 publishes only the approved 35 landing pages and keeps GTR Lab in products', () => {
  const items = readJson('sitios-web/variables.json').variables.catalog?.items;
  assert.ok(Array.isArray(items), 'The catalogue must declare its public landing pages');
  assert.equal(items.length, 35, 'Approval covers three existing examples, four courses and 28 masterclasses');
  const canonicalURLs = new Set();
  const ids = new Set();
  for (const item of items) {
    assert.ok(item.id?.trim() && !ids.has(item.id), `Duplicate or empty catalogue ID: ${item.id}`);
    ids.add(item.id);
    const url = new URL(item.url);
    assert.equal(url.protocol, 'https:', item.url);
    assert.equal(url.username + url.password + url.search + url.hash, '', `${item.url} must be a public canonical destination`);
    assert.doesNotMatch(url.hostname, /^(?:test|preview|localhost)(?:\.|$)|(?:^|\.)localhost$|^127\./i, item.url);
    assert.doesNotMatch(url.pathname, /^\/(?:admin|auth|login|debug|404|blog)(?:\/|$)/i, item.url);
    const normalized = `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '')}`;
    assert.ok(!canonicalURLs.has(normalized), `Duplicate catalogue destination: ${item.url}`);
    canonicalURLs.add(normalized);
    for (const field of ['title', 'description', 'category', 'categoryLabel', 'imageAlt', 'searchText']) {
      assert.ok(typeof item[field] === 'string' && item[field].trim(), `${item.url} needs ${field}`);
    }
    assert.equal(new URL(item.imageSrc).protocol, 'https:', `${item.url} needs a public image or an explicit public fallback`);
    assert.ok(item.searchText.includes(item.title) && item.searchText.includes(url.hostname), `${item.url} must be searchable by title and domain`);
  }
  const existingExamples = [
    'https://clasesdemusica.zoolandingpage.com.mx/guitarra',
    'https://zoolandingpage.com.mx/',
    'https://zoositioweb.com.mx/',
  ];
  const approvedCourses = [
    'https://curso-diseno-sonoro.music.lynxpardelle.com/',
    'https://curso-music-business.music.lynxpardelle.com/',
    'https://curso-musica-electronica.music.lynxpardelle.com/',
    'https://curso-produccion-audiovisual.music.lynxpardelle.com/',
  ];
  const approvedMasterclasses = [
    'acordes',
    'artista-independiente',
    'drum-rack',
    'edicion-del-sonido',
    'escalas-mayores',
    'escalas-menores',
    'estructura-musical',
    'grabacion-de-voz-e-instrumentos',
    'impulse',
    'industria-musical',
    'instrumentos-y-efectos-midi',
    'intervalos',
    'loops-en-vivo',
    'masterizacion-profesional',
    'mezcla-digital',
    'notas-musicales',
    'procesos-de-audio-1',
    'procesos-de-audio-2',
    'profesionaliza-tu-proyecto-musical',
    'redes-sociales-para-musicos',
    'ritmo',
    'ruteo-y-grupos',
    'sampler',
    'simpler',
    'sintesis-aditiva-sustractiva-y-fm',
    'sintesis-de-tabla-de-ondas',
    'sintesis-organica-y-granular',
    'sintesis-por-modelado-fisico',
  ].map(slug => `https://masterclass-${slug}.music.lynxpardelle.com/`);
  assert.deepEqual(items.map(({ url }) => url).sort(), [...existingExamples, ...approvedCourses, ...approvedMasterclasses].sort(), 'The catalogue must match the approved examples, courses and masterclasses without importing other inventory');
  assert.equal(items.filter(({ url }) => new URL(url).hostname.startsWith('curso-')).length, 4);
  assert.equal(items.filter(({ url }) => new URL(url).hostname.startsWith('masterclass-')).length, 28);
  const gtrLabURL = 'https://clasesdemusica.zoolandingpage.com.mx/gtr-lab';
  assert.ok(!items.some(({ url }) => url === gtrLabURL), 'GTR Lab belongs only in the products catalogue');
  assert.ok(readJson('productos/variables.json').variables.products.items.some(({ url }) => url === gtrLabURL), 'GTR Lab must remain available in products');
  const components = readJson('sitios-web/components.json').components;
  const cards = components.find(({ loopConfig }) => loopConfig?.path === 'catalog.items');
  assert.ok(cards, 'The gallery must render the catalogue collection');
  assert.ok(components.some(({ id }) => id === cards.loopConfig.templateId), 'The catalogue card template must resolve');
  for (const [target, source] of [['title', 'title'], ['description', 'description'], ['href', 'url'], ['imageSrc', 'imageSrc'], ['imageAlt', 'imageAlt']]) {
    assert.ok(cards.loopConfig.bindings.some(({ to, sources }) => to === `config.${target}` && sources.includes(source)), `Catalogue cards must bind ${source}`);
  }
});

test('QA-014 keeps catalogue search, category filters and result counts consistent', () => {
  const items = readJson('sitios-web/variables.json').variables.catalog.items;
  const components = readJson('sitios-web/components.json').components;
  const cards = components.find(({ loopConfig }) => loopConfig?.path === 'catalog.items');
  const count = components.find(({ type, config }) => type === 'pagination' && config?.collectionPath === 'catalog.items');
  assert.ok(count, 'The catalogue must announce the filtered result count');
  assert.deepEqual(cards.loopConfig.view.filters, count.config.view.filters, 'Result count and cards must apply the same filters');
  const filters = cards.loopConfig.view.filters;
  assert.ok(filters.some(({ path, op, value }) => path === 'searchText' && op === 'contains' && value.source === 'queryParam' && value.key === 'q'));
  assert.ok(filters.some(({ path, op, value, ignoreValues }) => path === 'category' && op === 'equals' && value.source === 'queryParam' && value.key === 'categoria' && ignoreValues.includes('all')));
  const category = components.find(({ config }) => config?.fieldId === 'categoria');
  assert.deepEqual(new Set(category.config.options.map(({ value }) => value)), new Set(['all', ...items.map(({ category }) => category)]));
  const query = components.find(({ config }) => config?.fieldId === 'q');
  for (const input of [query, category]) {
    assert.ok(input.config.label?.trim(), `${input.config.fieldId} needs a visible label`);
    assert.ok(input.config.ariaLabel?.trim(), `${input.config.fieldId} needs an accessible name`);
  }
  const form = components.find(({ type, config }) => type === 'interaction-scope' && config?.role === 'search');
  assert.match(form.config.submitEventInstructions, /^navigateWithScopeQuery:\/sitios-web,#catalogo,q=values\.q,categoria=values\.categoria$/);
  const reset = components.find(({ type, config }) => type === 'button' && config?.type === 'reset');
  assert.equal(reset.config.label, 'Restablecer');
  assert.ok(reset.config.ariaLabel?.trim());
  assert.match(reset.eventInstructions, /setScopeValue:q,;/);
  assert.match(reset.eventInstructions, /setScopeValue:categoria,all;navigateToUrl:\/sitios-web$/);
});

test('QA-015 moves the legacy catalogue permanently without losing search filters', () => {
  const site = readJson('site-config.json');
  assert.deepEqual(site.site.seo.redirects, [{
    from: '/landingpages',
    to: '/sitios-web',
    preserveQueryParams: ['q', 'categoria', 'lang'],
  }]);
  assert.ok(!site.routes.some(({ path }) => path === '/landingpages'), 'The redirect source must not publish a duplicate catalogue');
  const websitePage = readJson('sitios-web/page-config.json');
  assert.equal(websitePage.seo.canonical, 'https://zooberiahsystems.com/sitios-web');
});
