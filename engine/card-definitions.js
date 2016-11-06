'use strict';

import _ from 'lodash';

let Game, Deck, Player, Stage, HookMatcher,
    paper, stone, cloth, metal, clay;

// UPKEEP phases: morning, noon, night
// COMPLETE phases: attempt, success
paper = {
    poem: {
        text: `After you complete a PAPER work, you may return it. If you do, complete the top card of the deck for free`,
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            complete: {
                require: (completed) => completed.type === 'paper',
                success: () => Player.complete(Deck.top),
            }
        },
    },
    pinwheel: {
        text: 'At night, you may return a card from your hand. If you do, you may draw a card.',
        hooks: {
            upkeep: {
                phase: 3, // night
                require: () => Player.hand.return(1),
                success: () => Player.draw(Deck.top),
            },
        }
    },
    scroll: {
        text: '+3 Points',
        completed() { Player.score = +3; }
    },
    curtain: {
        text: 'Opponents skip your TAILOR or SMITH tasks unless they reveal a matching card from their hand.',
        completed() { _.each(Player.opponents(new HookMatcher(this.hooks, Player))); },
        hooks: {
            task: {
                phase: 0, // before Task may initialize
                type: ['tailor', 'smith'],
                require: (task) => Player.hand.reveal(1, task.type),
                success: () => Stage.proceed(),
                failure: () => Stage.skip()
            }
        }
    },
    crane: {
        text: 'You may return PAPER from your craft bench to count as one support each for any work.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 1, // immediately after Task is initialized, but before player acts
                type: ['smith', 'craft'],
                highlight: () => _.filter(Player.craft_bench, { type: 'paper' }),
                require: () => Player.craft_bench.return('paper'),
                success: () => Stage.support++,
                failure: () => Stage.proceed()
            }
        }
    },
    fan: {
        text: 'Before a TAILOR action, you may reveal the top three cards of the deck. If you do, return two of them and put the third back on top of it.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 1,
                types: ['tailor'],
                require: () => Player.act(Deck.reveal(3)),
                success: () => Deck.top.insert(Stage.selected) && Deck.bottom(Stage.revealed),
            }
        }
    },
    lampshade: {
        text: 'You win CLAY and METAL sales ties.',
        hooks: {} // @todo
    },
    plane: {
        text: 'After a POTTER action, if you collected a material, you may move one of your works from one wing to the other.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 2, // immediately after player action is resolved
                types: ['potter'],
                require: (task) => !task.skipped,
                sucess: () => Player.completed.move(1),
            }
        }
    },
    straw: {
        text: 'CLOTH and CLAY works each require one fewer support to complete with a SMITH action.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {} // @todo
    },
    deck_of_cards: {
        text: 'After a SMITH action, if you completed a PAPER work, you may draw a card to your waiting area.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            complete: {
                require: (completed) => completed.type === 'paper' && Stage.task === 'smith',
                success: () => Player.draw(Deck.top),
            }
        },
    },
    doll: {
        text: 'In the morning, you may move an opponent’s task to become your new task. It gives you one extra action.',
        // @todo
    }
};

stone = {
    statue: {
        text: 'After you complete this, transfer two materials from the floor to your craft bench.',
        completed() { Player.draw(Deck.floor, 2); },
    },
    pillar: {
        text: 'All sales of your most sold resource type are considered covered. (Choose one type if tied)',
        // @todo
    },
    frog: {
        text: 'After you complete this, if no opponent has fewer works than you, take an extra turn after this one.',
        // @todo
    },
    tablet: {
        text: 'After you complete this, either return all cards on the floor, or restock the floor from the deck until it has both a STONE and a METAL.',
        // @todo
    },
    stool: {
        text: 'After you complete a STONE, CLAY, or METAL work, you may draw a card to your waiting area.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            complete: {
                require: (completed) => _.any(['stone', 'clay', 'metal'], completed.type),
                success: () => Player.draw(Deck.top)
            }
        }
    },
    go_set: {
        text: 'All your STONE works count as being in both wings at the same time.',
        // @todo
    },
    fountain: {
        text: 'Before a CLERK task, you may reveal MONK cards from hand. Each one counts as a CLERK helper for the task.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 1,
                types: ['clerk'],
                require: () => Player.reveal(null, 'stone'), // reveal any number of green / stone / monk cards
                success: (revealed) => { Stage.helpers.clerk = revealed; }
            }
        }
    },
    tower: {
        text: 'Opponents cannot use your CLERK, MONK, or POTTER tasks unless they reveal a matching card from their hand.',
        completed() { _.each(Player.opponents(new HookMatcher(this.hooks, Player))); },
        hooks: {
            task: {
                phase: 0,
                types: ['clerk', 'monk', 'potter'],
                success: () => Stage.proceed(),
                failure: () => Stage.skip()
            }
        }
    },
    daitoro: {
        text: 'In the morning, you may restock the floor from the top of the deck until there are three cards on the floor.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            upkeep: {
                phase: 0,
                // @todo
            }
        }
    },
    amulent: {
        text: 'After you complete a work, you may sell a material from your craft bench.'
            // @todo
    },
    bench: {
        text: '+2 points for each of your STONE works.'
    }
};

