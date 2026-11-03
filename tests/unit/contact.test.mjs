// Support contact helpers (pure). Run: node --test tests/unit/contact.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { waDigits, dialNumber, telHref, whatsappHref, cleanContactForm } from '../../web/src/lib/contact.js';

test('a Bangladesh local number gets the 880 country code for WhatsApp', () => {
  assert.equal(waDigits('01712 345678'), '8801712345678');
  assert.equal(waDigits('+880 1712-345678'), '8801712345678');
  assert.equal(waDigits('00880 1712 345678'), '8801712345678');
  assert.equal(waDigits('8801712345678'), '8801712345678');
  assert.equal(waDigits(''), '');
  assert.equal(waDigits(undefined), '');
});

test('phone numbers are dialled without spaces, keeping a leading +', () => {
  assert.equal(dialNumber('+880 1712-345 678'), '+8801712345678');
  assert.equal(dialNumber('(02) 9876 543'), '029876543');
  assert.equal(telHref('01712 345678'), 'tel:01712345678');
  assert.equal(telHref(''), '');
  assert.equal(telHref('call me'), '');
});

test('the WhatsApp link opens a chat, with an optional prefilled message', () => {
  assert.equal(whatsappHref('01712345678'), 'https://wa.me/8801712345678');
  assert.equal(whatsappHref('01712345678', 'Hi Pet Maya'), 'https://wa.me/8801712345678?text=Hi%20Pet%20Maya');
  assert.equal(whatsappHref(''), '');
  assert.equal(whatsappHref('12'), '');
});

test('the admin form trims, allows empty fields and explains what is wrong', () => {
  const ok = cleanContactForm({ phone: ' 01712 345678 ', whatsapp: '+880 1712 345678', email: ' help@petmaya.app ', hours: ' Sat-Thu 10am-8pm ' });
  assert.deepEqual(ok.errors, {});
  assert.deepEqual(ok.data, { phone: '01712 345678', whatsapp: '+880 1712 345678', email: 'help@petmaya.app', hours: 'Sat-Thu 10am-8pm' });

  assert.deepEqual(cleanContactForm({}).errors, {});            // clearing everything is fine: the buttons just hide
  const bad = cleanContactForm({ phone: 'call us', whatsapp: '123', email: 'nope', hours: 'x'.repeat(200) });
  assert.deepEqual(Object.keys(bad.errors).sort(), ['email', 'phone', 'whatsapp']);
  assert.equal(bad.data.hours.length, 80);
});
