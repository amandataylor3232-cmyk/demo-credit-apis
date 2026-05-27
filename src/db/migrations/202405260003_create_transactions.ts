import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table
      .integer('wallet_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE');
    table
      .string('type', 20)
      .notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('reference', 100).nullable();
    table
      .integer('counterparty_wallet_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('wallets');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}
