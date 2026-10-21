// "View storefront" target (pure, no browser). Run: node --test tests/unit/hosts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { storefrontUrl } from '../../web/src/lib/hosts.js';

const at = (hostname, protocol = 'https:', port = '') => ({ hostname, protocol, port });

test('on admin.<domain> it leads to the public site on www.<domain>', () => {
  assert.equal(storefrontUrl(at('admin.petmaya.app')), 'https://www.petmaya.app/');
  assert.equal(storefrontUrl(at('ADMIN.petmaya.app')), 'https://www.petmaya.app/');
  assert.equal(storefrontUrl(at('admin.petmaya.app', 'http:', '3000')), 'http://www.petmaya.app:3000/');
});

test('everywhere else "/" already leaves the console', () => {
  for (const h of ['www.petmaya.app', 'petmaya.app', 'localhost', '127.0.0.1', 'pet-maya.web.app', 'myadmin.example.com', 'administrator.example.com']) {
    assert.equal(storefrontUrl(at(h)), '/', h);
  }
});

test('missing location data falls back safely', () => {
  assert.equal(storefrontUrl({}), '/');
});
