var test = require("node:test");
var assert = require("node:assert");

var config = require("../src/config.js");
var core = require("../src/core.js");
var reshape = require("../tools/reshape_export.js").reshape;
var buildQsf = require("../tools/qsf.js");

var SENTINEL = "Zyxwinda";

function stateWithPeers() {

    return {

        peers: [

            {

                slot: 0,
                name: SENTINEL

            },

            {

                slot: 3,
                name: "Quilla"

            },

            {

                slot: 4,
                name: "quilla "

            }

        ],

        answers: {

            closeness: {

                0: 5,
                3: 2

            },

            contact: {

                3: 4

            },

            same_school: {

                0: true

            },

            knows: {

                "0-4": true

            }

        },

        confirmedPairs: [[3, 4]]

    };

}

test("normalizeName ignores case, spacing and accents", function () {

    assert.strictEqual(core.normalizeName("  JOSÉ   Maria "), core.normalizeName("jose maria"));

});

test("findDuplicatePairs reports every matching pair", function () {

    var peers = [

        {

            slot: 0,
            name: "Ana"

        },

        {

            slot: 1,
            name: "ana"

        },

        {

            slot: 2,
            name: "Bo"

        },

        {

            slot: 5,
            name: "ANA"

        }

    ];

    assert.deepStrictEqual(core.findDuplicatePairs(peers), [[0, 1], [0, 5], [1, 5]]);

});

test("record never contains a typed name", function () {

    var record = core.buildRecord(config, stateWithPeers());

    assert.ok(!JSON.stringify(record).toLowerCase().includes(SENTINEL.toLowerCase()));
    assert.ok(!JSON.stringify(record).toLowerCase().includes("quilla"));

});

test("peers are renumbered without gaps and blank rows do not shift answers", function () {

    var record = core.buildRecord(config, stateWithPeers());

    assert.strictEqual(record.peer_count, "3");
    assert.strictEqual(record.peer1, "peer1");
    assert.strictEqual(record.peer3, "peer3");
    assert.strictEqual(record.peer4, "");
    assert.strictEqual(record.peer1_closeness, "5");
    assert.strictEqual(record.peer2_closeness, "2");
    assert.strictEqual(record.peer3_closeness, "");
    assert.strictEqual(record.peer2_contact, "4");
    assert.strictEqual(record.peer1_same_school, "1");
    assert.strictEqual(record.peer2_same_school, "0");
    assert.strictEqual(record.knows_1_3, "1");
    assert.strictEqual(record.knows_1_2, "0");
    assert.strictEqual(record.same_name_pairs, "2-3");

});

test("unused peers are blank and every declared field is written", function () {

    var record = core.buildRecord(config, stateWithPeers());

    assert.deepStrictEqual(Object.keys(record).sort(), core.fieldNames(config).slice().sort());
    assert.strictEqual(record.peer4_closeness, "");
    assert.strictEqual(record.peer4_same_school, "");
    assert.strictEqual(record.knows_3_4, "");
    assert.strictEqual(record.gensi_complete, "1");

});

test("validateConfig rejects bad ids and types", function () {

    var errors = core.validateConfig({

        minPeers: 5,
        maxPeers: 3,
        questions: [

            {

                id: "Bad Id",
                type: "clickSelect"

            },

            {

                id: "a",
                type: "nope"

            },

            {

                id: "a",
                type: "choice"

            }

        ]

    });

    assert.strictEqual(errors.length, 5);

});

test("qsf ids match the formats Qualtrics validates on import", function () {

    var qsf = buildQsf("", ["peer_count"]);
    var entry = qsf.SurveyEntry;
    var blocks = qsf.SurveyElements[0].Payload;

    assert.match(entry.SurveyID, /^SV_[a-zA-Z0-9]{11,15}$/);
    assert.match(entry.SurveyOwnerID, /^URH?_[a-zA-Z0-9]{11,15}$/);
    assert.match(entry.CreatorID, /^URH?_[a-zA-Z0-9]{11,15}$/);
    assert.match(entry.SurveyActiveResponseSet, /^RS_[a-zA-Z0-9]{11,15}$/);
    assert.ok(entry.SurveyBrandID.length >= 1);

    blocks.forEach(function (block) {

        assert.match(block.ID, /^BL_[a-zA-Z0-9]{11,15}$/);

    });

    qsf.SurveyElements.forEach(function (element) {

        assert.strictEqual(element.SurveyID, entry.SurveyID);

    });

});

test("shipped config is valid", function () {

    assert.deepStrictEqual(core.validateConfig(config), []);

});

test("reshape builds long tables, skips Qualtrics label rows, strips prefix", function () {

    var csv = [

        "ResponseId,__js_peer_count,__js_peer1_closeness,__js_peer2_closeness,__js_peer3_closeness,__js_knows_1_2,__js_knows_1_3,__js_knows_2_3",
        "Response ID,peer_count,peer1_closeness,peer2_closeness,peer3_closeness,knows_1_2,knows_1_3,knows_2_3",
        "\"{\"\"ImportId\"\":\"\"_recordId\"\"}\",\"{\"\"ImportId\"\":\"\"x\"\"}\",,,,,,",
        "R_1,2,5,3,,1,,"

    ].join("\n");

    var output = reshape(csv);

    assert.strictEqual(output.peers, "response_id,peer_id,peer_label,closeness\nR_1,1,peer1,5\nR_1,2,peer2,3\n");
    assert.strictEqual(output.ties, "response_id,question,peer_a,peer_b,tie\nR_1,knows,1,2,1\n");

});
