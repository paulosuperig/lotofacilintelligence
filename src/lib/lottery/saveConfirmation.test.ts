import { describe, expect, it } from 'vitest';
import { confirmGameSave, type SaveResult } from './saveConfirmation';

describe('AUD-004: persistence acknowledgement', () => {
  it('waits for persistence instead of confirming generated games', async () => {
    let resolveSave: ((value: SaveResult) => void) | undefined;
    const save = new Promise<SaveResult>((resolve) => { resolveSave = resolve; });
    let confirmed = false;
    const pending = confirmGameSave([], () => save).then((outcome) => { confirmed = outcome.success; return outcome; });
    await Promise.resolve();
    expect(confirmed).toBe(false);
    if (!resolveSave) throw new Error('Missing resolver');
    resolveSave({ success: true, duplicate: false, savedCount: 2 });
    expect((await pending).savedCount).toBe(2);
    expect(confirmed).toBe(true);
  });
  it('does not confirm unsuccessful persistence or duplicates', async () => {
    expect(await confirmGameSave([], async () => ({ success: false, duplicate: false, savedCount: 0 })))
      .toEqual({ success: false, duplicate: false, savedCount: 0 });
    expect(await confirmGameSave([], async () => ({ success: false, duplicate: true, savedCount: 0 })))
      .toEqual({ success: false, duplicate: true, savedCount: 0 });
  });
  it('propagates rejected persistence without a success acknowledgement', async () => {
    await expect(confirmGameSave([], async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  });
});