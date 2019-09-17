import _regeneratorRuntime from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/regenerator";import _toConsumableArray from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/toConsumableArray";import _asyncToGenerator from "/Users/sundevlohr/Sites/apollo-datasource-mongodb/node_modules/@babel/runtime/helpers/esm/asyncToGenerator";import DataLoader from 'dataloader';
import sift from 'sift';

var handleCache = /*#__PURE__*/function () {var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(_ref) {var ttl, doc, key, cache, allCacheKeys, debug, allowFlushingCollectionCache, allKeys, newKeys;return _regeneratorRuntime.wrap(function _callee$(_context) {while (1) {switch (_context.prev = _context.next) {case 0:
            ttl = _ref.ttl,
            doc = _ref.doc,
            key = _ref.key,
            cache = _ref.cache,
            allCacheKeys = _ref.allCacheKeys,
            debug = _ref.debug,
            allowFlushingCollectionCache = _ref.allowFlushingCollectionCache;if (!

            Number.isInteger(ttl)) {_context.next = 40;break;}
            // https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-caching#apollo-server-caching
            cache.set(key, doc, {
              ttl: ttl });if (!

            allowFlushingCollectionCache) {_context.next = 40;break;}_context.next = 6;return (
              cache.get(allCacheKeys));case 6:_context.t0 = _context.sent;if (_context.t0) {_context.next = 9;break;}_context.t0 = [];case 9:allKeys = _context.t0;if (

            allKeys.find(function (k) {return k === key;})) {_context.next = 28;break;}
            allKeys.push(key);
            newKeys = _toConsumableArray(new Set(allKeys));
            cache.set(allCacheKeys, newKeys, { ttl: ttl });if (!
            debug) {_context.next = 26;break;}_context.t1 =
            console;_context.t2 =

            key;_context.next = 19;return (

              cache.get(allCacheKeys));case 19:_context.t3 = _context.sent;if (!_context.t3) {_context.next = 24;break;}_context.next = 23;return (
              cache.get(allCacheKeys));case 23:_context.t3 = _context.sent.length;case 24:_context.t4 = _context.t3;_context.t1.log.call(_context.t1, 'All Keys Cache: Added => ', _context.t2, '#keys', _context.t4);case 26:_context.next = 40;break;case 28:if (!


            debug) {_context.next = 40;break;}_context.t5 =
            console;_context.t6 =

            key;_context.next = 33;return (

              cache.get(allCacheKeys));case 33:_context.t7 = _context.sent;if (!_context.t7) {_context.next = 38;break;}_context.next = 37;return (
              cache.get(allCacheKeys));case 37:_context.t7 = _context.sent.length;case 38:_context.t8 = _context.t7;_context.t5.log.call(_context.t5, 'All Keys Cache: Found => ', _context.t6, '#keys', _context.t8);case 40:case "end":return _context.stop();}}}, _callee);}));return function handleCache(_x) {return _ref2.apply(this, arguments);};}();






var remapDocs = function remapDocs(docs, ids) {
  var idMap = {};
  docs.forEach(function (doc) {
    idMap[doc._id] = doc; // eslint-disable-line no-underscore-dangle
  });
  return ids.map(function (id) {return idMap[id];});
};

// eslint-disable-next-line import/prefer-default-export
export var setupCaching = function setupCaching(_ref3)





