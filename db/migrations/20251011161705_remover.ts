import type { Knex } from "knex";
import { after } from "node:test";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('meal', (table) =>{
        table.dropForeign('user_id')
        table.dropColumn('user_id')
    })
}


export async function down(knex: Knex): Promise<void> {
      await knex.schema.alterTable('meal', (table) =>{
       table.uuid('user_id').after('description_meal').notNullable()
       table.foreign('user_id').references('id').inTable('users')
    })
}

