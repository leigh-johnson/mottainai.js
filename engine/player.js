'use strict';


class Player {
    constructor(game, username) {
        this.game = game;
        this.opponents = _.filter(game.players, (player) => player.username !== username);
        this.craft_bench = [];
        this.waiting = [];
        this.sales = [];
        this.helpers = [];
        this.gallery = [];
        this.gift_shop = [];
        this.hand = [];
        this.hooks = [];
        this.task = null;
        this.score = 0;
    }

    complete(card){
        card.completed(Player);
        // prompting mechanism:
        // add card to gallery or giftshop
    }


}

export { Player };
