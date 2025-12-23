import { GlideClient } from '@valkey/valkey-glide';

/**
 * Mock Redis client for testing
 * Provides in-memory implementations of Redis operations
 */
export class MockRedisClient {
    private data: Map<string, any> = new Map();
    private sets: Map<string, Set<string>> = new Map();
    private hashes: Map<string, Map<string, string>> = new Map();

    async hset(key: string, fieldValues: Array<{ field: string; value: string }>): Promise<number> {
        if (!this.hashes.has(key)) {
            this.hashes.set(key, new Map());
        }
        const hash = this.hashes.get(key)!;
        fieldValues.forEach(({ field, value }) => {
            hash.set(field, value);
        });
        return fieldValues.length;
    }

    async hget(key: string, field: string): Promise<string | null> {
        const hash = this.hashes.get(key);
        return hash?.get(field) ?? null;
    }

    async hgetall(key: string): Promise<{ field: string; value: string }[]> {
        const hash = this.hashes.get(key);
        if (!hash || hash.size === 0) return [];
        return Array.from(hash.entries()).map(([field, value]) => ({ field, value }));
    }

    async hdel(key: string, fields: string[]): Promise<number> {
        const hash = this.hashes.get(key);
        if (!hash) return 0;
        let count = 0;
        fields.forEach(field => {
            if (hash.delete(field)) count++;
        });
        return count;
    }

    async sadd(key: string, members: string[]): Promise<number> {
        if (!this.sets.has(key)) {
            this.sets.set(key, new Set());
        }
        const set = this.sets.get(key)!;
        let added = 0;
        members.forEach(member => {
            if (!set.has(member)) {
                set.add(member);
                added++;
            }
        });
        return added;
    }

    async srem(key: string, members: string[]): Promise<number> {
        const set = this.sets.get(key);
        if (!set) return 0;
        let removed = 0;
        members.forEach(member => {
            if (set.delete(member)) removed++;
        });
        return removed;
    }

    async smembers(key: string): Promise<string[]> {
        const set = this.sets.get(key);
        return set ? Array.from(set) : [];
    }

    async scard(key: string): Promise<number> {
        const set = this.sets.get(key);
        return set ? set.size : 0;
    }

    async sismember(key: string, member: string): Promise<boolean> {
        const set = this.sets.get(key);
        return set ? set.has(member) : false;
    }

    async spop(key: string): Promise<string | null> {
        const set = this.sets.get(key);
        if (!set || set.size === 0) return null;
        const value = Array.from(set)[0];
        set.delete(value);
        return value;
    }

    async del(keys: string[]): Promise<number> {
        let deleted = 0;
        keys.forEach(key => {
            if (this.data.delete(key)) deleted++;
            if (this.sets.delete(key)) deleted++;
            if (this.hashes.delete(key)) deleted++;
        });
        return deleted;
    }

    async invokeScript(script: any, options: { keys: string[]; args: string[] }): Promise<any> {
        // Mock script execution - should be overridden in tests
        throw new Error('invokeScript must be mocked in individual tests');
    }

    async close(): Promise<void> {
        this.data.clear();
        this.sets.clear();
        this.hashes.clear();
    }

    // Test helpers
    clear(): void {
        this.data.clear();
        this.sets.clear();
        this.hashes.clear();
    }

    getData(): Map<string, any> {
        return this.data;
    }

    getSets(): Map<string, Set<string>> {
        return this.sets;
    }

    getHashes(): Map<string, Map<string, string>> {
        return this.hashes;
    }
}

export function createMockRedisClient(): MockRedisClient {
    return new MockRedisClient();
}
