const express = require( "express" );
const router = express.Router();
const scrape = require( "./scrape.route" );
const bodyParser = require( "body-parser" );

const initializeRoute = ( app ) =>
{
    router.use( '/scrape', scrape );
    app.use( '/api/v1', router );
    app.use( bodyParser.json( {
        limit: '500mb'
    } ) );
    app.use( bodyParser.urlencoded( {
        limit: '500mb',
        extended: true,
        parameterLimit: 1000000
    } ) );
}

module.exports = initializeRoute;