import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Created with: npm run migration:create -- src/database/migrations/CreateUsersTable
 */
export class CreateUsersTable1793068510691 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'username', type: 'varchar', length: '50', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'image', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'role',
            type: 'enum',
            enum: ['user', 'admin'],
            enumName: 'users_role_enum',
            default: "'user'",
          },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // down() must fully reverse up(): drop the table, then the enum type
    await queryRunner.dropTable('users');
    await queryRunner.query('DROP TYPE IF EXISTS "users_role_enum"');
  }
}
