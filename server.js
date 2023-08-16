const express = require( "express" );
const cors = require( "cors" );
const app = express();
const route = require( "./app/routes" );
const scrape = require( "./app/controllers/scrape.controller.js" );

var corsOptions = {
	origin: '*'
};

app.use( cors( corsOptions ) );
app.use( express.json() );
app.use( express.urlencoded( {extended: true} ) );

app.get( "/", ( req, res ) => {
	res.json( {message: "Welcome to Nursery application"} );
} );
route( app );
const PORT = process.env.PORT || 32768;
app.listen( PORT, () => {
	console.log( `Server is running on port ${PORT}.` );
} );

scrape.getInfo();