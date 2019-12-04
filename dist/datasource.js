"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_datasource_1 = require("apollo-datasource");
const apollo_server_caching_1 = require("apollo-server-caching");
const cache_1 = require("./cache");
exports.CachedCollection = cache_1.CachedCollection;
class MongoDataSource extends apollo_datasource_1.DataSource {
    constructor(collections) {
        super();
        this.rawCollections = collections;
    }
    // https://github.com/apollographql/apollo-server/blob/master/packages/apollo-datasource/src/index.ts
    initialize(config = {}) {
        this.context = config.context;
        const cache = config.cache || new apollo_server_caching_1.InMemoryLRUCache();
        this.collections = this.rawCollections.reduce((acc, collection) => (Object.assign(Object.assign({}, acc), { [collection.collectionName]: new cache_1.CachedCollection(collection, cache, {
                allowFlushingCollectionCache: false,
            }) })), {});
    }
}
exports.MongoDataSource = MongoDataSource;
//# sourceMappingURL=datasource.js.map