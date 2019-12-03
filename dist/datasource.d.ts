import { DataSource } from 'apollo-datasource';
import { Collection } from 'mongodb';
import { KeyValueCache } from 'apollo-server-caching';
import { CachedCollection } from './cache';
interface MongoDataSourceConfig<T> {
    allowFlushingCollectionCache?: boolean;
    context?: T;
    cache?: KeyValueCache;
}
interface Collections {
    [collectionName: string]: CachedCollection<any>;
}
declare class MongoDataSource<TCollections extends Collections, TContext> extends DataSource<TContext> {
    private readonly rawCollections;
    collections: TCollections;
    context: TContext;
    constructor(collections: Collection[]);
    initialize(config?: MongoDataSourceConfig<TContext>): void;
}
export { MongoDataSource, CachedCollection };
