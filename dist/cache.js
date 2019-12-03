'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const dataloader_1 = __importDefault(require('dataloader'));
const sift_1 = __importDefault(require('sift'));
const mongodb_1 = require('mongodb');
class CachedCollection {
  constructor(collection, cache, options) {
    this.cache = cache;
    this.collection = collection;
    this.options = options || { allowFlushingCollectionCache: false };
    this.cachePrefix = `mongo-${
      this.collection.collectionName ? this.collection.collectionName : 'test'
    }-`;
    this.allCacheKeys = `${this.cachePrefix}all-keys`;
    this.loader = new dataloader_1.default(ids =>
      this.collection
        .find({ _id: { $in: ids.map(id => new mongodb_1.ObjectID(id)) } })
        .toArray()
        .then(docs => CachedCollection.remapDocs(docs, ids)),
    );
    this.queryLoader = new dataloader_1.default(queries =>
      this.collection
        .find({ $or: queries })
        .toArray()
        .then(items =>
          queries.map(query => items.filter(sift_1.default(query))),
        ),
    );
  }
  static remapDocs(docs, ids) {
    const idMap = {};
    docs.forEach(doc => {
      idMap[doc._id] = doc;
    });
    return ids.map(id => idMap[id]);
  }
  handleCache(doc, key, ttl) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!Number.isInteger(ttl)) return null;
      // https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-caching#apollo-server-caching
      yield this.cache.set(key, doc, { ttl });
      if (this.options.allowFlushingCollectionCache) {
        const allKeys = (yield this.cache.get(this.allCacheKeys)) || [];
        if (!allKeys.includes(key)) {
          allKeys.push(key);
          const newKeys = [...new Set(allKeys)];
          yield this.cache.set(this.allCacheKeys, newKeys, { ttl });
        }
      }
    });
  }
  findOneById(id, { ttl } = { ttl: undefined }) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!id) return null;
      const key = this.cachePrefix + id;
      const cacheDoc = yield this.cache.get(key);
      if (cacheDoc) return cacheDoc;
      const doc = yield this.loader.load(id);
      yield this.handleCache(doc, key, ttl);
      return doc;
    });
  }
  findManyByIds(ids, { ttl } = { ttl: undefined }) {
    return __awaiter(this, void 0, void 0, function*() {
      // TODO this could be more efficient (find the subset that doesn't exist in cache, and use { _id: { $in: ids } }
      return Promise.all(ids.map(id => this.findOneById(id, { ttl })));
    });
  }
  findManyByQuery(query, { ttl } = { ttl: undefined }) {
    return __awaiter(this, void 0, void 0, function*() {
      const key = this.cachePrefix + JSON.stringify(query);
      const cacheDocs = yield this.cache.get(key);
      if (cacheDocs) return cacheDocs;
      const docs = yield this.queryLoader.load(query);
      yield this.handleCache(docs, key, ttl);
      return docs;
    });
  }
  // this works also for byQueries just passing a stringified query as the id
  deleteFromCacheById(id) {
    return __awaiter(this, void 0, void 0, function*() {
      const key = id && typeof id === 'object' ? JSON.stringify(id) : id;
      const allKeys = (yield this.cache.get(this.allCacheKeys)) || [];
      const newKeys = allKeys.filter(
        key => key !== `${this.cachePrefix}${key}`,
      );
      yield this.cache.delete(this.cachePrefix + key);
      if (this.options.allowFlushingCollectionCache) {
        yield this.cache.set(this.allCacheKeys, newKeys);
      }
    });
  }
  flushCollectionCache() {
    return __awaiter(this, void 0, void 0, function*() {
      if (!this.options.allowFlushingCollectionCache) return null;
      const allKeys = (yield this.cache.get(this.allCacheKeys)) || [];
      yield Promise.all(allKeys.map(key => this.cache.delete(key)));
      yield this.cache.set(this.allCacheKeys, []);
      return true;
    });
  }
}
exports.CachedCollection = CachedCollection;
//# sourceMappingURL=cache.js.map
