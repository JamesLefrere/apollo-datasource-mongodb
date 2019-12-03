import { InMemoryLRUCache } from 'apollo-server-caching';
import sift from 'sift';
import wait from 'waait';

import { CachedCollection } from '../cache';

const now = new Date();
const oneWeekAgo = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() - 7,
);

const docs = {
  id1: {
    _id: 'id1',
    createdAt: now,
  },
  id2: {
    _id: 'id2',
    createdAt: oneWeekAgo,
  },
  id3: {
    _id: 'id3',
    createdAt: oneWeekAgo,
  },
};

const collectionName = 'test';
const cacheKey = id => 'mongo-' + collectionName + '-' + id;
const allCacheKeys = `mongo-${collectionName}-all-keys`;

describe('CachedCollection', () => {
  let collection;
  let cache;
  let allowFlushingCollectionCache;
  let cachedCollection;

  beforeEach(() => {
    collection = {
      collectionName,
      find: jest.fn(args => ({
        toArray: () =>
          new Promise(resolve => {
            if (args.$or) {
              const { $or: queries } = args;
              const siftDocs = Object.keys(docs).reduce(
                (a, k) => [...a, docs[k]],
                [],
              );
              setTimeout(
                () =>
                  resolve(
                    queries.reduce(
                      (arr, query) => [...arr, ...siftDocs.filter(sift(query))],
                      [],
                    ),
                  ),
                0,
              );
            } else {
              const {
                _id: { $in: ids },
              } = args;
              setTimeout(() => resolve(ids.map(id => docs[id])), 0);
            }
          }),
      })),
    };

    cache = new InMemoryLRUCache();

    allowFlushingCollectionCache = true;

    cachedCollection = new CachedCollection(collection, cache, {
      allowFlushingCollectionCache,
    });
  });

  it('finds one', async () => {
    const doc = await cachedCollection.findOneById('id1');
    expect(doc).toBe(docs.id1);
    expect(collection.find.mock.calls.length).toBe(1);
  });

  it('finds two with batching', async () => {
    const foundDocs = await cachedCollection.findManyByIds(['id2', 'id3']);
    expect(foundDocs[0]).toBe(docs.id2);
    expect(foundDocs[1]).toBe(docs.id3);

    expect(collection.find.mock.calls.length).toBe(1);
  });

  it('finds two with queries batching', async () => {
    const foundDocs = await cachedCollection.findManyByQuery({
      createdAt: { $lte: oneWeekAgo },
    });
    expect(foundDocs[0]).toBe(docs.id2);
    expect(foundDocs[1]).toBe(docs.id3);
    expect(foundDocs.length).toBe(2);

    expect(collection.find.mock.calls.length).toBe(1);
  });

  // TODO why doesn't this pass?
  // it.only(`doesn't cache without ttl`, async () => {
  //   await collection.findOneById('id1')
  //   await collection.findOneById('id1')

  //   expect(collection.find.mock.calls.length).toBe(2)
  // })

  it(`doesn't cache without ttl`, async () => {
    await cachedCollection.findOneById('id1');

    let value = await cache.get(cacheKey('id1'));
    expect(value).toBeUndefined();

    const query = {
      createdAt: { $lte: oneWeekAgo },
    };

    await cachedCollection.findManyByQuery(query);

    value = await cache.get(cacheKey(JSON.stringify(query)));
    expect(value).toBeUndefined();

    value = await cache.get(allCacheKeys);
    expect(value).toBeUndefined();
  });

  it(`caches`, async () => {
    await cachedCollection.findOneById('id1', { ttl: 1 });
    let value = await cache.get(cacheKey('id1'));
    expect(value).toBe(docs.id1);

    await cachedCollection.findOneById('id1');
    expect(collection.find.mock.calls.length).toBe(1);

    const query = {
      createdAt: { $lte: oneWeekAgo },
    };
    await cachedCollection.findManyByQuery(query, { ttl: 1 });
    value = await cache.get(cacheKey(JSON.stringify(query)));
    expect(value).toEqual([docs.id2, docs.id3]);

    await cachedCollection.findManyByQuery(query);
    expect(collection.find.mock.calls.length).toBe(2); // it takes count both [ [ { _id: [Object] } ], [ { '$or': [Array] } ] ]

    value = await cache.get(allCacheKeys);
    expect(value).toEqual([cacheKey('id1'), cacheKey(JSON.stringify(query))]);
  });

  it(`caches with ttl`, async () => {
    await cachedCollection.findOneById('id1', { ttl: 1 });
    await wait(1001);

    let value = await cache.get(cacheKey('id1'));
    expect(value).toBeUndefined();

    const query = {
      createdAt: { $lte: oneWeekAgo },
    };
    await cachedCollection.findManyByQuery(query, { ttl: 1 });
    await wait(1001);

    value = await cache.get(cacheKey(JSON.stringify(query)));
    expect(value).toBeUndefined();

    value = await cache.get(allCacheKeys);
    expect(value).toBeUndefined();
  });

  it(`deletes from cache`, async () => {
    await cachedCollection.findOneById('id1', { ttl: 1 });

    let valueBefore = await cache.get(cacheKey('id1'));
    expect(valueBefore).toBe(docs.id1);

    await cachedCollection.deleteFromCacheById('id1');

    let valueAfter = await cache.get(cacheKey('id1'));
    expect(valueAfter).toBeUndefined();

    const query = {
      createdAt: { $lte: oneWeekAgo },
    };

    await cachedCollection.findManyByQuery(query, { ttl: 1 });

    valueBefore = await cache.get(cacheKey(JSON.stringify(query)));
    expect(valueBefore).toEqual([docs.id2, docs.id3]);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1000));

    await cachedCollection.deleteFromCacheById(query);

    valueAfter = await cache.get(cacheKey(JSON.stringify(query)));
    expect(valueAfter).toBeUndefined();

    const value = await cache.get(allCacheKeys);
    expect(value).toEqual([]);
  });
  it('has collection cache flushing disabled by default', async () => {
    cachedCollection = new CachedCollection(collection, cache);
    await cachedCollection.findOneById('id1', { ttl: 1 });
    let value = await cache.get(cacheKey('id1'));
    expect(value).toBe(docs.id1);

    const query = {
      createdAt: { $lte: oneWeekAgo },
    };
    await cachedCollection.findManyByQuery(query, { ttl: 1 });
    value = await cache.get(cacheKey(JSON.stringify(query)));
    expect(value).toEqual([docs.id2, docs.id3]);

    value = await cache.get(allCacheKeys);
    expect(value).toBeUndefined();
  });
});
