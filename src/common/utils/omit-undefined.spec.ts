import { omitUndefined } from './omit-undefined.js';

describe('omitUndefined', () => {
  it('drops undefined keys, keeps null / empty string / 0 / false', () => {
    expect(
      omitUndefined({ a: undefined, b: null, c: '', d: 0, e: false, f: 'x' }),
    ).toEqual({ b: null, c: '', d: 0, e: false, f: 'x' });
  });
});
