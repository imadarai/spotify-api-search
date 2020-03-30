console.log('Hello Beautiful!!');

(function() {
    //////////////////DO NOT TOUCH /////////////////////////
    Handlebars.templates = Handlebars.templates || {};
    var templates = document.querySelectorAll('script[type="text/x-handlebars-template"]');
    Array.prototype.slice.call(templates).forEach(function(script) {
        Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
    });
    //////////////////DO NOT TOUCH /////////////////////////

    //////////////////GLOBAL VARs /////////////////////////
    var nextUrl;
    var moreButton = $('#more');
    var resultsText = $('#results-for');
    var resultsEnd = $('#results-end');


    //////////////////RESULTS TEXT /////////////////////////
    function displayResultsText ($userInput, $albumOrArtist, response) {
        if (typeof $userInput === 'string' && response.items.length == 0) {
            resultsText.html("No Results for " + $albumOrArtist + " '" + $userInput + "'");
        } else{
            resultsText.html("Results for " + $albumOrArtist + " '" + $userInput + "'");
        }
        resultsText.show();
    }

    //////////////////More Button Handling/////////////////////////
    function moreResultsButton($userInput, $albumOrArtist, response) {
        if (response.next){
            moreButton.show();
        } else {
            moreButton.hide();
            resultsEnd.html("No More Results for " + $albumOrArtist + " '" + $userInput + "'");
            resultsEnd.show();
        }

    }
    //////////////////next URL Function/////////////////////////
    function getNextUrl (response) {
        nextUrl = response.next && response.next.replace(
            'https://api.spotify.com/v1/search',
            'https://elegant-croissant.glitch.me/spotify'
        );
    }
    //////////////////EVENT LISTENER WHEN ENTER IS HIT/////////////////////////
    $(document).on('keydown', function (e){
        if (e.keyCode === 13){
            initialAjaXCall();
        }
    });
    /////////////FIRSTAJAX CALL BASED ON DAVID'S PROXY/////////////////////////
    function initialAjaXCall() {

        var $albumOrArtist = $('select').val();
        var $userInput = $('input[name=user-input]').val();

        if ($userInput.trim().length <= 0 ){
            resultsText.html("Please Enter a Valid Search Term");
            resultsText.show();
            return;
        }

        $.ajax ({
            url: "https://elegant-croissant.glitch.me/spotify",
            method: 'GET',
            data: {
                query: $userInput,
                type: $albumOrArtist
            },
            success: function(response) {
                response = response.artists || response.albums;

                displayResultsText ($userInput, $albumOrArtist, response);

                var handlebarData = response.items;
                $('#results-container').html(Handlebars.templates.spotifyId({handlebarData}));

                getNextUrl (response);

                if (response.next) {
                    //infinite scroll, if not -1 -> true
                    if (location.search.indexOf("scroll=infinite") > -1) {
                        // do infinite scroll
                        scrollCheck();
                    } else {
                        moreResultsButton($userInput, $albumOrArtist, response);
                    }
                }
            },
            error: function(err){
                console.log(err);
            }
        });
    }
    ////////////////SECOND AJAX CALL BASED ON NEXT URL/////////////////////////
    function secondaryAjaXCall () {
        var $albumOrArtist = $('select').val();
        var $userInput = $('input[name=user-input]').val();
        $.ajax ({
            url: nextUrl,
            method: 'GET',
            data: {
                query: $userInput,
                type: $albumOrArtist
            },
            success: function(response) {
                response = response.artists || response.albums;

                var handlebarData = response.items;
                $('#results-container').append(Handlebars.templates.spotifyId({handlebarData}));

                getNextUrl (response);
                moreResultsButton($userInput, $albumOrArtist, response);
                scrollCheck();

            }
        });
    }
    ////////CHECK FOR END OF SCROLL AND MAKE A CALL FOR MORE RESULTS///////////
    function scrollCheck() {
        var hasReachedBottom =
            $(window).height() + $(document).scrollTop() >=
            $(document).height() - 400;
        if (hasReachedBottom) {
            secondaryAjaXCall ();
        } else {
            setTimeout(scrollCheck, 500);
        }
    }



    //////////////////EVENT LISTENER ON SUBMIT BUTTON/////////////////////////
    $('#submit-button').on('click', initialAjaXCall);
    $("#more").on("click", secondaryAjaXCall);


})();
