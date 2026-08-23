import * as migration_20260727_135515_legacy_baseline from './20260727_135515_legacy_baseline';
import * as migration_20260728_001500_seo_yandex_history from './20260728_001500_seo_yandex_history';
import * as migration_20260728_203000_calculator_option_key from './20260728_203000_calculator_option_key';
import * as migration_20260728_213000_calculator_hybrid_limit from './20260728_213000_calculator_hybrid_limit';
import * as migration_20260728_214500_calculator_option_business_key from './20260728_214500_calculator_option_business_key';
import * as migration_20260728_221500_media_visibility from './20260728_221500_media_visibility';
import * as migration_20260728_224500_lead_rate_limits from './20260728_224500_lead_rate_limits';
import * as migration_20260729_171300_bitrix_not_used_status from './20260729_171300_bitrix_not_used_status';
import * as migration_20260729_171400_bitrix_not_used_default from './20260729_171400_bitrix_not_used_default';
import * as migration_20260729_171500_product_editor_experience from './20260729_171500_product_editor_experience';
import * as migration_20260729_224943_calculator_profiles_dynamic from './20260729_224943_calculator_profiles_dynamic';
import * as migration_20260729_233207_admin_profiles_audit_snapshot from './20260729_233207_admin_profiles_audit_snapshot';
import * as migration_20260729_234013_immutable_audit_actor_snapshot from './20260729_234013_immutable_audit_actor_snapshot';
import * as migration_20260730_074038_admin_animal_avatars from './20260730_074038_admin_animal_avatars';
import * as migration_20260730_123000_admin_roles_and_invitations from './20260730_123000_admin_roles_and_invitations';

export const migrations = [
  {
    up: migration_20260727_135515_legacy_baseline.up,
    down: migration_20260727_135515_legacy_baseline.down,
    name: '20260727_135515_legacy_baseline',
  },
  {
    up: migration_20260728_001500_seo_yandex_history.up,
    down: migration_20260728_001500_seo_yandex_history.down,
    name: '20260728_001500_seo_yandex_history',
  },
  {
    up: migration_20260728_203000_calculator_option_key.up,
    down: migration_20260728_203000_calculator_option_key.down,
    name: '20260728_203000_calculator_option_key',
  },
  {
    up: migration_20260728_213000_calculator_hybrid_limit.up,
    down: migration_20260728_213000_calculator_hybrid_limit.down,
    name: '20260728_213000_calculator_hybrid_limit',
  },
  {
    up: migration_20260728_214500_calculator_option_business_key.up,
    down: migration_20260728_214500_calculator_option_business_key.down,
    name: '20260728_214500_calculator_option_business_key',
  },
  {
    up: migration_20260728_221500_media_visibility.up,
    down: migration_20260728_221500_media_visibility.down,
    name: '20260728_221500_media_visibility',
  },
  {
    up: migration_20260728_224500_lead_rate_limits.up,
    down: migration_20260728_224500_lead_rate_limits.down,
    name: '20260728_224500_lead_rate_limits',
  },
  {
    up: migration_20260729_171300_bitrix_not_used_status.up,
    down: migration_20260729_171300_bitrix_not_used_status.down,
    name: '20260729_171300_bitrix_not_used_status',
  },
  {
    up: migration_20260729_171400_bitrix_not_used_default.up,
    down: migration_20260729_171400_bitrix_not_used_default.down,
    name: '20260729_171400_bitrix_not_used_default',
  },
  {
    up: migration_20260729_171500_product_editor_experience.up,
    down: migration_20260729_171500_product_editor_experience.down,
    name: '20260729_171500_product_editor_experience',
  },
  {
    up: migration_20260729_224943_calculator_profiles_dynamic.up,
    down: migration_20260729_224943_calculator_profiles_dynamic.down,
    name: '20260729_224943_calculator_profiles_dynamic',
  },
  {
    up: migration_20260729_233207_admin_profiles_audit_snapshot.up,
    down: migration_20260729_233207_admin_profiles_audit_snapshot.down,
    name: '20260729_233207_admin_profiles_audit_snapshot',
  },
  {
    up: migration_20260729_234013_immutable_audit_actor_snapshot.up,
    down: migration_20260729_234013_immutable_audit_actor_snapshot.down,
    name: '20260729_234013_immutable_audit_actor_snapshot',
  },
  {
    up: migration_20260730_074038_admin_animal_avatars.up,
    down: migration_20260730_074038_admin_animal_avatars.down,
    name: '20260730_074038_admin_animal_avatars'
  },
  {
    up: migration_20260730_123000_admin_roles_and_invitations.up,
    down: migration_20260730_123000_admin_roles_and_invitations.down,
    name: '20260730_123000_admin_roles_and_invitations'
  },
];
