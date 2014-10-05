'use strict';

// Some constants.
var second = 1000;
var episodeText = 'Episode ';

// Store list of anime in a map. Use LocalStorage by default.
var listedAnime = localStorage || {};

// TODO: Figure out if client side and server side can share code.
function getEpisodeNumFromLink(link) {
    // Get episode number using regex.
    var numRegex = /episode-(\d+)/i;
    var matches = link.match(numRegex);
    if (matches.length === 0) {
        return '0';
    }
    return Number(matches[1]);
}

function updateLink(event) {
    // Get our <a> node.
    var a = event.srcElement;
    var name = a.name;
    
    // Open a new tab.
    var url = a.href;
    window.open(url, '_blank');

    changeEpisodeNumber(name, true);

    // Prevent the link from opening in our current tab.
    event.preventDefault();
    return false;
}

function buttonPressed(event, incr) {
    var name = event.srcElement.name;
    changeEpisodeNumber(name, incr);
}

function changeEpisodeNumber(name, incr) {
    var anime = JSON.parse(listedAnime[name]);

    // Increment if the '+' button was pressed and decrement if '-' was pressed.
    if (incr && anime.current !== anime.episodes.length-1) {
        anime.current = Number(anime.current) + 1;
    } else if (!incr && anime.current !== 0) {
        anime.current = Number(anime.current) - 1;
    }

    // Update LocalStorage object.
    anime.epnum = getEpisodeNumFromLink(anime.episodes[anime.current]);
    listedAnime[name] = JSON.stringify(anime);

    // Get the link element and change its contents.
    var selector = 'a[name="' + name + '"]';
    var newLink = anime.episodes[anime.current];
    var episodeNum = anime.epnum;
    $(selector).attr('href', newLink).text(episodeText + episodeNum);
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

    // Create an increment and decrement button.
    var incr = $('<button>').text('+').attr({
        name: json.name,
        onclick: 'buttonPressed(event, true)',
        style: 'margin-left: 10px; margin-left: 10px;'
    });
    // \u2212 is unicode for the minus sign.
    var decr = $('<button>').text('\u2212').attr({
        name: json.name,
        onclick: 'buttonPressed(event, false)',
        style: 'margin-left: 10px; margin-left: 10px;'
    });

    var h2 = $('<h2>').text(name + ': ');
    var li = $('<li>');
    li.append(h2.append(a).append(incr).append(decr));

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
