// SEO da página pública (GitHub Pages): metas, prévia, dados estruturados, sitemap e robots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const BASE = 'https://thaynabds.github.io/accessability-widget/';
const DEMO = BASE + 'demo/';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const doc = new JSDOM(read('demo/index.html')).window.document;
const meta = (sel) => doc.querySelector(sel)?.getAttribute('content');

test('demo tem lang, título, descrição e canônica', () => {
  assert.equal(doc.documentElement.lang, 'pt-BR');
  const title = doc.title;
  assert.ok(title.length >= 20 && title.length <= 80, `título com ${title.length} caracteres`);
  const desc = meta('meta[name="description"]');
  assert.ok(desc && desc.length >= 70 && desc.length <= 300, 'descrição entre 70 e 300 caracteres');
  assert.equal(doc.querySelector('link[rel="canonical"]').href, DEMO);
  assert.equal(doc.querySelectorAll('header h1').length, 1, 'um h1 no cabeçalho');
});

test('demo tem Open Graph e Twitter Card com imagem que existe no repositório', () => {
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
    assert.ok(meta(`meta[property="${p}"]`), `falta ${p}`);
  }
  assert.equal(meta('meta[property="og:url"]'), DEMO);
  assert.equal(meta('meta[name="twitter:card"]'), 'summary_large_image');
  const img = meta('meta[property="og:image"]');
  assert.ok(img.startsWith(BASE), 'imagem com URL absoluta do Pages');
  assert.ok(existsSync(new URL('../' + img.slice(BASE.length), import.meta.url)), 'arquivo da imagem existe');
});

test('JSON-LD é válido e descreve o software sem dado pessoal além do nome público', () => {
  const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  assert.equal(blocks.length, 1);
  const data = JSON.parse(blocks[0].textContent);
  const types = data['@graph'].map((n) => n['@type']);
  assert.deepEqual(types.sort(), ['SoftwareApplication', 'SoftwareSourceCode']);
  const app = data['@graph'].find((n) => n['@type'] === 'SoftwareApplication');
  assert.equal(app.softwareVersion, JSON.parse(read('package.json')).version, 'versão igual à do package.json');
  assert.doesNotMatch(blocks[0].textContent, /@(?!context|type|id|graph)[a-z0-9.-]+\.[a-z]{2,}/i, 'sem e-mail');
});

test('sitemap e robots apontam para o caminho do Pages', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(sitemap.includes(`<loc>${DEMO}</loc>`));
  assert.match(read('robots.txt'), new RegExp(`^Sitemap: ${BASE}sitemap\\.xml$`, 'm'));
});

test('página de redirecionamento da raiz não compete com a demo', () => {
  const root = new JSDOM(read('index.html')).window.document;
  assert.equal(root.querySelector('meta[name="robots"]').content, 'noindex, follow');
  assert.equal(root.querySelector('link[rel="canonical"]').href, DEMO);
});

test('demo não carrega imagem, vídeo, áudio ou script de terceiros (o IP do visitante fica no próprio site)', () => {
  const own = (u) => !/^(https?:)?\/\//.test(u) || u.startsWith(BASE);
  const srcs = [...doc.querySelectorAll('img[src], video[src], audio[src], source[src], script[src], iframe[src], link[rel="stylesheet"][href]')]
    .map((n) => n.getAttribute('src') || n.getAttribute('href'));
  const external = srcs.filter((u) => !own(u));
  assert.deepEqual(external, [], 'recursos externos na demo');
});
