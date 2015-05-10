
function noop(game, attacker, defender, options, damage) {
    return {};
}

function drain(game, attacker, defender, options, damage, effects) {
    if (defender.health < 0) {
        damage += defender.health;
    }
    attacker.health += damage

    effects.push({type: "drain" ,character: attacker, amount: drainAmount})
}

function blockNext(game, attacker, defender, options, damage, effects) {
    var mod = {status: "blocking", rounds: Infinity};
    attacker.status.push(mod);

    effects.push({type: "blocking:", character: attacker});
}

function constant(c) { return function(game, players, options) { return c; } }

module.exports = {
    version: "0.0",
    characters: [
        {name: "Blue Cube", description: "A cube that is blue",
        stats: {
            maxHealth: 30,
            maxResources: [50, 0, 0],
            speed: 5,
            attack: 1,
            defense: 0
        },
        attacks: [
            {name: "Standard Attack", description: { overall: "An attack that is standard", damage: "4", resourceCost: "4", speed: "4" }, resourceCost: constant([4, 0, 0]), damage : constant(4), effect: noop, speed: constant(4)},
            {name: "Speedy Attack", description: { overall: "An weak attack that is speedy", damage: "2", resourceCost: "2", speed: "1" }, resourceCost: constant([, 0, 0]), damage : constant(2), effect: noop, speed: constant(1)},
            {name: "Costly Attack", description: { overall: "An strong attack that is costly", damage: "10", resourceCost: "5", speed: "5" }, resourceCost: constant([5, 0, 0]), damage : constant(10), effect: noop, speed: constant(5)},
            {name: "Defensive Manuver", description: { overall: "Blocks the next attack directed at you.", damage: "0", resourceCost: "2", speed: "2" }, resourceCost: constant([2, 0, 0]), damage : constant(0), effect: noop, speed: constant(2)},
            {name: "Life Drain", description: { overall: "Drains your opponent's life.", damage: "3", resourceCost: "3", speed: "3" }, resourceCost: constant([3, 0, 0]), damage : constant(3), effect: drain, speed: constant(3)}]
        },
        {name: "Red Cube", description: "A cube that is red",
        stats: {
            maxHealth: 7,
            maxResources: [0, 50, 0],
            speed: 5,
            attack: 1,
            defense: 0
        },
        attacks: [
           {name: "Standard Attack", description: { overall: "An attack that is standard", damage: "4", resourceCost: "4", speed: "2" }, resourceCost: constant([4, 0, 0]), damage : constant(4), effect: noop, speed: constant(2)},
            {name: "Speedy Attack", description: { overall: "An weak attack that is speedy", damage: "2", resourceCost: "2", speed: "1" }, resourceCost: constant([, 0, 0]), damage : constant(2), effect: noop, speed: constant(1)},
            {name: "Costly Attack", description: { overall: "An strong attack that is costly", damage: "10", resourceCost: "5", speed: "5" }, resourceCost: constant([5, 0, 0]), damage : constant(10), effect: noop, speed: constant(5)},
            {name: "Defensive Manuver", description: { overall: "Blocks the next attack directed at you.", damage: "0", resourceCost: "2", speed: "2" }, resourceCost: constant([2, 0, 0]), damage : constant(0), effect: noop, speed: constant(2)},
            {name: "Life Drain", description: { overall: "Drains your opponent's life.", damage: "3", resourceCost: "3", speed: "3" }, resourceCost: constant([3, 0, 0]), damage : constant(3), effect: drain, speed: constant(3)}]
        },
        {name: "Green Cube", description: "A cube that is green",
        stats: {
            maxHealth: 30,
            maxResources: [0, 0, 100],
            speed: 5,
            attack: 1,
            defense: 0
        },
        attacks: [
           {name: "Standard Attack", description: { overall: "An attack that is standard", damage: "4", resourceCost: "4", speed: "2" }, resourceCost: constant([4, 0, 0]), damage : constant(4), effect: noop, speed: constant(2)},
            {name: "Speedy Attack", description: { overall: "An weak attack that is speedy", damage: "2", resourceCost: "2", speed: "1" }, resourceCost: constant([, 0, 0]), damage : constant(2), effect: noop, speed: constant(1)},
            {name: "Costly Attack", description: { overall: "An strong attack that is costly", damage: "10", resourceCost: "5", speed: "5" }, resourceCost: constant([5, 0, 0]), damage : constant(10), effect: noop, speed: constant(5)},
            {name: "Defensive Manuver", description: { overall: "Blocks the next attack directed at you.", damage: "0", resourceCost: "2", speed: "2" }, resourceCost: constant([2, 0, 0]), damage : constant(0), effect: noop, speed: constant(2)},
            {name: "Life Drain", description: { overall: "Drains your opponent's life.", damage: "3", resourceCost: "3", speed: "3" }, resourceCost: constant([3, 0, 0]), damage : constant(3), effect: drain, speed: constant(3)}]
        }
    ]
}
