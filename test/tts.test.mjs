// Leitura em voz alta: seleção, falhas visíveis e textos longos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWidget } from './helpers.mjs';

function installSpeech(win, voices = [{ lang: 'pt-BR', name: 'Voz' }]) {
  const spoken = [];
  class Utterance { constructor(text) { this.text = text; } }
  win.SpeechSynthesisUtterance = Utterance;
  const synth = {
    spoken,
    cancelled: 0,
    speak(u) { spoken.push(u); },
    cancel() { this.cancelled++; },
    resume() {},
    getVoices() { return voices; },
  };
  Object.defineProperty(win, 'speechSynthesis', { value: synth, configurable: true });
  return synth;
}

function select(win, element) {
  const range = win.document.createRange();
  range.selectNodeContents(element);
  const selection = win.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  win.document.dispatchEvent(new win.Event('selectionchange'));
}

function clearSelection(win) {
  win.getSelection().removeAllRanges();
  win.document.dispatchEvent(new win.Event('selectionchange'));
}

const $ = (win, id) => win.document.getElementById(id);
const heading = (win) => win.document.querySelector('h2');

test('lê a seleção com a voz do idioma da página', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win, [{ lang: 'en-US', name: 'En' }, { lang: 'pt_BR', name: 'Pt' }]);
  select(win, heading(win));
  $(win, 'aw-tts-btn').click();
  assert.equal(synth.spoken[0].text, 'Título');
  assert.equal(synth.spoken[0].voice.name, 'Pt');
  assert.equal($(win, 'aw-tts-label').textContent, 'Parar leitura');
  synth.spoken[0].onend();
  assert.equal($(win, 'aw-tts-label').textContent, 'Ler texto selecionado');
});

test('toque no widget que desfaz a seleção não impede a leitura', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win);
  select(win, heading(win));
  $(win, 'aw-tts-btn').dispatchEvent(new win.Event('pointerdown', { bubbles: true }));
  clearSelection(win);
  $(win, 'aw-tts-btn').click();
  assert.equal(synth.spoken[0].text, 'Título');
});

test('tocar fora do widget esquece a seleção anterior', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win);
  select(win, heading(win));
  win.document.body.dispatchEvent(new win.Event('pointerdown', { bubbles: true }));
  clearSelection(win);
  $(win, 'aw-tts-btn').click();
  assert.equal(synth.spoken.length, 0);
  assert.match($(win, 'aw-tts-status').textContent, /Selecione um texto/);
});

test('falha do motor de voz aparece no painel e devolve o botão', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win, []);
  select(win, heading(win));
  $(win, 'aw-tts-btn').click();
  synth.spoken[0].onerror({ error: 'synthesis-failed' });
  assert.match($(win, 'aw-tts-status').textContent, /não tem voz disponível/);
  assert.equal($(win, 'aw-tts-label').textContent, 'Ler texto selecionado');
});

test('motor de voz que nunca responde não prende o botão', async (t) => {
  const win = await loadWidget();
  const synth = installSpeech(win, []);
  const timers = [];
  win.setTimeout = (fn) => { timers.push(fn); return timers.length; };
  win.clearTimeout = () => {};
  t.after(() => win.close());
  select(win, heading(win));
  $(win, 'aw-tts-btn').click();
  timers.at(-1)();
  assert.match($(win, 'aw-tts-status').textContent, /não tem voz disponível/);
  assert.equal($(win, 'aw-tts-label').textContent, 'Ler texto selecionado');
  assert.ok(synth.cancelled >= 2);
});

test('texto longo é lido em partes, em ordem e sem cortes', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win);
  const original = Array.from({ length: 40 }, (_, i) => `Frase número ${i} do texto.`).join(' ');
  heading(win).textContent = original;
  select(win, heading(win));
  $(win, 'aw-tts-btn').click();
  for (let i = 0; i < synth.spoken.length; i++) {
    assert.ok(synth.spoken[i].text.length <= 180);
    synth.spoken[i].onend();
  }
  assert.ok(synth.spoken.length > 1);
  assert.equal(synth.spoken.map(u => u.text).join(' '), original);
  assert.equal($(win, 'aw-tts-label').textContent, 'Ler texto selecionado');
});

test('parar a leitura não deixa evento atrasado encerrar a próxima', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win);
  select(win, heading(win));
  const button = $(win, 'aw-tts-btn');
  button.click();
  button.click();
  button.click();
  assert.equal(synth.spoken.length, 2);
  synth.spoken[0].onerror({ error: 'canceled' });
  assert.equal($(win, 'aw-tts-label').textContent, 'Parar leitura');
});

test('mensagem do painel trata conteúdo selecionado como texto, sem HTML', async () => {
  const win = await loadWidget();
  const synth = installSpeech(win);
  heading(win).textContent = '<img src=x onerror=alert(1)>';
  select(win, heading(win));
  $(win, 'aw-tts-btn').click();
  assert.equal(synth.spoken[0].text, '<img src=x onerror=alert(1)>');
  synth.spoken[0].onerror({ error: 'synthesis-failed' });
  assert.equal($(win, 'aw-tts-status').querySelector('img'), null);
});
