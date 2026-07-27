import * as migration_20260727_135515_legacy_baseline from './20260727_135515_legacy_baseline';
import * as migration_20260728_001500_seo_yandex_history from './20260728_001500_seo_yandex_history';

export const migrations = [
  {
    up: migration_20260727_135515_legacy_baseline.up,
    down: migration_20260727_135515_legacy_baseline.down,
    name: '20260727_135515_legacy_baseline'
  },
  {
    up: migration_20260728_001500_seo_yandex_history.up,
    down: migration_20260728_001500_seo_yandex_history.down,
    name: '20260728_001500_seo_yandex_history'
  },
];
