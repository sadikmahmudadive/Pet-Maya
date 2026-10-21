// Announcement bar rules (pure, no browser). Run: node --test tests/unit
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ANNOUNCEMENT, MAX_MESSAGES, MAX_TEXT, activeMessages, announcementVersion, cleanColor, cleanLink,
  contrastRatio, isBarVisible, normalizeAnnouncement,
} from '../../web/src/lib/announcement.js';

const HOUR = 3600e3;

test('nothing saved yet → the original three messages, bar on, "Track order" link', () => {
  const c = normalizeAnnouncement(null);
  assert.equal(c.enabled, true);
  assert.equal(c.messages.length, 3);
  assert.match(c.messages[0].text, /PETMAYA10/);
  assert.deepEqual(c.rightLink, { enabled: true, text: 'Track order →', url: '/account/orders' });
  assert.equal(c.rotateSeconds, 6);
  assert.equal(normalizeAnnouncement('junk').messages.length, 3);
});

test('links: site paths and https only', () => {
  assert.equal(cleanLink('/shop?cat=dogs'), '/shop?cat=dogs');
  assert.equal(cleanLink('https://petmaya.app/offer'), 'https://petmaya.app/offer');
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'http://insecure.example', '//evil.example', '\\\\evil', 'ftp://x', 'shop', '']) {
    assert.equal(cleanLink(bad), '', bad);
  }
});

test('colours: #rgb or #rrggbb only', () => {
  assert.equal(cleanColor('#14161C'), '#14161C');
  assert.equal(cleanColor('#fff'), '#fff');
  for (const bad of ['red', 'rgb(0,0,0)', '#12345', 'url(x)', 'expression(1)', '#ggg', '']) assert.equal(cleanColor(bad), '', bad);
});

test('a hostile or broken document cannot break the bar', () => {
  const c = normalizeAnnouncement({
    enabled: 'yes', rotateSeconds: 9999, bgColor: 'url(javascript:1)', textColor: '#fff', dismissible: 'true',
    messages: [
      { text: '  Free   delivery\n over ৳2,500  ', linkUrl: 'javascript:alert(1)' },
      { text: '' }, { text: '   ' }, null, 'string',
      { text: 'x'.repeat(500), linkUrl: '/shop', active: false },
    ],
    rightLink: { enabled: true, text: 'Go', url: 'javascript:1' },
  });
  assert.equal(c.enabled, true); // only an explicit false switches it off
  assert.equal(c.rotateSeconds, 30); // clamped
  assert.equal(c.bgColor, '');
  assert.equal(c.textColor, '#fff');
  assert.equal(c.dismissible, false); // only a real true
  assert.equal(c.messages.length, 2);
  assert.equal(c.messages[0].text, 'Free delivery over ৳2,500');
  assert.equal(c.messages[0].linkUrl, '');
  assert.equal(c.messages[1].text.length, MAX_TEXT);
  assert.equal(c.messages[1].active, false);
  assert.equal(c.rightLink.enabled, false); // unsafe link → the link is removed
});

test('at most 8 messages; rotation never faster than 3s', () => {
  const c = normalizeAnnouncement({ messages: Array.from({ length: 20 }, (_, i) => ({ text: `m${i}` })), rotateSeconds: 0.5 });
  assert.equal(c.messages.length, MAX_MESSAGES);
  assert.equal(c.rotateSeconds, 3);
});

test('an empty message list hides the bar instead of falling back to the defaults', () => {
  const c = normalizeAnnouncement({ enabled: true, messages: [] });
  assert.equal(c.messages.length, 0);
  assert.equal(isBarVisible(c), false);
});

test('messages follow their on/off switch and start/end dates', () => {
  const now = 1_800_000_000_000;
  const c = normalizeAnnouncement({
    messages: [
      { text: 'always' },
      { text: 'off', active: false },
      { text: 'soon', startAt: now + HOUR },
      { text: 'over', endAt: now - HOUR },
      { text: 'window', startAt: now - HOUR, endAt: now + HOUR },
    ],
  });
  assert.deepEqual(activeMessages(c, now).map((m) => m.text), ['always', 'window']);
  assert.equal(isBarVisible({ ...c, enabled: false }, now), false);
});

test('dismissal version changes when a message changes, not when only the colours do', () => {
  const a = normalizeAnnouncement({ messages: [{ text: 'One' }] });
  const same = normalizeAnnouncement({ messages: [{ text: 'One' }], bgColor: '#000000' });
  const edited = normalizeAnnouncement({ messages: [{ text: 'One!' }] });
  assert.equal(announcementVersion(a), announcementVersion(same));
  assert.notEqual(announcementVersion(a), announcementVersion(edited));
});

test('contrast ratio matches the WCAG reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#fff', '#fff'), 1);
  assert.ok(contrastRatio('#777777', '#888888') < 4.5);
  assert.equal(contrastRatio('red', '#fff'), null);
});

test('the shipped defaults are themselves valid', () => {
  assert.deepEqual(
    normalizeAnnouncement(DEFAULT_ANNOUNCEMENT).messages.map((m) => m.text),
    DEFAULT_ANNOUNCEMENT.messages.map((m) => m.text),
  );
});
