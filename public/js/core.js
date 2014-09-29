'use strict';

// Two seconds in milliseconds.
var second = 1000;

// Store list of anime in a map.
var listedAnime = {};

// Helper function to update 'a' element's info.
function updateLink(linkNode) {
    var name = linkNode.name;
    var anime = listedAnime[name];
    if (!anime) {
        return console.log('Some weird error, you\'d better check this out.');
    }
    
    /*if (anime.current !== anime.episodes.length - 1) {
        anime.current++;
    }*/
    var href = linkNode.href;
    console.log(href);
    console.log(anime.current);
    return false;
}

$(document).ready(function stuff() {
    console.log('Loaded');

    // Form submitted, send an AJAX request.
    $('form').submit(function sendAnimeRequest(event) {
        console.log('Submitting');
        var form = {
            animeName: $('input[name=animeName]').val()
        };

        var request = {
            type: 'GET',
            url: 'add',
            data: form,
            dataType: 'json',
            encode: true
        };

        $.ajax(request).done(function getResponse(json) {
            // Episodes are returned as a JSON object.
            console.log(json);
            if (json.error) {
                // Anime not found, fade warning in and out.
                $('.btn-warning').fadeIn(2 * second).fadeOut(4 * second);
                return console.log(json.error);
            }

            // Check if episode link is already stored somewhere.
            if (json.name in listedAnime) {
                return console.log('Anime already listed');
            }
            // Otherwise we store it in our list.
            listedAnime[json.name] = json;

            // Append most recent episode to our main pagelist.
            var link = json.episodes[json.current];

            // Get name using regex.
            var nameRegex = new RegExp(json.name, 'i');
            var hyphenRegex = /-/g;
            var matches = link.match(nameRegex);
            var name = matches[0].replace(hyphenRegex, ' ');

            // Get episode number using regex.
            var numRegex = /episode-(\d)+/i;
            matches = link.match(numRegex);
            var episodeNum = matches[1];

            // Craft some html to append to a list.
            var html = '<li><h3>' + name + ': <a href=https://kissanime.com' + link + 
                       ' name="' + json.name + '" onclick=updateLink(this)>Episode ' + episodeNum + '</h2></li>';
            var newItem = $(html);
            $('ul').append(newItem.hide().fadeIn(second * 2));
        });
        event.preventDefault();
    });
});
