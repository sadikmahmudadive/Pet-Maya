import { useMemo } from 'react';
import { toMillis } from '../lib/format.js';
import {
  useCollection, normProduct, normOrder, normVet, normPet, normPost, normBlog, normUser, normEvent,
} from './firestore.js';
import {
  SAMPLE_PRODUCTS, SAMPLE_ORDERS, SAMPLE_VETS, SAMPLE_PETS, SAMPLE_POSTS, SAMPLE_BLOGS,
} from './sample.js';

const S = {
  products: SAMPLE_PRODUCTS.map((p) => normProduct(p.id, p)),
  orders: SAMPLE_ORDERS.map((o) => normOrder(o.id, o)),
  vets: SAMPLE_VETS.map((v) => normVet(v.id, v)),
  pets: SAMPLE_PETS.map((p) => normPet(p.id, p)),
  posts: SAMPLE_POSTS.map((p) => normPost(p.id, p)),
  blogs: SAMPLE_BLOGS.map((b) => normBlog(b.id, b)),
};
export const SAMPLES = S;

export const useProducts = () => useCollection('products', { map: normProduct, sample: S.products });
export const useVets = () => useCollection('vets', { map: normVet, sample: S.vets });
export const usePosts = () => useCollection('community_posts', { map: normPost, sample: S.posts });
export const useBlogs = () => useCollection('blogs', { map: normBlog, sample: S.blogs });
export const useUsers = () => useCollection('users', { map: normUser, sample: [] });
export const useAllOrders = () => useCollection('orders', { map: normOrder, sample: S.orders });
export const useAllEvents = () => useCollection('events', { map: normEvent, sample: [] });
export const useAllPets = () => useCollection('pets', { map: normPet, sample: [] });

const isRealUser = (u) => u && u.uid && !String(u.uid).startsWith('demo_guest');

/** Pets of the signed-in user; sample pets for guests so the storefront can personalise. */
export function useMyPets(user) {
  const real = isRealUser(user);
  return useCollection('pets', {
    map: normPet,
    sample: real ? [] : S.pets,
    filters: real ? [['ownerID', '==', user.uid]] : [],
    enabled: real,
    sampleWhenEmpty: false,
  });
}

export function useMyOrders(user) {
  const real = isRealUser(user);
  const res = useCollection('orders', {
    map: normOrder,
    sample: [],
    filters: real ? [['userId', '==', user.uid]] : [],
    enabled: real,
    sampleWhenEmpty: false,
  });
  const items = useMemo(() => [...res.items].sort((a, b) => b.placedAt - a.placedAt), [res.items]);
  return { ...res, items };
}

export function useMyRecords(user) {
  const real = isRealUser(user);
  return useCollection('service_records', {
    map: (id, d) => ({ id, ...d }),
    sample: [],
    filters: real ? [['userId', '==', user.uid]] : [],
    enabled: real,
    sampleWhenEmpty: false,
  });
}

export function useMyEvents(user) {
  const real = isRealUser(user);
  return useCollection('events', {
    map: normEvent,
    sample: [],
    filters: real ? [['userId', '==', user.uid]] : [],
    enabled: real,
    sampleWhenEmpty: false,
  });
}

/** Live notification feed for the signed-in user (notifications/{uid}/items). */
export function useNotifications(user) {
  const real = isRealUser(user);
  const res = useCollection(real ? `notifications/${user.uid}/items` : 'notifications', {
    map: (id, d) => ({
      id,
      title: d.title || 'Pet Maya',
      body: d.body || d.message || '',
      category: d.category || 'system',
      url: d.url || '',
      read: d.read === true,
      time: toMillis(d.timestamp || d.createdAt),
    }),
    sample: [],
    enabled: real,
    sampleWhenEmpty: false,
  });
  const items = useMemo(() => [...res.items].sort((a, b) => b.time - a.time), [res.items]);
  return { ...res, items, unread: items.filter((n) => !n.read).length };
}
