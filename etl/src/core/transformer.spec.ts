/**
 * Core module tests - Transformer base class
 */

import { BaseTransformer, TransformerOptions } from './transformer';

// Test implementation of BaseTransformer
interface RawRow {
  id: string;
  value: string;
  skip?: boolean;
}

interface TransformedRow {
  id: number;
  value: string;
  transformed: true;
}

class TestTransformer extends BaseTransformer<RawRow, TransformedRow> {
  constructor(options?: TransformerOptions) {
    super(options);
  }

  protected async transformRow(row: RawRow, index: number): Promise<TransformedRow | null> {
    // Skip rows marked for skipping
    if (row.skip) {
      return null;
    }

    // Validate id is numeric
    const id = parseInt(row.id, 10);
    if (isNaN(id)) {
      this.addError(index, 'Invalid id', 'id', row.id);
      throw new Error(`Invalid id: ${row.id}`);
    }

    return {
      id,
      value: row.value.toUpperCase(),
      transformed: true,
    };
  }

  async validate(): Promise<boolean> {
    return true;
  }
}

describe('BaseTransformer', () => {
  describe('transform', () => {
    it('should transform all rows', async () => {
      const transformer = new TestTransformer();
      const rawData: RawRow[] = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b' },
        { id: '3', value: 'c' },
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(3);
      expect(result.skippedCount).toBe(0);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({ id: 1, value: 'A', transformed: true });
    });

    it('should skip rows that return null', async () => {
      const transformer = new TestTransformer();
      const rawData: RawRow[] = [
        { id: '1', value: 'a' },
        { id: '2', value: 'b', skip: true },
        { id: '3', value: 'c' },
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(2);
      expect(result.skippedCount).toBe(1);
    });

    it('should handle errors with continueOnError', async () => {
      const transformer = new TestTransformer({ continueOnError: true });
      const rawData: RawRow[] = [
        { id: '1', value: 'a' },
        { id: 'invalid', value: 'b' },
        { id: '3', value: 'c' },
      ];

      const result = await transformer.transform(rawData);

      expect(result.transformedCount).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rowIndex).toBe(1);
    });

    it('should throw on error without continueOnError', async () => {
      const transformer = new TestTransformer({ continueOnError: false });
      const rawData: RawRow[] = [
        { id: '1', value: 'a' },
        { id: 'invalid', value: 'b' },
      ];

      await expect(transformer.transform(rawData)).rejects.toThrow();
    });

    it('should abort when maxErrors is reached', async () => {
      const transformer = new TestTransformer({
        continueOnError: true,
        maxErrors: 2,
      });
      const rawData: RawRow[] = [
        { id: 'invalid1', value: 'a' },
        { id: 'invalid2', value: 'b' },
        { id: 'invalid3', value: 'c' },
      ];

      await expect(transformer.transform(rawData)).rejects.toThrow('Too many transformation errors');
    });
  });

  describe('validate', () => {
    it('should validate configuration', async () => {
      const transformer = new TestTransformer();
      expect(await transformer.validate()).toBe(true);
    });
  });
});
