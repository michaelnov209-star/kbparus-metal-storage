import * as migration_20260727_135515_legacy_baseline from './20260727_135515_legacy_baseline';

export const migrations = [
  {
    up: migration_20260727_135515_legacy_baseline.up,
    down: migration_20260727_135515_legacy_baseline.down,
    name: '20260727_135515_legacy_baseline'
  },
];
