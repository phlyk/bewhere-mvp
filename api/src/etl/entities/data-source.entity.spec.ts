import { DataSource, UpdateFrequency } from './data-source.entity';

describe('DataSource Entity', () => {
  describe('UpdateFrequency enum', () => {
    it('should have correct values', () => {
      expect(UpdateFrequency.REALTIME).toBe('realtime');
      expect(UpdateFrequency.DAILY).toBe('daily');
      expect(UpdateFrequency.WEEKLY).toBe('weekly');
      expect(UpdateFrequency.MONTHLY).toBe('monthly');
      expect(UpdateFrequency.QUARTERLY).toBe('quarterly');
      expect(UpdateFrequency.YEARLY).toBe('yearly');
      expect(UpdateFrequency.IRREGULAR).toBe('irregular');
      expect(UpdateFrequency.HISTORICAL).toBe('historical');
    });

    it('should have exactly 8 frequency values', () => {
      const frequencyValues = Object.values(UpdateFrequency);
      expect(frequencyValues).toHaveLength(8);
    });

    it('should contain expected common frequencies', () => {
      const frequencyValues = Object.values(UpdateFrequency);
      expect(frequencyValues).toContain('monthly');
      expect(frequencyValues).toContain('yearly');
      expect(frequencyValues).toContain('historical');
    });
  });

  describe('DataSource class', () => {
    let dataSource: DataSource;

    beforeEach(() => {
      dataSource = new DataSource();
    });

    it('should create an instance', () => {
      expect(dataSource).toBeDefined();
      expect(dataSource).toBeInstanceOf(DataSource);
    });

    describe('code property', () => {
      it('should allow setting code', () => {
        dataSource.code = 'ETAT4001_MONTHLY';
        expect(dataSource.code).toBe('ETAT4001_MONTHLY');
      });

      it('should accept various code formats', () => {
        const validCodes = ['TIMESERIES', 'INSEE_POP', 'EUROSTAT_CRIM_01'];
        validCodes.forEach((code) => {
          dataSource.code = code;
          expect(dataSource.code).toBe(code);
        });
      });
    });

    describe('name property', () => {
      it('should allow setting name', () => {
        dataSource.name = 'État 4001 Monthly Snapshots';
        expect(dataSource.name).toBe('État 4001 Monthly Snapshots');
      });
    });

    describe('nameFr property', () => {
      it('should allow setting French name', () => {
        dataSource.nameFr = 'État 4001 - Données mensuelles';
        expect(dataSource.nameFr).toBe('État 4001 - Données mensuelles');
      });

      it('should allow null French name', () => {
        dataSource.nameFr = null;
        expect(dataSource.nameFr).toBeNull();
      });
    });

    describe('description property', () => {
      it('should allow setting description', () => {
        dataSource.description =
          'Monthly crime statistics from French Interior Ministry';
        expect(dataSource.description).toBe(
          'Monthly crime statistics from French Interior Ministry',
        );
      });

      it('should allow null description', () => {
        dataSource.description = null;
        expect(dataSource.description).toBeNull();
      });

      it('should handle long descriptions', () => {
        const longDescription = 'A'.repeat(5000);
        dataSource.description = longDescription;
        expect(dataSource.description).toBe(longDescription);
      });
    });

    describe('url property', () => {
      it('should allow setting url', () => {
        const url =
          'https://www.data.gouv.fr/fr/datasets/crimes-et-delits-enregistres/';
        dataSource.url = url;
        expect(dataSource.url).toBe(url);
      });

      it('should handle long URLs', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(2000);
        dataSource.url = longUrl;
        expect(dataSource.url).toBe(longUrl);
      });
    });

    describe('apiEndpoint property', () => {
      it('should allow setting API endpoint', () => {
        const endpoint = 'https://api.data.gouv.fr/datasets/xxx/download';
        dataSource.apiEndpoint = endpoint;
        expect(dataSource.apiEndpoint).toBe(endpoint);
      });

      it('should allow null API endpoint', () => {
        dataSource.apiEndpoint = null;
        expect(dataSource.apiEndpoint).toBeNull();
      });
    });

    describe('updateFrequency property', () => {
      it('should allow setting update frequency', () => {
        dataSource.updateFrequency = UpdateFrequency.MONTHLY;
        expect(dataSource.updateFrequency).toBe(UpdateFrequency.MONTHLY);
      });

      it('should accept all frequency enum values', () => {
        Object.values(UpdateFrequency).forEach((frequency) => {
          dataSource.updateFrequency = frequency;
          expect(dataSource.updateFrequency).toBe(frequency);
        });
      });
    });

    describe('provider property', () => {
      it('should allow setting provider', () => {
        dataSource.provider = "Ministère de l'Intérieur";
        expect(dataSource.provider).toBe("Ministère de l'Intérieur");
      });

      it('should allow null provider', () => {
        dataSource.provider = null;
        expect(dataSource.provider).toBeNull();
      });
    });

    describe('license property', () => {
      it('should allow setting license', () => {
        dataSource.license = 'Licence Ouverte v2.0';
        expect(dataSource.license).toBe('Licence Ouverte v2.0');
      });

      it('should allow common license types', () => {
        const licenses = [
          'Licence Ouverte v2.0',
          'CC BY 4.0',
          'CC BY-SA 4.0',
          'Public Domain',
        ];
        licenses.forEach((license) => {
          dataSource.license = license;
          expect(dataSource.license).toBe(license);
        });
      });

      it('should allow null license', () => {
        dataSource.license = null;
        expect(dataSource.license).toBeNull();
      });
    });

    describe('attribution property', () => {
      it('should allow setting attribution', () => {
        dataSource.attribution =
          "Source: Ministère de l'Intérieur - data.gouv.fr";
        expect(dataSource.attribution).toBe(
          "Source: Ministère de l'Intérieur - data.gouv.fr",
        );
      });

      it('should allow null attribution', () => {
        dataSource.attribution = null;
        expect(dataSource.attribution).toBeNull();
      });
    });

    describe('countryCode property', () => {
      it('should allow setting country code', () => {
        dataSource.countryCode = 'FR';
        expect(dataSource.countryCode).toBe('FR');
      });

      it('should allow null for international sources', () => {
        dataSource.countryCode = null;
        expect(dataSource.countryCode).toBeNull();
      });
    });

    describe('dataStartYear and dataEndYear properties', () => {
      it('should allow setting start year', () => {
        dataSource.dataStartYear = 1996;
        expect(dataSource.dataStartYear).toBe(1996);
      });

      it('should allow setting end year', () => {
        dataSource.dataEndYear = 2023;
        expect(dataSource.dataEndYear).toBe(2023);
      });

      it('should allow null years for unknown ranges', () => {
        dataSource.dataStartYear = null;
        dataSource.dataEndYear = null;
        expect(dataSource.dataStartYear).toBeNull();
        expect(dataSource.dataEndYear).toBeNull();
      });

      it('should allow null end year for ongoing data', () => {
        dataSource.dataStartYear = 2016;
        dataSource.dataEndYear = null;
        expect(dataSource.dataStartYear).toBe(2016);
        expect(dataSource.dataEndYear).toBeNull();
      });
    });

    describe('isActive property', () => {
      it('should allow setting active status', () => {
        dataSource.isActive = true;
        expect(dataSource.isActive).toBe(true);
      });

      it('should allow deactivating source', () => {
        dataSource.isActive = false;
        expect(dataSource.isActive).toBe(false);
      });
    });

    describe('lastImportedAt property', () => {
      it('should allow setting last import date', () => {
        const now = new Date();
        dataSource.lastImportedAt = now;
        expect(dataSource.lastImportedAt).toBe(now);
      });

      it('should allow null for never-imported sources', () => {
        dataSource.lastImportedAt = null;
        expect(dataSource.lastImportedAt).toBeNull();
      });
    });

    describe('metadata property', () => {
      it('should allow setting metadata object', () => {
        const metadata = {
          encoding: 'ISO-8859-1',
          delimiter: ';',
          skipRows: 3,
        };
        dataSource.metadata = metadata;
        expect(dataSource.metadata).toEqual(metadata);
      });

      it('should allow nested metadata', () => {
        const metadata = {
          parsing: {
            encoding: 'UTF-8',
            delimiter: ',',
          },
          columns: {
            dateFormat: 'YYYY-MM',
            numericFields: ['count', 'rate'],
          },
        };
        dataSource.metadata = metadata;
        expect(dataSource.metadata).toEqual(metadata);
      });

      it('should allow null metadata', () => {
        dataSource.metadata = null;
        expect(dataSource.metadata).toBeNull();
      });

      it('should allow empty metadata object', () => {
        dataSource.metadata = {};
        expect(dataSource.metadata).toEqual({});
      });
    });

    describe('complete data source example', () => {
      it('should create a valid État 4001 data source', () => {
        dataSource.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        dataSource.code = 'ETAT4001_MONTHLY';
        dataSource.name = 'État 4001 Monthly Snapshots';
        dataSource.nameFr = 'État 4001 - Données mensuelles';
        dataSource.description =
          'Monthly crime statistics by département from French Interior Ministry';
        dataSource.url =
          'https://www.data.gouv.fr/fr/datasets/crimes-et-delits-enregistres/';
        dataSource.apiEndpoint =
          'https://static.data.gouv.fr/resources/.../datagouv-juin-2012-xxx.csv';
        dataSource.updateFrequency = UpdateFrequency.MONTHLY;
        dataSource.provider = "Ministère de l'Intérieur";
        dataSource.license = 'Licence Ouverte v2.0';
        dataSource.attribution =
          "Source: Ministère de l'Intérieur - DCPJ - État 4001";
        dataSource.countryCode = 'FR';
        dataSource.dataStartYear = 1996;
        dataSource.dataEndYear = null; // Still being updated
        dataSource.isActive = true;
        dataSource.lastImportedAt = new Date('2025-01-15T10:30:00Z');
        dataSource.metadata = {
          encoding: 'ISO-8859-1',
          delimiter: ';',
          skipRows: 3,
          departments: 96,
        };

        expect(dataSource.code).toBe('ETAT4001_MONTHLY');
        expect(dataSource.updateFrequency).toBe(UpdateFrequency.MONTHLY);
        expect(dataSource.countryCode).toBe('FR');
        expect(dataSource.isActive).toBe(true);
        expect(dataSource.metadata?.encoding).toBe('ISO-8859-1');
      });

      it('should create a valid Time Series data source', () => {
        dataSource.code = 'TIMESERIES';
        dataSource.name = 'Crime Time Series';
        dataSource.nameFr = 'Séries chronologiques de la délinquance';
        dataSource.description =
          'Monthly crime time series data from 2016 onwards';
        dataSource.url =
          'https://www.data.gouv.fr/fr/datasets/series-chronologiques/';
        dataSource.updateFrequency = UpdateFrequency.MONTHLY;
        dataSource.provider = "Ministère de l'Intérieur";
        dataSource.license = 'Licence Ouverte v2.0';
        dataSource.countryCode = 'FR';
        dataSource.dataStartYear = 2016;
        dataSource.isActive = true;
        dataSource.metadata = {
          encoding: 'UTF-8',
          delimiter: ',',
          hasHeader: true,
        };

        expect(dataSource.code).toBe('TIMESERIES');
        expect(dataSource.dataStartYear).toBe(2016);
        expect(dataSource.metadata?.hasHeader).toBe(true);
      });

      it('should create a valid historical/inactive data source', () => {
        dataSource.code = 'LEGACY_CRIME_DATA';
        dataSource.name = 'Legacy Crime Statistics';
        dataSource.url = 'https://archive.example.com/legacy-data';
        dataSource.updateFrequency = UpdateFrequency.HISTORICAL;
        dataSource.countryCode = 'FR';
        dataSource.dataStartYear = 1980;
        dataSource.dataEndYear = 1995;
        dataSource.isActive = false;

        expect(dataSource.updateFrequency).toBe(UpdateFrequency.HISTORICAL);
        expect(dataSource.isActive).toBe(false);
        expect(dataSource.dataEndYear).toBe(1995);
      });
    });
  });
});
