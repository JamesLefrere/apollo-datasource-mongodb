"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MongoDataSource = void 0;

var _apolloDatasource = require("apollo-datasource");

var _apolloServerErrors = require("apollo-server-errors");

var _apolloServerCaching = require("apollo-server-caching");

var _cache = require("./cache");

class MongoDataSource extends _apolloDatasource.DataSource {
  // https://github.com/apollographql/apollo-server/blob/master/packages/apollo-datasource/src/index.ts
  initialize(config) {
    this.context = config.context; // if (!this.collections || !this.collections.length) {
    //   throw new ApolloError(
    //     'Child class of MongoDataSource must set this.collections in constructor'
    //   )
    // }

    const cache = config.cache || new _apolloServerCaching.InMemoryLRUCache();
    const {
      mongoose
    } = this;
    const {
      debug
    } = this;
    this.collections.forEach(collection => (0, _cache.setupCaching)({
      collection,
      cache,
      mongoose,
      debug
    }));
  }

} // eslint-disable-next-line import/prefer-default-export


exports.MongoDataSource = MongoDataSource;