const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log('Se ha perdido la conexión con Postgres'));

pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, res) => {
    res.send('¡Hola!');
});

app.get('/values/all', async (req, res) => {
    // Para obtener todos los valores que tenemos
    // almacenados en POSTGRES (almacenamiento en BD)
    const values = await pgClient.query('SELECT * FROM values');

    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    // Para obtener todos los valores que tenemos
    // almacenados en REDIS (almacenamiento en memoria)
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('El índice a calcular es demasiado alto (>40)');
    }

    redisClient.hset('values', index, 'Nada por aquí');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values (number) VALUES ($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Escuchando en el puerto 5000')
});
