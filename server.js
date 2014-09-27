var cheerio = require('cheerio');
var express = require('express');
var fs      = require('fs');
var jade    = require('jade');
var redis   = require('redis');
var request = require('request');
var app     = express();

const host = 'http://kissanime.com';
const folder = '/Anime/';

// Create Redis client and log errors.
var options = { retry_max_delay: 30 * 1000 };
var client = redis.createClient(options);
client.on('error', function(error) {
    console.log(error);
});


// Configurations.
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    app.render('index', function(err, html) {
        if (err) {
            console.log(err);
            res.send('error');
        }
        res.send(html);
    });
});

app.get('/add', function add(req, res) {
    // Kissanime stores anime names with hyphens replacing spaces.
    var input = req.query.animeName;
    var animeName = input.replace(' ', '-');
    var showUrl = host + folder + animeName;

    // TODO: Check in Redis if we already scraped the page.
    console.log(showUrl);
    var options = { 
        url: showUrl,
        headers: {
            'User-Agent': 'curl/7.30.0',
            'Accept': '*/*',
            'Host': 'kissanime.com'
        }
    };
    
    // Use cheerio to scrape the page and get video links.
    request(options, function scrapePage(err, response, html) {
        console.log('Status: ' + response.statusCode);
        if (err) {
            return console.error(err);
        }

        var $ = cheerio.load(html);
        var found = $('p:contains(\'Not found\')');

        // Anime not found.
        if (found.length !== 0) {
            res.send('anime not found!');
            return console.error('anime not found' + found);
        }

        // Create a hash entry for this new anime.
        var hash = {
            finished: false,
            episodes: []
        };

        // Get all 'a' tags, and get their links.
        $('a[href*=\'Episode\']').each(function(index, element) {
            hash.episodes[index] = host + $(this).attr('href');
        });

        // Do stuff.
        client.hmset(input, hash, redis.print);
        res.send('success!');
    });
});

app.get('/scrape', function(req, res) {
    var url = 'http://www.imdb.com/title/tt1229340/';

    request(url, function(error, response, html) {
        if (error) {
            return console.error('request failed: ' + error);
        }
        var $ = cheerio.load(html);
        var title, release, rating;
        var json = { title: "", release: "", rating: "" };

        $('title').filter(function() {
            var data = $(this);
            title = data.text();
            json.title = title;
        });

        $('div .txt-block:contains(\'Release Date\')').filter(function() {
            var data = $(this);
            var release = data.text().split(':')[1].split('(')[0].trim();
            json.release = release;
        });

        $('span[itemprop=\'ratingValue\']').filter(function() {
            var data = $(this);
            rating = data.text();
            json.rating = rating;
        });

        var scraped = JSON.stringify(json, null, 4);
        res.render('index', { json: scraped });
    });
});

app.listen('8080');
console.log('Listening on port 8080');
exports = module.exports = app;
