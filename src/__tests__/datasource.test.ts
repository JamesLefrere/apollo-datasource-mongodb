import { MongoDataSource } from '../datasource';
import { CachedCollection } from '../cache';

describe('MongoDataSource', () => {
  const collections = [
    { collectionName: 'users' },
    { collectionName: 'posts' },
  ];

  it('creates a collection with caching', () => {
    // @ts-ignore
    const source = new MongoDataSource(collections);
    source.initialize({});
    expect(source.collections.users).toBeInstanceOf(CachedCollection);
    expect(source.collections.posts).toBeInstanceOf(CachedCollection);
  });
});