cloth = {
    kite: {
        text: 'In the morning, you may transfer a card from your hand to any craft bench. If you do, treat Kite as an exact copy of one of that player’s works until the end of your turn',
        // @todo
    },
    umbrella: {
        text: 'In the morning, you may add a card to the floor from the top of the deck. If you do, you may convert a matching helper into a sale.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            upkeep: {
                phase: 0,
                require: () => Deck.pop,
                success: () => {} // @todo            }
            }
        }
    },
    socks: {
        text: 'In the morning, you may add a card to the floor from the top of the deck. If you do, you may convert a matching helper into a sale.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                types: ['potter']
                    // @todo
            }
        }
    },
    quilt: {
        text: 'You win PAPER, STONE, and CLOTH sales ties. All sales of these material types are considered covered.',
        // @todo
    },
    robe: {
        text: 'You may use a CLERK action to sell all your materials of one type from your craft bench',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 1,
                types: ['clerk'],
                // @todo
            }
        }
    },
    flag: {
        text: 'Before using your task, you may reveal a matching card in hand to gain one extra action of that task.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 0
                    // @todo
            }
        }
    },
    tapestry: {
        text: '+1 point for each work in this wing.'
            // @todo
    },
    handkerchief: {
        text: 'Instead of checking the hand limit in the morning, you may discard one card from your hand to the floor',
        // @todo
    },
    puppet: {
        text: 'Before a TAILOR action, you may return this to trade your hand with an opponent. Place their hand in your waiting area',
        // @todo
    },
    mask: {
        text: 'Opponents cannot convert actions from your tasks into PRAYER or CRAFT actions.',
        completed() { _.each(Player.opponents(new HookMatcher(this.hooks, Player))); },
        // @todo
    },
    cloak: {
        text: 'After you complete a work, you may return it. If you do, complete a METAL work from your hand for free.'
    }
};

metal = {
    ring: {
        text: 'After a CLERK action, if you sold a material, you may take a sale from an opponent that has more sales than you.',
        // @todo
    },
    flute: {
        text: 'For your MONK or POTTER action, you may take an opponent’s task or PAPER work instead of a card from the floor.'
        // @todo
    },
    sword: {
        text: 'For your MONK or POTTER action, you may take an opponent’s helper or material, respectively, if they have more than you.'
        // @todo
    },
    shuriken: {
        text: 'After you complete this, take a work from an opponent that has more works than you.'
        // @todo
    },
    gong: {
        text: 'After a PRAYER action, you may draw three cards to your waiting area. If you do, place this there too.'
        // @todo
    },
    pin: {
        text: 'In the morning, you may take a TAILOR action.'
    },
    coin: {
        text: 'Count all of the cards in your hand an extra time for backorders at the end of the game.'
    },
    turtle: {
        text: 'If you have a work of each type of material at any time, you win.'
        // @todo
    },
    bell: {
        text: 'For your CLERK action, you may sell the top card of the deck instead of a card from your craft bench.'
        // @todo
    },
    chopsticks: {
        text: 'In the morning, you may convert your task from last turn to a sale.'
        // @todo
    }
};

clay = {
    vase: {
        text: 'After you complete this, transfer two materials from the floor to your sales.',
        // @todo
    },
    haniwa: {
        text: 'For your most frequent helper type (choose one if tied), +3 points for each helper.',
        // @todo
    },
    teapot: {
        text: 'For the most frequent material type in your craft bench (choose one if tied), +3 points for each material.'
    },
    dice: {
        text: 'Before a TAILOR action, you may reveal the top card of the deck. If its value is equal to the number of cards in your hand, complete it for free.'
            // @todo
    },
    bowl: {
        text: 'In the morning, you may collect the top card of the deck into your craft bench.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            upkeep: {
                phase: 0,
                success: () => Player.craft_bench.append(Deck.top)
            }
        }
    },
    jar: {
        text: 'After you complete this, choose a material type. All opponents transfer all cards of that type from their hands to your waiting area.',
        // @todo
    },
    brick: {
        text: 'For your SMITH actions, treat all players’ tasks as if they were in your hand to use as support'
            // @todo
    },
    figurine: {
        text: 'Before using each opponent’s task, you may reveal a matching card from your hand to gain one extra action for that task.'
            // @todo
    },
    bagle: {
        text: 'Opponents do not get actions from their helpers on your tasks. All your MONK helpers are considered covered'
    },
    cup: {
        text: 'After a PRAYER action, you may return this. If you do, end the game.',
        completed() { Player.hooks.append(new HookMatcher(this.hooks)); },
        hooks: {
            task: {
                phase: 2,
                type: ['prayer'],
                success: () => Game.end()
            }
        }
    },

};

export { paper, metal, cloth, clay };
