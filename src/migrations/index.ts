import * as migration_20250729_162700 from './20250729_162700';

export const migrations = [
  {
    up: migration_20250729_162700.up,
    down: migration_20250729_162700.down,
    name: '20250729_162700'
  },
];
