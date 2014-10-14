'use strict';

$(document).ready(function recMain() {
    console.log('Recommendation page loaded');
    
    $('form').submit(function getAnimeRecommendation(event) {
        console.log('Getting recommendations');
        console.log('Not implemented');

        var input = {animeName: $('input[name=animeName]').val()};
        var request = {
            type: 'GET',
            url: 'rec',
            data: input,
            dataType: 'json',
            encode: true
        };

        $.ajax(request).done(function getResponse(json) {
            console.log(json);
        });

        event.preventDefault();
    });
});
