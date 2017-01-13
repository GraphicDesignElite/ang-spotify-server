const express = require('express');
const router = express.Router();

const API = 'https://spotify.com/api/';

    /* GET api listing. */
    router.get('/', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ message: "API Is Active" }, null, 3));
    });

   
module.exports = router;

