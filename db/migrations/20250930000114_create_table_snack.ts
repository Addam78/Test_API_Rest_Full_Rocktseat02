import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('meal',function(table){
        table.uuid('id').primary()
        table.string('name_meal').notNullable()
        table.string('description_meal')
        table.dateTime('time_meal')
        table.timestamp('created_at').defaultTo(knex.fn.now())

        table.uuid('user_id').references('id').inTable('users')
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('meal')
}

