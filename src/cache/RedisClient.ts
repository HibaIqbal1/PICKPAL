/**
 * Cache Client: Production Upstash/Redis client with automatic in-memory fallback for development.
 */

interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number>;
}

class InMemoryCache implements CacheStore {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async incr(key: string, ttlSeconds = 900): Promise<number> {
    const current = await this.get(key);
    const count = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, count.toString(), ttlSeconds);
    return count;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiresAt) return -1;
    const remaining = Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
    return remaining;
  }
}

class UpstashRedisCache implements CacheStore {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async command(cmd: string[]): Promise<any> {
    const res = await fetch(`${this.url}/${cmd.join("/")}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    const data = await res.json();
    return data.result;
  }

  async get(key: string): Promise<string | null> {
    try {
      const res = await this.command(["get", key]);
      return res ? String(res) : null;
    } catch (err) {
      console.warn("Redis GET fallback:", err);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.command(["setex", key, ttlSeconds.toString(), value]);
      } else {
        await this.command(["set", key, value]);
      }
    } catch (err) {
      console.warn("Redis SET fallback:", err);
    }
  }

  async incr(key: string, ttlSeconds = 900): Promise<number> {
    try {
      const count = await this.command(["incr", key]);
      if (count === 1 && ttlSeconds) {
        await this.command(["expire", key, ttlSeconds.toString()]);
      }
      return typeof count === "number" ? count : parseInt(count, 10);
    } catch (err) {
      console.warn("Redis INCR fallback:", err);
      return 1;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.command(["del", key]);
    } catch (err) {
      console.warn("Redis DEL fallback:", err);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const remaining = await this.command(["ttl", key]);
      return typeof remaining === "number" ? remaining : -1;
    } catch (err) {
      console.warn("Redis TTL fallback:", err);
      return -1;
    }
  }
}

// Instantiate Upstash Redis if configured in env, else fallback to InMemoryCache
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const RedisClient: CacheStore =
  upstashUrl && upstashToken
    ? new UpstashRedisCache(upstashUrl, upstashToken)
    : new InMemoryCache();
