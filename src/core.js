var FIELD_PEER_COUNT = "peer_count";
var FIELD_SAME_NAME = "same_name_pairs";
var FIELD_COMPLETE = "gensi_complete";

var STORAGE_KINDS = {

    dragBoxes: "perPeer",
    choice: "perPeer",
    clickSelect: "perPeerBinary",
    ties: "pairwise"

};

function normalizeName(name) {

    return String(name)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

}

function findDuplicatePairs(peers) {

    var pairs = [];

    peers.forEach(function (peer, index) {

        peers.slice(index + 1).forEach(function (other) {

            if (normalizeName(peer.name) === normalizeName(other.name)) {

                pairs.push([peer.slot, other.slot]);

            }

        });

    });

    return pairs;

}

function tieKey(slotA, slotB) {

    return Math.min(slotA, slotB) + "-" + Math.max(slotA, slotB);

}

function peerLabel(number) {

    return "peer" + number;

}

function peerField(number, questionId) {

    return "peer" + number + "_" + questionId;

}

function tieField(questionId, numberA, numberB) {

    return questionId + "_" + numberA + "_" + numberB;

}

function forEachPair(count, callback) {

    for (var a = 1; a <= count; a++) {

        for (var b = a + 1; b <= count; b++) {

            callback(a, b);

        }

    }

}

function fieldNames(config) {

    var names = [FIELD_COMPLETE, FIELD_PEER_COUNT, FIELD_SAME_NAME];

    for (var peer = 1; peer <= config.maxPeers; peer++) {

        names.push(peerLabel(peer));

    }

    config.questions.forEach(function (question) {

        if (STORAGE_KINDS[question.type] === "pairwise") {

            forEachPair(config.maxPeers, function (a, b) {

                names.push(tieField(question.id, a, b));

            });

            return;

        }

        for (var number = 1; number <= config.maxPeers; number++) {

            names.push(peerField(number, question.id));

        }

    });

    return names;

}

function validateConfig(config) {

    var errors = [];
    var seen = {};

    if (!(config.minPeers >= 1 && config.minPeers <= config.maxPeers)) {

        errors.push("minPeers must be between 1 and maxPeers");

    }

    config.questions.forEach(function (question, index) {

        var label = "questions[" + index + "]";

        if (!/^[a-z][a-z0-9_]*$/.test(question.id || "")) {

            errors.push(label + ": id must be lowercase letters, digits or underscores");

        }

        if (seen[question.id]) {

            errors.push(label + ": duplicate id " + question.id);

        }

        seen[question.id] = true;

        if (!STORAGE_KINDS[question.type]) {

            errors.push(label + ": unknown type " + question.type);

        }

        if (STORAGE_KINDS[question.type] === "perPeer" && !(question.options && question.options.length)) {

            errors.push(label + ": needs options");

        }

    });

    return errors;

}

// Every declared field is written, blanks included, so no stale value can survive a rerun.
function buildRecord(config, state) {

    var record = {};

    fieldNames(config).forEach(function (name) {

        record[name] = "";

    });

    var numberBySlot = {};

    state.peers.forEach(function (peer, index) {

        numberBySlot[peer.slot] = index + 1;
        record[peerLabel(index + 1)] = peerLabel(index + 1);

    });

    record[FIELD_PEER_COUNT] = String(state.peers.length);

    record[FIELD_SAME_NAME] = state.confirmedPairs.map(function (pair) {

        return numberBySlot[pair[0]] + "-" + numberBySlot[pair[1]];

    }).join(";");

    config.questions.forEach(function (question) {

        var kind = STORAGE_KINDS[question.type];
        var answers = state.answers[question.id] || {};

        if (kind === "pairwise") {

            state.peers.forEach(function (peer, index) {

                state.peers.slice(index + 1).forEach(function (other) {

                    var field = tieField(question.id, numberBySlot[peer.slot], numberBySlot[other.slot]);

                    record[field] = answers[tieKey(peer.slot, other.slot)] ? "1" : "0";

                });

            });

            return;

        }

        state.peers.forEach(function (peer) {

            var value = answers[peer.slot];
            var field = peerField(numberBySlot[peer.slot], question.id);

            if (kind === "perPeerBinary") {

                record[field] = value ? "1" : "0";

            } else if (value !== undefined) {

                record[field] = String(value);

            }

        });

    });

    record[FIELD_COMPLETE] = "1";

    return record;

}

if (typeof module !== "undefined") {

    module.exports = {

        normalizeName: normalizeName,
        findDuplicatePairs: findDuplicatePairs,
        tieKey: tieKey,
        fieldNames: fieldNames,
        validateConfig: validateConfig,
        buildRecord: buildRecord,
        FIELD_COMPLETE: FIELD_COMPLETE

    };

}
