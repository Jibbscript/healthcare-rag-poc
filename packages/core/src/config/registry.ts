import type { Profile } from '../domain';
import type { ProviderBundle } from '../ports';

export type ProviderFactory = () => ProviderBundle | Promise<ProviderBundle>;

export class ProviderRegistry {
  private readonly factories = new Map<Profile, ProviderFactory>();

  register(profile: Profile, factory: ProviderFactory): this {
    this.factories.set(profile, factory);
    return this;
  }

  async resolve(profile: Profile): Promise<ProviderBundle> {
    const factory = this.factories.get(profile);
    if (!factory) throw new Error(`Unknown provider profile: ${profile}`);
    return factory();
  }

  profiles(): Profile[] {
    return [...this.factories.keys()].sort();
  }
}
