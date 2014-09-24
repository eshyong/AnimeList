var express = require('express');
var fs      = require('fs');
var jade    = require('jade');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

// Config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
    var url = 'http://www.imdb.com/title/tt1229340/';

    request(url, function(error, response, html) {
        if (error) {
            console.log('request(): ' + error);
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
console.log('Magic happens on port 8080');
exports = module.exports = app;
