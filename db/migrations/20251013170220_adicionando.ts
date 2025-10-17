import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
     await knex.schema.alterTable('meal', (table) =>{
        table.enum('diet',['s','n'])
    })
}


export async function down(knex: Knex): Promise<void> {
     await knex.schema.alterTable('meal', (table) =>{
        table.dropColumn('diet')
    })
}

