"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupCaching = void 0;

var _dataloader = _interopRequireDefault(require("dataloader"));

var _sift = _interopRequireDefault(require("sift"));

const handleCache = async ({
  ttl,
  doc,
  key,
  cache,
  allCacheKeys,
  debug,
  allowFlushingCollectionCache
}) => {
  if (Number.isInteger(ttl)) {
    // https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-caching#apollo-server-caching
    cache.set(key, doc, {
      ttl
    });

    if (allowFlushingCollectionCache) {
      const allKeys = (await cache.get(allCacheKeys)) || [];

      if (!allKeys.find(k => k === key)) {
        allKeys.push(key);
        const newKeys = [...new Set(allKeys)];
        cache.set(allCacheKeys, newKeys, {
          ttl
        });

        if (debug) {
          console.log('All Keys Cache: Added => ', key, '#keys', (await cache.get(allCacheKeys)) && (await cache.get(allCacheKeys)).length);
        }
      } else if (debug) {
        console.log('All Keys Cache: Found => ', key, '#keys', (await cache.get(allCacheKeys)) && (await cache.get(allCacheKeys)).length);
      }
    }
  }
};

const remapDocs = (docs, ids) => {
  const idMap = {};
  docs.forEach(doc => {
    idMap[doc._id] = doc; // eslint-disable-line no-underscore-dangle
  });
  return ids.map(id => idMap[id]);
}; // eslint-disable-next-line import/prefer-default-export


const setupCaching = ({
  collection,
  cache,
  allowFlushingCollectionCache = false,
  mongoose = false,
  debug = false
}) => {
  const loader = new _dataloader.default(ids => mongoose ? collection.find({
    _id: {
      $in: ids
    }
  }).then(docs => remapDocs(docs, ids)) : collection.find({
    _id: {
      $in: ids
    }
  }).toArray().then(docs => remapDocs(docs, ids)));
  const cachePrefix = `mongo-${collection.collectionName // eslint-disable-line no-nested-ternary
  ? collection.collectionName : collection.modelName ? collection.modelName : 'test'}-`;
  const allCacheKeys = `${cachePrefix}all-keys`; // eslint-disable-next-line no-param-reassign

  collection.findOneById = async (id, {
    ttl
  } = {}) => {
    if (!id) {
      return null;
    }

    const key = cachePrefix + id;
    const cacheDoc = await cache.get(key);

    if (debug) {
      console.log('KEY', key, cacheDoc ? 'cache' : 'miss');
    }

    if (cacheDoc) {
      return cacheDoc;
    }

    const doc = await loader.load(id);
    await handleCache({
      ttl,
      doc,
      key,
      cache,
      allCacheKeys,
      debug,
      allowFlushingCollectionCache
    });
    return doc;
  }; // eslint-disable-next-line no-param-reassign


  collection.findManyByIds = (ids, {
    ttl
  } = {}) => Promise.all(ids.map(id => collection.findOneById(id, {
    ttl
  })));

  const dataQuery = mongoose ? ({
    queries
  }) => collection.find({
    $or: queries
  }).then(items => queries.map(query => items.filter((0, _sift.default)(query)))) : ({
    queries
  }) => collection.find({
    $or: queries
  }).toArray().then(items => queries.map(query => items.filter((0, _sift.default)(query))));
  const queryLoader = new _dataloader.default(queries => dataQuery({
    queries
  })); // eslint-disable-next-line no-param-reassign

  collection.findManyByQuery = async (query, {
    ttl
  } = {}) => {
    const key = cachePrefix + JSON.stringify(query);
    const cacheDocs = await cache.get(key);

    if (debug) {
      console.log('KEY', key, cacheDocs ? 'cache' : 'miss');
    }

    if (cacheDocs) {
      return cacheDocs;
    }

    const docs = await queryLoader.load(query);
    await handleCache({
      ttl,
      doc: docs,
      key,
      cache,
      allCacheKeys,
      debug,
      allowFlushingCollectionCache
    });
    return docs;
  }; // eslint-disable-next-line no-param-reassign


  collection.deleteFromCacheById = async id => {
    const key = id && typeof id === 'object' ? JSON.stringify(id) : id;
    const allKeys = (await cache.get(allCacheKeys)) || [];
    const newKeys = allKeys.filter(k => k !== `${cachePrefix}${key}`);
    await cache.delete(cachePrefix + key);
    if (allowFlushingCollectionCache) cache.set(allCacheKeys, newKeys);
  }; // this works also for byQueries just passing a stringified query as the id
  // eslint-disable-next-line no-param-reassign


  collection.flushCollectionCache = async () => {
    if (!allowFlushingCollectionCache) return null;
    const allKeys = (await cache.get(allCacheKeys)) || []; // eslint-disable-next-line no-restricted-syntax

    for (const key of allKeys) {
      cache.delete(key);
    }

    cache.set(allCacheKeys, []);
    return true;
  };
};

exports.setupCaching = setupCaching;