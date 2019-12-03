import DataLoader from 'dataloader'
import sift from 'sift'
import { Collection, FilterQuery, ObjectID } from 'mongodb'
import { KeyValueCache} from 'apollo-server-caching'

export interface Schema {
  readonly _id: ObjectID
}

export interface CachedCollectionOptions {
  readonly allowFlushingCollectionCache: boolean
}

type CacheValue<TSchema extends Schema> =
  | TSchema // Either a document
  | TSchema[] // Or an array of documents
  | string // Or a key
  | string[]; // Or an array of keys

export class CachedCollection<TSchema extends Schema> {
  private readonly cache: KeyValueCache<CacheValue<TSchema>>
  private readonly collection: Collection<TSchema>
  private readonly loader: DataLoader<string, TSchema>
  private readonly queryLoader: DataLoader<string, TSchema[]>
  private readonly cachePrefix: string
  private readonly allCacheKeys: string
  private readonly options: CachedCollectionOptions

  private static remapDocs(docs, ids) {
    const idMap = {}
    docs.forEach(doc => {
      idMap[doc._id] = doc
    })
    return ids.map(id => idMap[id])
  }

  constructor(collection: Collection, cache: KeyValueCache, options?: CachedCollectionOptions) {
    this.cache = cache
    this.collection = collection
    this.options = options || { allowFlushingCollectionCache: false }

    this.cachePrefix = `mongo-${
      this.collection.collectionName
        ? this.collection.collectionName
        : 'test'
    }-`
    this.allCacheKeys = `${this.cachePrefix}all-keys`

    this.loader = new DataLoader(ids => this.collection
      .find({ _id: { $in: ids.map(id => new ObjectID(id)) } } as FilterQuery<TSchema>)
      .toArray()
      .then(docs => CachedCollection.remapDocs(docs, ids))
    )

    this.queryLoader = new DataLoader(queries =>
      this.collection
        .find({ $or: queries } as unknown as FilterQuery<TSchema>)
        .toArray()
        .then(items => queries.map(query => items.filter(sift(query)))))
  }

  private async handleCache(doc: any, key: string, ttl?: number) {
    if (!Number.isInteger(ttl)) return null;

    // https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-caching#apollo-server-caching
    await this.cache.set(key, doc, { ttl })

    if (this.options.allowFlushingCollectionCache) {
      const allKeys = ((await this.cache.get(this.allCacheKeys)) || []) as string[]

      if (!allKeys.includes(key)) {
        allKeys.push(key)
        const newKeys = [...new Set(allKeys)]
        await this.cache.set(this.allCacheKeys, newKeys, { ttl })
      }
    }
  }

  public async findOneById(id, { ttl } = { ttl: undefined }) {
    if (!id) return null

    const key = this.cachePrefix + id

    const cacheDoc = await this.cache.get(key)
    if (cacheDoc) return cacheDoc

    const doc = await this.loader.load(id)

    await this.handleCache(doc, key, ttl)

    return doc
  }

  public async findManyByIds(ids, { ttl } = { ttl: undefined }) {
    // TODO this could be more efficient (find the subset that doesn't exist in cache, and use { _id: { $in: ids } }
    return Promise.all(ids.map(id => this.findOneById(id, { ttl })))
  }

  public async findManyByQuery(query, { ttl } = { ttl: undefined }) {
    const key = this.cachePrefix + JSON.stringify(query)

    const cacheDocs = await this.cache.get(key)
    if (cacheDocs) return cacheDocs

    const docs = await this.queryLoader.load(query)

    await this.handleCache(docs, key, ttl)

    return docs
  }

  // this works also for byQueries just passing a stringified query as the id
  public async deleteFromCacheById(id: unknown) {
    const key = id && typeof id === 'object' ? JSON.stringify(id) : id

    const allKeys = ((await this.cache.get(this.allCacheKeys)) || []) as string[]
    const newKeys = allKeys.filter(key => key !== `${this.cachePrefix}${key}`)
    await this.cache.delete(this.cachePrefix + key)

    if (this.options.allowFlushingCollectionCache) {
      await this.cache.set(this.allCacheKeys, newKeys)
    }
  }

  public async flushCollectionCache() {
    if (!this.options.allowFlushingCollectionCache) return null

    const allKeys = ((await this.cache.get(this.allCacheKeys)) || []) as string[]
    await Promise.all(allKeys.map(key => this.cache.delete(key)))

    await this.cache.set(this.allCacheKeys, [])

    return true
  }
}
