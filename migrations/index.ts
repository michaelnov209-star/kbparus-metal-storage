import * as migration_20260727_135515_legacy_baseline from './20260727_135515_legacy_baseline';
import * as migration_20260728_001500_seo_yandex_history from './20260728_001500_seo_yandex_history';
import * as migration_20260728_203000_calculator_option_key from './20260728_203000_calculator_option_key';

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
  {
    up: migration_20260728_203000_calculator_option_key.up,
    down: migration_20260728_203000_calculator_option_key.down,
    name: '20260728_203000_calculator_option_key'
  },
];
