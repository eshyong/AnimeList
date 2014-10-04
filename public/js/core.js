'use strict';

// Some constants.
var second = 1000;
var host = 'https://kissanime.com';
var episodeText = 'Episode ';

// Store list of anime in a map.
var listedAnime = localStorage || {};

// Open a new tab with the anime episode url, then update url to point to the next one.
function updateLink(event, incr) {
    // Get our <a> node.
    var a = event.srcElement;
    var anime = JSON.parse(listedAnime[a.name]);

    if (!anime) {
        return console.log('wat');
    }
    
    // Open a new tab.
    var url = a.href;
    window.open(url, '_blank');

    // Determine whether to increment, decrement, or leave the episode number.
    if (incr && anime.current !== anime.episodes.length - 1) {
        // LocalStorage keeps values as strings.
        anime.current = String(Number(anime.current) - 1);
        anime.epnum = String(Number(anime.epnum) - 1);
    } else if (!incr && anime.current !== 0) {
        anime.current = String(Number(anime.current) - 1);
        anime.epnum = String(Number(anime.epnum) - 1);
    }
    // Update the link to point to the next episode, and set new description.
    var newLink = anime.episodes[anime.current];
    var episodeNum = anime.epnum;
    a.href = host + newLink;
    a.text = episodeText + episodeNum;

    // Prevent the link from opening in our current tab.
    event.preventDefault();
    return false;
}

function createListItem(json) {
    // Append most recent episode to our main pagelist.
    var name = json.name;
    var link = json.episodes[json.current];
    var episodeNum = json.epnum;

    // Craft some html to append to a list.
    var a = $('<a>');
    a.attr({ 
        'name': name,
        'href': link, 
        'onclick': 'updateLink(event)'
    }).text(episodeText + episodeNum);

    var h2 = $('<h2>').text(name + ': ');
    var li = $('<li>');
    li.append(h2.append(a));

    // Fade effects!
    $('ul:contains("Anime List")').append(li.hide().fadeIn(second));
}


$(document).ready(function stuff() {
    console.log('Loaded');

    for (var anime in listedAnime) {
        var json = JSON.parse(listedAnime[anime]);
        createListItem(json);
    }

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
                $('.btn-warning').fadeIn(second * 2).fadeOut(second * 2);
                return console.log(json.error);
            }

            // Check if episode link is already stored somewhere.
            if (json.name in listedAnime) {
                return console.log('Anime already listed');
            }
            // Otherwise we store it in our list as a stringified json object.
            listedAnime[json.name] = JSON.stringify(json);

            // Append an item to the list.
            createListItem(json);

        });
        event.preventDefault();
    });
});
