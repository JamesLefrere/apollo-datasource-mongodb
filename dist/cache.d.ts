import { Collection, ObjectID } from 'mongodb';
import { KeyValueCache } from 'apollo-server-caching';
export interface Schema {
    readonly _id: ObjectID;
}
export interface CachedCollectionOptions {
    readonly allowFlushingCollectionCache: boolean;
}
export declare class CachedCollection<TSchema extends Schema> {
    readonly collection: Collection<TSchema>;
    private readonly cache;
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
    }): Promise<TSchema>;
    findManyByIds(ids: any, { ttl }?: {
        ttl: any;
    }): Promise<TSchema[]>;
    findManyByQuery(query: any, { ttl }?: {
        ttl: any;
    }): Promise<TSchema[]>;
    deleteFromCacheById(id: unknown): Promise<void>;
    flushCollectionCache(): Promise<boolean>;
}
