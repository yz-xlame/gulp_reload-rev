require([
    './sileo/sileo',
    './player/player',
    'zepto'
], function(sileo, player, Zepto) {
    player.sayhi();
    Zepto('<p>add zepto!!!!</p>').appendTo(Zepto('body'));
})
