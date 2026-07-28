import * as migration_20260727_135515_legacy_baseline from './20260727_135515_legacy_baseline';
import * as migration_20260728_001500_seo_yandex_history from './20260728_001500_seo_yandex_history';
import * as migration_20260728_203000_calculator_option_key from './20260728_203000_calculator_option_key';
import * as migration_20260728_213000_calculator_hybrid_limit from './20260728_213000_calculator_hybrid_limit';
import * as migration_20260728_214500_calculator_option_business_key from './20260728_214500_calculator_option_business_key';
import * as migration_20260728_221500_media_visibility from './20260728_221500_media_visibility';
import * as migration_20260728_224500_lead_rate_limits from './20260728_224500_lead_rate_limits';

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
  {
    up: migration_20260728_213000_calculator_hybrid_limit.up,
    down: migration_20260728_213000_calculator_hybrid_limit.down,
    name: '20260728_213000_calculator_hybrid_limit'
  },
  {
    up: migration_20260728_214500_calculator_option_business_key.up,
    down: migration_20260728_214500_calculator_option_business_key.down,
    name: '20260728_214500_calculator_option_business_key'
  },
  {
    up: migration_20260728_221500_media_visibility.up,
    down: migration_20260728_221500_media_visibility.down,
    name: '20260728_221500_media_visibility'
  },
  {
    up: migration_20260728_224500_lead_rate_limits.up,
    down: migration_20260728_224500_lead_rate_limits.down,
    name: '20260728_224500_lead_rate_limits'
  },
];
