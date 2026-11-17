import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber } from '../src/core/number.js';

test('small thousands stay fully readable before ten thousand', () => {
  assert.equal(formatNumber(999), '999');
  assert.equal(formatNumber(1000), '1,000');
  assert.equal(formatNumber(9999), '9,999');
  assert.equal(formatNumber(10000), '10.0K');
});
