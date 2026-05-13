import type { BenefitCatalogTool } from '../ports';
import type { BenefitLookup } from '../domain';

export class FixtureBenefitCatalogTool implements BenefitCatalogTool {
  constructor(private readonly rows: BenefitLookup[]) {}
  async lookup(input: { planId: string; category: string; year: number; network?: string }): Promise<BenefitLookup[]> {
    return this.rows.filter((row) => row.planId === input.planId && row.category.toLowerCase() === input.category.toLowerCase() && row.year === input.year && (!input.network || row.network === input.network || row.network === 'unknown'));
  }
}
