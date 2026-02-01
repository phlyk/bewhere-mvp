/**
 * Core module tests - Extractor base class
 */

import { BaseExtractor, ExtractionResult, ExtractorOptions } from './extractor';

// Test implementation of BaseExtractor
class TestExtractor extends BaseExtractor<{ id: number; value: string }> {
  private mockData: { id: number; value: string }[];

  constructor(options: ExtractorOptions, mockData: { id: number; value: string }[] = []) {
    super(options);
    this.mockData = mockData;
  }

  async extract(): Promise<ExtractionResult<{ id: number; value: string }>> {
    const data = this.options.maxRows
      ? this.mockData.slice(0, this.options.maxRows)
      : this.mockData;

    return {
      data,
      source: this.options.source,
      rowCount: data.length,
      extractedAt: new Date(),
      warnings: [],
      encoding: this.options.encoding,
    };
  }

  async validate(): Promise<boolean> {
    return this.options.source.length > 0;
  }
}

describe('BaseExtractor', () => {
  describe('extract', () => {
    it('should extract data from source', async () => {
      const mockData = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
        { id: 3, value: 'c' },
      ];
      const extractor = new TestExtractor(
        { source: 'test.csv' },
        mockData,
      );

      const result = await extractor.extract();

      expect(result.data).toEqual(mockData);
      expect(result.rowCount).toBe(3);
      expect(result.source).toBe('test.csv');
    });

    it('should respect maxRows option', async () => {
      const mockData = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
        { id: 3, value: 'c' },
      ];
      const extractor = new TestExtractor(
        { source: 'test.csv', maxRows: 2 },
        mockData,
      );

      const result = await extractor.extract();

      expect(result.data).toHaveLength(2);
      expect(result.rowCount).toBe(2);
    });

    it('should include extraction timestamp', async () => {
      const extractor = new TestExtractor({ source: 'test.csv' }, []);
      const before = new Date();
      const result = await extractor.extract();
      const after = new Date();

      expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.extractedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validate', () => {
    it('should validate source', async () => {
      const extractor = new TestExtractor({ source: 'test.csv' }, []);
      expect(await extractor.validate()).toBe(true);
    });

    it('should fail validation for empty source', async () => {
      const extractor = new TestExtractor({ source: '' }, []);
      expect(await extractor.validate()).toBe(false);
    });
  });
});
