import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('meal', (table) =>{
        table.dropColumn('time_meal')
    })
}


export async function down(knex: Knex): Promise<void> {
     await knex.schema.alterTable('meal', (table) =>{
       table.dateTime('time_meal')
    })
}

