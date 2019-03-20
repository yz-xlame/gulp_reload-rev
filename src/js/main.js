require.config({
    paths: {
        'sileo': './sileo/sileo',
        'player': './player/player',
    }
})
require([
    'sileo',
    'player'
], function(sileo, player) {
    console.log('project start');
    player.sayhi();
})
