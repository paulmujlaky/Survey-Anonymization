var fs = require("fs");
var path = require("path");

function parseCsv(text) {

    var rows = [];
    var row = [];
    var cell = "";
    var quoted = false;

    for (var i = 0; i < text.length; i++) {

        var ch = text[i];

        if (quoted) {

            if (ch === "\"" && text[i + 1] === "\"") {

                cell += "\"";
                i++;

            } else if (ch === "\"") {

                quoted = false;

            } else {

                cell += ch;

            }

        } else if (ch === "\"") {

            quoted = true;

        } else if (ch === ",") {

            row.push(cell);
            cell = "";

        } else if (ch === "\n") {

            row.push(cell.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            cell = "";

        } else {

            cell += ch;

        }

    }

    if (cell || row.length) {

        row.push(cell);
        rows.push(row);

    }

    return rows;

}

function toCsv(rows) {

    return rows.map(function (row) {

        return row.map(function (value) {

            var text = String(value === undefined ? "" : value);

            return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;

        }).join(",");

    }).join("\n") + "\n";

}

function reshape(text) {

    var rows = parseCsv(text.replace(/^﻿/, ""));

    var header = rows[0].map(function (name) {

        return name.replace(/^__js_/, "");

    });

    var peerQuestions = [];
    var tieColumns = [];

    header.forEach(function (name, column) {

        var peer = /^peer(\d+)_(.+)$/.exec(name);
        var tie = /^(.+)_(\d+)_(\d+)$/.exec(name);

        if (peer) {

            if (peerQuestions.indexOf(peer[2]) === -1) {

                peerQuestions.push(peer[2]);

            }

        } else if (tie) {

            tieColumns.push({

                column: column,
                question: tie[1],
                a: Number(tie[2]),
                b: Number(tie[3])

            });

        }

    });

    var responseColumn = header.indexOf("ResponseId");
    var countColumn = header.indexOf("peer_count");

    if (countColumn === -1) {

        throw new Error("peer_count column not found: check the fields are declared in Survey Flow");

    }

    // Qualtrics adds label and ImportId rows under the header; only real rows have a numeric count.
    var responses = rows.slice(1).filter(function (row) {

        return /^\d+$/.test(row[countColumn] || "");

    });

    var peers = [["response_id", "peer_id", "peer_label"].concat(peerQuestions)];
    var ties = [["response_id", "question", "peer_a", "peer_b", "tie"]];

    responses.forEach(function (row, index) {

        var responseId = responseColumn === -1 ? "row" + (index + 1) : row[responseColumn];
        var count = Number(row[countColumn]);

        for (var number = 1; number <= count; number++) {

            var values = peerQuestions.map(function (question) {

                return row[header.indexOf("peer" + number + "_" + question)];

            });

            peers.push([responseId, number, "peer" + number].concat(values));

        }

        tieColumns.forEach(function (tie) {

            if (tie.a <= count && tie.b <= count) {

                ties.push([responseId, tie.question, tie.a, tie.b, row[tie.column]]);

            }

        });

    });

    return {

        peers: toCsv(peers),
        ties: toCsv(ties)

    };

}

if (require.main === module) {

    var input = process.argv[2];

    if (!input) {

        console.error("Usage: node tools/reshape_export.js <qualtrics_export.csv>");
        process.exit(1);

    }

    var output = reshape(fs.readFileSync(input, "utf8"));
    var directory = path.dirname(input);

    fs.writeFileSync(path.join(directory, "peers_long.csv"), output.peers);
    fs.writeFileSync(path.join(directory, "ties_long.csv"), output.ties);

    console.log("Wrote peers_long.csv and ties_long.csv to " + directory);

}

module.exports = {

    reshape: reshape,
    parseCsv: parseCsv

};
