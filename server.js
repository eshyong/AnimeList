'use strict';

var cheerio      = require('cheerio');
var express      = require('express');
var fs           = require('fs');
var redis        = require('redis');
var request      = require('request');
var app          = express();

var host = 'https://kissanime.com';
var folder = '/Anime/';


// Create Redis client and log errors.
var options = { retry_max_delay: 30 * 1000 };
var client = redis.createClient(options);

// Client functions.
client.on('ready', function() {
    console.log('Redis is ready for commands');
});
client.on('error', function(error) {
    console.log(error);
});


// App configurations.
app.use(express.static(__dirname + '/public'));

// Our index page.
app.get('/', function index(req, res) {
    res.sendFile('index.html', function badResponse(err) {
        if (err) {
            console.log(err);
            console.log('wat');
            res.status(err.status).end();
        } else {
            console.log('Page loaded');
        }
    });
});

// Helper functions for anime parsing and json creation.
function getSeriesNameFromLink(input, link) {
    // Get name using regex.
    var nameRegex = new RegExp(input, 'i');
    var matches = link.match(nameRegex);
    var hyphenRegex = /-/g;
    if (matches.length === 0) {
        return 'unknown';
    }
    return matches[0].replace(hyphenRegex, ' '); 
}

function getEpisodeNumFromLink(link) {
    // Get episode number using regex.
    var numRegex = /episode-(\d)+/i;
    var matches = link.match(numRegex);
    if (matches.length === 0) {
        return '0';
    }
    return matches[1];
}

function createJsonFromLinks(animeName, link, tags) {
    var seriesName = getSeriesNameFromLink(animeName, link);
    var allLinks = [];
    for (var i = 0; i < tags.length; i++) {
        var link = host + folder + tags[i].attribs.href;
        allLinks.push(link);
    }
    allLinks = allLinks.sort();
    var episodeNum = getEpisodeNumFromLink(allLinks[0]);

    // Keep in sorted order by minimum not watched.
    return {
        name: seriesName,
        finished: false,
        current: 0,
        epnum: episodeNum,
        episodes: allLinks
    };
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
                    var link = tags[0].attribs.href;
                    json = createJsonFromLinks(animeName, link, tags);

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
