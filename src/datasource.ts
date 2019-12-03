import { DataSource } from 'apollo-datasource'
import { Collection } from 'mongodb'
import { InMemoryLRUCache, KeyValueCache } from 'apollo-server-caching'

import { CachedCollection } from './cache'

interface MongoDataSourceConfig<T> {
  allowFlushingCollectionCache?: boolean
  context?: T
  cache?: KeyValueCache
}

interface Collections {
  [collectionName: string]: CachedCollection<any>
}

class MongoDataSource<TCollections extends Collections, TContext> extends DataSource<TContext> {
  private readonly rawCollections: Collection[]

  public collections: TCollections

  context: TContext

  constructor(collections: Collection[]) {
    super()
    this.rawCollections = collections
  }

  // https://github.com/apollographql/apollo-server/blob/master/packages/apollo-datasource/src/index.ts
  initialize(config: MongoDataSourceConfig<TContext> = {}) {
    this.context = config.context

    const cache = config.cache || new InMemoryLRUCache()

    this.collections = this.rawCollections.reduce((acc, collection) => ({
      ...acc,
      [collection.collectionName]: new CachedCollection(collection, cache, {
        allowFlushingCollectionCache: false,
      })
    }), {}) as TCollections
  }
}

export { MongoDataSource, CachedCollection }
