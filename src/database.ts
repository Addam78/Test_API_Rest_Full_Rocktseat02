import knex from "knex";
import type { Knex as KnexType } from "knex"; 

//KNEXTYPE.CONFIG, A INTERFACE DO KNEX PARA TIPAGEM DOS DADOS
export const config:KnexType.Config = {
  client: "sqlite3",
  connection: {
    //NOME DO BANCO DE DADOS
    filename: "./db/diet.db",
  },
  
  useNullAsDefault: true, // importante no sqlite
  migrations:{
    extension: 'ts',
    //ONDE O ARQUIVO VAI SER SALVO
    directory : './db/migrations',
  }
}
export const db = knex(config)
export default db