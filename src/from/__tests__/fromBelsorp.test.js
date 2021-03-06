import { readFileSync } from 'fs';
import { join } from 'path';

import { fromBelsorp, testables } from '../fromBelsorp';

let xlsx = require('xlsx');

const { parseIsothermBlock, getAdsDesMeta, parseAdsDesData } = testables;

test('fromBelsorp', () => {
  const workbook = xlsx.readFile(join(__dirname, '../../../testFiles/BET.xls'));

  const adsDesSheet = workbook.Sheets.AdsDes;

  // Parsing metadata
  const meta = getAdsDesMeta(adsDesSheet);

  expect(meta.sampleWeight).toStrictEqual(0.033);
  expect(meta.sampleWeightUnit).toStrictEqual('g');

  expect(meta.adsorptionT).toStrictEqual(77);
  expect(meta.saturatedVaporPressure).toStrictEqual(83.744);
  expect(meta.saturatedVaporPressureUnit).toStrictEqual('kPa');

  // Parse an isotherm block
  const rangeAds = {
    s: { c: 1, r: 22 },
    e: { c: 6, r: 22 + 21 - 1 },
  };
  const isothermBlock = parseIsothermBlock(adsDesSheet, rangeAds);
  expect(isothermBlock.pi).toHaveLength(21);
  expect(isothermBlock.pe).toHaveLength(21);
  expect(isothermBlock.pe2).toHaveLength(21);
  expect(isothermBlock.p0).toHaveLength(21);
  expect(isothermBlock.pp0).toHaveLength(21);
  expect(isothermBlock.va).toHaveLength(21);

  // Parsing the datablock
  const data = parseAdsDesData(adsDesSheet, 21, 11);
  expect(data.adsorption.p0).toHaveLength(21);
  expect(data.desorption.p0).toHaveLength(11);

  expect(data.adsorption.p0[0]).toStrictEqual(83.744);
  expect(data.adsorption.va[20]).toBeCloseTo(9822.4457, 3);

  expect(data.desorption.p0[0]).toStrictEqual(83.744);
  expect(data.desorption.va[10]).toBeCloseTo(8838.2381176, 3);

  const dataFile = readFileSync(join(__dirname, '../../../testFiles/BET.xls'));
  const analysis = fromBelsorp(dataFile);

  expect(analysis.spectra).toHaveLength(2);

  expect(Object.keys(analysis.spectra[0].variables)).toStrictEqual([
    'x',
    'p',
    'y',
  ]);
  expect(Object.keys(analysis.spectra[1].variables)).toStrictEqual([
    'x',
    'p',
    'y',
  ]);

  expect(analysis.spectra[0].dataType).toBe('Adsorption Isotherm');
  expect(analysis.spectra[1].dataType).toBe('Desorption Isotherm');
});
