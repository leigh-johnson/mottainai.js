'use strict';

import _ from 'lodash';
import { Card } from './card.js';

class Deck {
    contructor(card_definitions){
        this.cards = _.map(card_definitions, (definition) => new Card(definition));
        this.returned = [];
        this.floor = [];
    }

    static top (){
        return this.cards[0];
    }

    static bottom(){
        return this.cards[this.deck.length - 1];
    }

    reveal(n){
        let revealed = this.cards.slice(0, n);
        return revealed;
    }

    draw(n){
        let drawn = this.cards.slice(0, n);
        this.cards = this.cards.slice(n, this.cards.slice.length - 1);
        return drawn;
    }


}

export { Deck };
