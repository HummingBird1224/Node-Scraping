const express = require( "express" );
const router = express.Router();
const scrape = require( "../controllers/scrape.controller.js" );

router.post( '/getInfo', scrape.getInfo );

module.exports = router;