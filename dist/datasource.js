import _classCallCheck from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/classCallCheck";import _createClass from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/createClass";import _possibleConstructorReturn from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/possibleConstructorReturn";import _getPrototypeOf from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/getPrototypeOf";import _inherits from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/inherits";import { DataSource } from 'apollo-datasource';
// import { ApolloError } from 'apollo-server-errors'
import { InMemoryLRUCache } from 'apollo-server-caching';

import { setupCaching } from './cache';var

MongoDataSource = /*#__PURE__*/function (_DataSource) {_inherits(MongoDataSource, _DataSource);function MongoDataSource() {_classCallCheck(this, MongoDataSource);return _possibleConstructorReturn(this, _getPrototypeOf(MongoDataSource).apply(this, arguments));}_createClass(MongoDataSource, [{ key: "initialize",
    // https://github.com/apollographql/apollo-server/blob/master/packages/apollo-datasource/src/index.ts
    value: function initialize(config) {
      this.context = config.context;

      // if (!this.collections || !this.collections.length) {
      //   throw new ApolloError(
      //     'Child class of MongoDataSource must set this.collections in constructor'
      //   )
      // }

      var cache = config.cache || new InMemoryLRUCache();var

      mongoose = this.mongoose;var

      debug = this.debug;

      this.collections.forEach(function (collection) {return (
          setupCaching({ collection: collection, cache: cache, mongoose: mongoose, debug: debug }));});

    } }]);return MongoDataSource;}(DataSource);

// eslint-disable-next-line import/prefer-default-export
export { MongoDataSource };