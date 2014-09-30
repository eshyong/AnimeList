'use strict';

var cheerio = require('cheerio');
var express = require('express');
var fs      = require('fs');
var jade    = require('jade');
var redis   = require('redis');
var request = require('request');
var app     = express();

var host = 'http://kissanime.com';
var folder = '/Anime/';

// Create Redis client and log errors.
var options = { retry_max_delay: 30 * 1000 };
var client = redis.createClient(options);

client.on('ready', function() {
    console.log('Redis is ready for commands');
});
client.on('error', function(error) {
    console.log(error);
});


// Configurations.
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static('public'));

app.get('/', function(req, res) {
    app.render('index', function(err, html) {
        if (err) {
            console.log(err);
            res.send('error');
        }
        res.send(html);
    });
});

// Helper function for getting name.
function getNameFromLink(input, link) {
    // Get name using regex.
    var nameRegex = new RegExp(input, 'i');
    var matches = link.match(nameRegex);
    var hyphenRegex = /-/g;
    return matches[0].replace(hyphenRegex, ' '); 
}

app.get('/add', function addAnime(req, res) {
    // Kissanime stores anime names with hyphens replacing spaces.
    var input = req.query.animeName;
    var spaceRegex = / /g;
    var animeName = input.replace(spaceRegex, '-').toLowerCase();
    var showUrl = host + folder + animeName;
    console.log(showUrl);

    // Check in Redis if we already scraped the page. This saves us time since querying
    // from Kissanime is *slow*.
    client.hgetall(input, function getCachedAnime(err, anime) {
        var json;
        if (err) {
            // Some sort of redis error.
            json = { error: err };
            res.send(json);
            return console.log(err);
        }
        if (anime !== null) {
            // When stored in the DB, arrays in JSON are turned into their string representation.
            // So we call split(',') on episodes to decode it.
            json = anime;
            json.name = animeName;
            json.episodes = anime.episodes.split(',');
            res.send(json);
            return console.log('Sent from cache');
        }

        var options = { 
            url: showUrl,
            headers: {
                'User-Agent': 'curl/7.30.0',
                'Accept': '*/*',
                'Host': 'kissanime.com'
            }
        };
        
        // Use cheerio to scrape the page and get video links.
        var found = true;
        request(options, function scrapeAnimePage(err, response, html) {
            console.log('Status: ' + response.statusCode);
            if (err) {
                json = { error: 'HTTP response code from kissanime: ' + response.statusCode };
            } else {
                // Load html into cheerio.
                var $ = cheerio.load(html);

                // Get all 'a' tags, and get their links.
                var episodeSelector = 'a[href*="Episode"]';
                var tags = $(episodeSelector).get();
                var nameRegex = new RegExp('\/' + animeName + '\/', 'i');

                if (tags.length === 0 || tags[0].attribs.href.toLowerCase().search(nameRegex) === -1) {
                    // We didn't find the right anime.
                    json = { error: 'Anime not found!' };
                    console.log(json.error);
                } else {
                    var name = getNameFromLink(animeName, tags[0].attribs.href);
                    var allLinks = [];
                    for (var i = 0; i < tags.length; i++) {
                        var link = tags[i].attribs.href;
                        allLinks.push(link);
                    }

                    // Keep in sorted order by minimum not watched.
                    json = {
                        name: name,
                        finished: false,
                        current: 0,
                        episodes: allLinks.sort()
                    };

                    // Store in redis.
                    client.hmset(input, json, redis.print);
                }
            }
            res.send(json);
        });
    });
});

app.listen('8080');
console.log('Listening on port 8080');
exports = module.exports = app;
