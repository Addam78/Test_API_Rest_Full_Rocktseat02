import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users',function (table){
        table.string('session_cookie')
    })
}


export async function down(knex: Knex): Promise<void> {
     await knex.schema.alterTable('users',function (table){
        table.dropColumn('session_cookie')
    })
}

