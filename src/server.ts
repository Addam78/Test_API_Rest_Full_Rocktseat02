import dotenv from 'dotenv'
import {app} from './app.js'

import 'dotenv/config';
const PORT  = Number(process.env.PORT) 
app.listen({port:PORT})