{var collection = _ref3.collection,cache = _ref3.cache,_ref3$allowFlushingCo = _ref3.allowFlushingCollectionCache,allowFlushingCollectionCache = _ref3$allowFlushingCo === void 0 ? false : _ref3$allowFlushingCo,_ref3$mongoose = _ref3.mongoose,mongoose = _ref3$mongoose === void 0 ? false : _ref3$mongoose,_ref3$debug = _ref3.debug,debug = _ref3$debug === void 0 ? false : _ref3$debug;
  var loader = new DataLoader(function (ids) {return (
      mongoose ?
      collection.
      find({ _id: { $in: ids } }).
      then(function (docs) {return remapDocs(docs, ids);}) :
      collection.
      find({ _id: { $in: ids } }).
      toArray().
      then(function (docs) {return remapDocs(docs, ids);}));});


  var cachePrefix = "mongo-".concat(
  collection.collectionName // eslint-disable-line no-nested-ternary
  ? collection.collectionName :
  collection.modelName ?
  collection.modelName :
  'test', "-");

  var allCacheKeys = "".concat(cachePrefix, "all-keys");

  // eslint-disable-next-line no-param-reassign
  collection.findOneById = /*#__PURE__*/function () {var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(id) {var _ref5,ttl,key,cacheDoc,doc,_args2 = arguments;return _regeneratorRuntime.wrap(function _callee2$(_context2) {while (1) {switch (_context2.prev = _context2.next) {case 0:_ref5 = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : {}, ttl = _ref5.ttl;if (
              id) {_context2.next = 3;break;}return _context2.abrupt("return",
              null);case 3:

              key = cachePrefix + id;_context2.next = 6;return (

                cache.get(key));case 6:cacheDoc = _context2.sent;
              if (debug) {
                console.log('KEY', key, cacheDoc ? 'cache' : 'miss');
              }if (!
              cacheDoc) {_context2.next = 10;break;}return _context2.abrupt("return",
              cacheDoc);case 10:_context2.next = 12;return (


                loader.load(id));case 12:doc = _context2.sent;_context2.next = 15;return (
                handleCache({
                  ttl: ttl,
                  doc: doc,
                  key: key,
                  cache: cache,
                  allCacheKeys: allCacheKeys,
                  debug: debug,
                  allowFlushingCollectionCache: allowFlushingCollectionCache }));case 15:return _context2.abrupt("return",


              doc);case 16:case "end":return _context2.stop();}}}, _callee2);}));return function (_x2) {return _ref4.apply(this, arguments);};}();


  // eslint-disable-next-line no-param-reassign
  collection.findManyByIds = function (ids) {var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},ttl = _ref6.ttl;return (
      Promise.all(ids.map(function (id) {return collection.findOneById(id, { ttl: ttl });})));};

  var dataQuery = mongoose ?
  function (_ref7) {var queries = _ref7.queries;return (
      collection.
      find({ $or: queries }).
      then(function (items) {return queries.map(function (query) {return items.filter(sift(query));});}));} :
  function (_ref8) {var queries = _ref8.queries;return (
      collection.
      find({ $or: queries }).
      toArray().
      then(function (items) {return queries.map(function (query) {return items.filter(sift(query));});}));};

  var queryLoader = new DataLoader(function (queries) {return dataQuery({ queries: queries });});

  // eslint-disable-next-line no-param-reassign
  collection.findManyByQuery = /*#__PURE__*/function () {var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(query) {var _ref10,ttl,key,cacheDocs,docs,_args3 = arguments;return _regeneratorRuntime.wrap(function _callee3$(_context3) {while (1) {switch (_context3.prev = _context3.next) {case 0:_ref10 = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {}, ttl = _ref10.ttl;
              key = cachePrefix + JSON.stringify(query);_context3.next = 4;return (

                cache.get(key));case 4:cacheDocs = _context3.sent;
              if (debug) {
                console.log('KEY', key, cacheDocs ? 'cache' : 'miss');
              }if (!
              cacheDocs) {_context3.next = 8;break;}return _context3.abrupt("return",
              cacheDocs);case 8:_context3.next = 10;return (

                queryLoader.load(query));case 10:docs = _context3.sent;_context3.next = 13;return (
                handleCache({
                  ttl: ttl,
                  doc: docs,
                  key: key,
                  cache: cache,
                  allCacheKeys: allCacheKeys,
                  debug: debug,
                  allowFlushingCollectionCache: allowFlushingCollectionCache }));case 13:return _context3.abrupt("return",

              docs);case 14:case "end":return _context3.stop();}}}, _callee3);}));return function (_x3) {return _ref9.apply(this, arguments);};}();


  // eslint-disable-next-line no-param-reassign
  collection.deleteFromCacheById = /*#__PURE__*/function () {var _ref11 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(id) {var key, allKeys, newKeys;return _regeneratorRuntime.wrap(function _callee4$(_context4) {while (1) {switch (_context4.prev = _context4.next) {case 0:
              key = id && typeof id === 'object' ? JSON.stringify(id) : id;_context4.next = 3;return (
                cache.get(allCacheKeys));case 3:_context4.t0 = _context4.sent;if (_context4.t0) {_context4.next = 6;break;}_context4.t0 = [];case 6:allKeys = _context4.t0;
              newKeys = allKeys.filter(function (k) {return k !== "".concat(cachePrefix).concat(key);});_context4.next = 10;return (
                cache["delete"](cachePrefix + key));case 10:
              if (allowFlushingCollectionCache) cache.set(allCacheKeys, newKeys);case 11:case "end":return _context4.stop();}}}, _callee4);}));return function (_x4) {return _ref11.apply(this, arguments);};}();
  // this works also for byQueries just passing a stringified query as the id

  // eslint-disable-next-line no-param-reassign
  collection.flushCollectionCache = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {var allKeys, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, key;return _regeneratorRuntime.wrap(function _callee5$(_context5) {while (1) {switch (_context5.prev = _context5.next) {case 0:if (
            allowFlushingCollectionCache) {_context5.next = 2;break;}return _context5.abrupt("return", null);case 2:_context5.next = 4;return (
              cache.get(allCacheKeys));case 4:_context5.t0 = _context5.sent;if (_context5.t0) {_context5.next = 7;break;}_context5.t0 = [];case 7:allKeys = _context5.t0;
            // eslint-disable-next-line no-restricted-syntax
            _iteratorNormalCompletion = true;_didIteratorError = false;_iteratorError = undefined;_context5.prev = 11;for (_iterator = allKeys[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {key = _step.value;
              cache["delete"](key);
            }_context5.next = 19;break;case 15:_context5.prev = 15;_context5.t1 = _context5["catch"](11);_didIteratorError = true;_iteratorError = _context5.t1;case 19:_context5.prev = 19;_context5.prev = 20;if (!_iteratorNormalCompletion && _iterator["return"] != null) {_iterator["return"]();}case 22:_context5.prev = 22;if (!_didIteratorError) {_context5.next = 25;break;}throw _iteratorError;case 25:return _context5.finish(22);case 26:return _context5.finish(19);case 27:
            cache.set(allCacheKeys, []);return _context5.abrupt("return",
            true);case 29:case "end":return _context5.stop();}}}, _callee5, null, [[11, 15, 19, 27], [20,, 22, 26]]);}));

};