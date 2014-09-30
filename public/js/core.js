'use strict';

// Some constants.
var second = 1000;
var host = 'https://kissanime.com';
var episodeText = 'Episode ';

// Store list of anime in a map.
var listedAnime = {};

// Open a new tab with the anime episode url, then update url to point to the next one.
function updateLink(event) {
    // Get our <a> node.
    var a = event.srcElement;
    var anime = listedAnime[a.name];

    if (!anime) {
        return console.log('wat');
    }
    
    // Open a new tab.
    var url = a.href;
    window.open(url, '_blank');

    // Update our episode link and number.
    if (anime.current === anime.episodes.length - 1) {
        anime.finished = true;
    } else {
        // Increment counter if we haven't reached the last episode.
        anime.current++;

        // Update the link to point to the next episode, and set new description.
        var newLink = anime.episodes[anime.current];
        var episodeNum = getEpisodeNumFromLink(newLink);
        a.href = host + newLink;
        a.text = episodeText + episodeNum;
    }
    // Prevent the link from opening in our current tab.
    event.preventDefault();
    return false;
}

function getEpisodeNumFromLink(link) {
    // Get episode number using regex.
    var numRegex = /episode-(\d)+/i;
    var matches = link.match(numRegex);
    return matches[1];
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
                $('.btn-warning').fadeIn(second * 2).fadeOut(second * 4);
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
            var name = json.name;
            var episodeNum = getEpisodeNumFromLink(link);

            // Craft some html to append to a list.
            var a = $('<a>');
            a.attr({ 
                'name': name,
                'href': host + link, 
                'onclick': 'updateLink(event)'
            }).text(episodeText + episodeNum);

            var h2 = $('<h2>').text(name + ': ');
            var li = $('<li>');
            li.append(h2.append(a));

            // Fade effects!
            $('ul').append(li.hide().fadeIn(second * 2));
        });
        event.preventDefault();
    });
});
