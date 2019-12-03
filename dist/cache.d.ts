import { Collection, ObjectID } from 'mongodb';
import { KeyValueCache } from 'apollo-server-caching';
export interface Schema {
    readonly _id: ObjectID;
}
export interface CachedCollectionOptions {
    readonly allowFlushingCollectionCache: boolean;
}
declare type CacheValue<TSchema extends Schema> = TSchema | TSchema[] | string | string[];
export declare class CachedCollection<TSchema extends Schema> {
    private readonly cache;
    private readonly collection;
    private readonly loader;
    private readonly queryLoader;
    private readonly cachePrefix;
    private readonly allCacheKeys;
    private readonly options;
    private static remapDocs;
    constructor(collection: Collection, cache: KeyValueCache, options?: CachedCollectionOptions);
    private handleCache;
    findOneById(id: any, { ttl }?: {
        ttl: any;
    }): Promise<CacheValue<TSchema>>;
    findManyByIds(ids: any, { ttl }?: {
        ttl: any;
    }): Promise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    findManyByQuery(query: any, { ttl }?: {
        ttl: any;
    }): Promise<CacheValue<TSchema>>;
    deleteFromCacheById(id: unknown): Promise<void>;
    flushCollectionCache(): Promise<boolean>;
}
export {};
