import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('user_meal',(table)=>{
        table.uuid('id').primary()
        //CHAVE ESTRANGEIRA PARA USERS
        table.uuid('user_id').references('id')
        .inTable('users')
        .notNullable()

        //CHAVE ESTRANGEIRA PARA MEAL
        table.uuid('meal_id')
        .references('id')
        .inTable('meal')
        .notNullable()

        //EVITAR DE ADICIONAR MESAM REFEIÇÃO NO MESMO HORARIO
        //table.unique(['user_id', 'meal_id', 'time_consumed'])
    })
        
}


export async function down(knex: Knex): Promise<void> {
}

