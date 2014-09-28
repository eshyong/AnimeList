'use strict';


$(document).ready(function stuff() {
    
    console.log('Loaded');
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

        $.ajax(request).done(function getResponse(data) {
            console.log(data);
            if (data.error) {
                return console.log(data.error);
            }
        });
        event.preventDefault();
    });


});
