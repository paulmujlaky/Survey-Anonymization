function el(tag, className, text) {

    var node = document.createElement(tag);

    if (className) {

        node.className = className;

    }

    if (text !== undefined) {

        node.textContent = text;

    }

    return node;

}

function fill(template, values) {

    return template.replace(/\{(\w+)\}/g, function (match, key) {

        return values[key] === undefined ? match : values[key];

    });

}

function makeButton(className, label, onClick) {

    var button = el("button", className, label);

    button.type = "button";
    button.addEventListener("click", onClick);

    return button;

}

function bindDrag(root, node, slot, onDrop) {

    var start = null;
    var ghost = null;
    var justDragged = false;

    function clearGhost() {

        if (ghost) {

            ghost.parentNode.removeChild(ghost);
            ghost = null;

        }

    }

    node.addEventListener("pointerdown", function (event) {

        start = {

            x: event.clientX,
            y: event.clientY

        };

        justDragged = false;
        node.setPointerCapture(event.pointerId);

    });

    node.addEventListener("pointermove", function (event) {

        if (!start) {

            return;

        }

        var moved = Math.abs(event.clientX - start.x) + Math.abs(event.clientY - start.y);

        if (!ghost && moved < 6) {

            return;

        }

        if (!ghost) {

            ghost = node.cloneNode(true);
            ghost.classList.add("gensi-ghost");
            root.appendChild(ghost);

        }

        ghost.style.left = event.clientX + "px";
        ghost.style.top = event.clientY + "px";

    });

    node.addEventListener("pointerup", function (event) {

        start = null;

        if (!ghost) {

            return;

        }

        clearGhost();
        justDragged = true;

        var target = document.elementFromPoint(event.clientX, event.clientY);
        var box = target && target.closest("[data-box]");

        if (box) {

            onDrop(slot, box.getAttribute("data-box"));

        }

    });

    node.addEventListener("pointercancel", function () {

        start = null;
        clearGhost();

    });

    return function wasDragged() {

        var dragged = justDragged;

        justDragged = false;

        return dragged;

    };

}

var QUESTION_TYPES = {

    dragBoxes: {

        steps: function (question) {

            return [{

                question: question

            }];

        },

        isComplete: function (app, step) {

            return app.everyPeerAnswered(step.question);

        },

        render: function (app, step, body) {

            var answers = app.answersFor(step.question);

            function place(slot, value) {

                if (value === "") {

                    delete answers[slot];

                } else {

                    answers[slot] = Number(value);

                }

                app.selectedSlot = null;
                app.render();

            }

            function addNodes(container, value) {

                app.peers().forEach(function (peer) {

                    var current = answers[peer.slot] === undefined ? "" : String(answers[peer.slot]);

                    if (current !== String(value)) {

                        return;

                    }

                    var node = makeButton("gensi-node", peer.name, function (event) {

                        event.stopPropagation();

                        if (wasDragged()) {

                            return;

                        }

                        app.selectedSlot = app.selectedSlot === peer.slot ? null : peer.slot;
                        app.render();

                    });

                    var wasDragged = bindDrag(app.root, node, peer.slot, place);

                    if (app.selectedSlot === peer.slot) {

                        node.classList.add("gensi-node-active");

                    }

                    container.appendChild(node);

                });

            }

            function makeBox(className, label, value) {

                var box = el("div", className);
                var title = makeButton("gensi-box-title", label, function () {

                    if (app.selectedSlot !== null) {

                        place(app.selectedSlot, String(value));

                    }

                });

                var nodes = el("div", "gensi-box-nodes");

                box.setAttribute("data-box", String(value));
                box.addEventListener("click", function () {

                    if (app.selectedSlot !== null) {

                        place(app.selectedSlot, String(value));

                    }

                });

                box.appendChild(title);
                box.appendChild(nodes);
                addNodes(nodes, value);

                return box;

            }

            body.appendChild(makeBox("gensi-box gensi-pool", app.text.unplaced, ""));

            var grid = el("div", "gensi-box-grid");

            step.question.options.forEach(function (option) {

                grid.appendChild(makeBox("gensi-box", option.label, option.value));

            });

            body.appendChild(grid);

        }

    },

    choice: {

        steps: function (question, peers) {

            return peers.map(function (peer) {

                return {

                    question: question,
                    focus: peer

                };

            });

        },

        isComplete: function (app, step) {

            return app.answersFor(step.question)[step.focus.slot] !== undefined;

        },

        render: function (app, step, body) {

            var answers = app.answersFor(step.question);
            var list = el("div", "gensi-choices");

            body.appendChild(el("div", "gensi-node gensi-node-focus", step.focus.name));

            step.question.options.forEach(function (option) {

                var button = makeButton("gensi-choice", option.label, function () {

                    answers[step.focus.slot] = option.value;
                    app.advance();

                });

                if (answers[step.focus.slot] === option.value) {

                    button.classList.add("gensi-choice-active");

                }

                list.appendChild(button);

            });

            body.appendChild(list);

        }

    },

    clickSelect: {

        steps: function (question) {

            return [{

                question: question

            }];

        },

        isComplete: function () {

            return true;

        },

        render: function (app, step, body) {

            var answers = app.answersFor(step.question);
            var list = el("div", "gensi-node-list");

            app.peers().forEach(function (peer) {

                var node = makeButton("gensi-node", peer.name, function () {

                    answers[peer.slot] = !answers[peer.slot];
                    node.classList.toggle("gensi-node-active", answers[peer.slot]);
                    node.setAttribute("aria-pressed", String(answers[peer.slot]));

                });

                node.classList.toggle("gensi-node-active", Boolean(answers[peer.slot]));
                node.setAttribute("aria-pressed", String(Boolean(answers[peer.slot])));
                list.appendChild(node);

            });

            body.appendChild(list);

        }

    },

    ties: {

        // The last peer needs no step: every pair is already covered by earlier ones.
        steps: function (question, peers) {

            return peers.slice(0, -1).map(function (peer) {

                return {

                    question: question,
                    focus: peer

                };

            });

        },

        isComplete: function () {

            return true;

        },

        render: function (app, step, body) {

            var answers = app.answersFor(step.question);
            var peers = app.peers();
            var stage = el("div", "gensi-network");
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var positions = {};

            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("preserveAspectRatio", "none");
            svg.setAttribute("aria-hidden", "true");

            peers.forEach(function (peer, index) {

                var angle = (2 * Math.PI * index) / peers.length - Math.PI / 2;

                positions[peer.slot] = {

                    x: 50 + 40 * Math.cos(angle),
                    y: 50 + 40 * Math.sin(angle)

                };

            });

            function drawLines() {

                svg.textContent = "";

                peers.forEach(function (peer, index) {

                    peers.slice(index + 1).forEach(function (other) {

                        if (!answers[tieKey(peer.slot, other.slot)]) {

                            return;

                        }

                        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

                        line.setAttribute("x1", positions[peer.slot].x);
                        line.setAttribute("y1", positions[peer.slot].y);
                        line.setAttribute("x2", positions[other.slot].x);
                        line.setAttribute("y2", positions[other.slot].y);
                        line.setAttribute("vector-effect", "non-scaling-stroke");
                        svg.appendChild(line);

                    });

                });

            }

            stage.appendChild(svg);

            peers.forEach(function (peer) {

                var isFocus = peer.slot === step.focus.slot;
                var key = tieKey(peer.slot, step.focus.slot);

                var node = makeButton("gensi-node gensi-node-placed", peer.name, function () {

                    if (isFocus) {

                        return;

                    }

                    answers[key] = !answers[key];
                    node.classList.toggle("gensi-node-active", answers[key]);
                    node.setAttribute("aria-pressed", String(answers[key]));
                    drawLines();

                });

                node.style.left = positions[peer.slot].x + "%";
                node.style.top = positions[peer.slot].y + "%";

                if (isFocus) {

                    node.classList.add("gensi-node-focus");
                    node.disabled = true;

                } else {

                    node.classList.toggle("gensi-node-active", Boolean(answers[key]));
                    node.setAttribute("aria-pressed", String(Boolean(answers[key])));

                }

                stage.appendChild(node);

            });

            drawLines();
            body.appendChild(stage);

        }

    }

};

function createApp(root, config, onFinish) {

    var text = config.text;

    var state = {

        slots: [],
        peers: [],
        answers: {},
        confirmedPairs: []

    };

    var stepIndex = 0;

    var app = {

        root: root,
        text: text,
        selectedSlot: null,

        peers: function () {

            return state.peers;

        },

        answersFor: function (question) {

            if (!state.answers[question.id]) {

                state.answers[question.id] = {};

            }

            return state.answers[question.id];

        },

        everyPeerAnswered: function (question) {

            var answers = app.answersFor(question);

            return state.peers.every(function (peer) {

                return answers[peer.slot] !== undefined;

            });

        },

        advance: function () {

            goTo(stepIndex + 1);

        },

        render: render

    };

    for (var i = 0; i < config.maxPeers; i++) {

        state.slots.push("");

    }

    function steps() {

        var list = [{

            names: true

        }];

        config.questions.forEach(function (question) {

            QUESTION_TYPES[question.type].steps(question, state.peers).forEach(function (step) {

                list.push(step);

            });

        });

        return list;

    }

    function typedPeers() {

        var peers = [];

        state.slots.forEach(function (name, slot) {

            if (name.trim()) {

                peers.push({

                    slot: slot,
                    name: name.trim()

                });

            }

        });

        return peers;

    }

    function showDialog(message, buttons) {

        var overlay = el("div", "gensi-dialog-overlay");
        var dialog = el("div", "gensi-dialog");
        var actions = el("div", "gensi-actions");

        dialog.setAttribute("role", "alertdialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.appendChild(el("p", "", message));

        buttons.forEach(function (spec) {

            actions.appendChild(makeButton(spec.primary ? "gensi-button gensi-button-primary" : "gensi-button", spec.label, function () {

                overlay.parentNode.removeChild(overlay);

                if (spec.onClick) {

                    spec.onClick();

                }

            }));

        });

        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        root.appendChild(overlay);
        actions.firstChild.focus();

    }

    function acknowledge(message) {

        showDialog(message, [{

            label: text.ok,
            primary: true

        }]);

    }

    // A changed name is a different person, so their earlier answers must not carry over.
    function commitPeers(peers, confirmedPairs) {

        var previous = {};

        state.peers.forEach(function (peer) {

            previous[peer.slot] = normalizeName(peer.name);

        });

        var kept = {};

        peers.forEach(function (peer) {

            kept[peer.slot] = previous[peer.slot] === normalizeName(peer.name);

        });

        config.questions.forEach(function (question) {

            var answers = state.answers[question.id] || {};

            Object.keys(answers).forEach(function (key) {

                var stillValid = String(key).split("-").every(function (slot) {

                    return kept[slot];

                });

                if (!stillValid) {

                    delete answers[key];

                }

            });

        });

        state.peers = peers;
        state.confirmedPairs = confirmedPairs;

        goTo(1);

    }

    function checkDuplicates(peers) {

        var pairs = findDuplicatePairs(peers);

        if (pairs.length === 0) {

            commitPeers(peers, []);

            return;

        }

        var repeated = peers.filter(function (peer) {

            return peer.slot === pairs[0][0];

        })[0];

        var message = fill(text.duplicateMessage, {

            name: repeated.name

        });

        showDialog(message, [

            {

                label: text.duplicateEdit,
                primary: true

            },

            {

                label: text.duplicateKeep,
                onClick: function () {

                    commitPeers(peers, pairs);

                }

            }

        ]);

    }

    function submitNames() {

        var peers = typedPeers();

        if (peers.length === 0) {

            acknowledge(text.noPeers);

            return;

        }

        if (peers.length >= config.minPeers) {

            checkDuplicates(peers);

            return;

        }

        if (config.requireMinPeers) {

            acknowledge(fill(text.fewPeersBlocked, {

                min: config.minPeers

            }));

            return;

        }

        var message = fill(text.fewPeersMessage, {

            count: peers.length,
            min: config.minPeers

        });

        showDialog(message, [

            {

                label: text.fewPeersEdit,
                primary: true

            },

            {

                label: text.fewPeersContinue,
                onClick: function () {

                    checkDuplicates(peers);

                }

            }

        ]);

    }

    function finish() {

        var record = buildRecord(config, state);

        state.slots = [];
        state.peers = [];
        root.textContent = "";

        onFinish(record);

    }

    function goTo(index) {

        if (index >= steps().length) {

            finish();

            return;

        }

        stepIndex = index;
        app.selectedSlot = null;
        render();

    }

    function next() {

        var step = steps()[stepIndex];

        if (step.names) {

            submitNames();

            return;

        }

        if (QUESTION_TYPES[step.question.type].isComplete(app, step)) {

            app.advance();

            return;

        }

        if (config.requireAnswers) {

            acknowledge(text.incompleteBlocked);

            return;

        }

        showDialog(text.incompleteMessage, [

            {

                label: text.incompleteEdit,
                primary: true

            },

            {

                label: text.incompleteContinue,
                onClick: app.advance

            }

        ]);

    }

    function renderNames(body) {

        var list = el("div", "gensi-name-list");
        var inputs = [];
        var hints = [];

        function refreshHints() {

            var repeated = {};

            findDuplicatePairs(typedPeers()).forEach(function (pair) {

                repeated[pair[0]] = true;
                repeated[pair[1]] = true;

            });

            hints.forEach(function (hint, slot) {

                hint.textContent = repeated[slot] ? text.duplicateHint : "";

            });

        }

        state.slots.forEach(function (name, slot) {

            var row = el("label", "gensi-name-row");
            var input = el("input", "gensi-name-input");
            var hint = el("span", "gensi-name-hint");

            // No name attribute and autofill/spellcheck off: nothing here can be serialized or sent.
            input.type = "text";
            input.value = name;
            input.maxLength = config.maxNameLength;
            input.placeholder = text.namePlaceholder;
            input.autocomplete = "off";
            input.spellcheck = false;
            input.setAttribute("autocapitalize", "words");
            input.setAttribute("data-lpignore", "true");
            input.setAttribute("data-1p-ignore", "true");

            input.addEventListener("input", function () {

                state.slots[slot] = input.value;
                refreshHints();

            });

            input.addEventListener("keydown", function (event) {

                if (event.key !== "Enter") {

                    return;

                }

                event.preventDefault();

                if (inputs[slot + 1]) {

                    inputs[slot + 1].focus();

                } else {

                    next();

                }

            });

            inputs.push(input);
            hints.push(hint);

            var label = fill(text.peerLabel, {

                n: slot + 1

            });

            row.appendChild(el("span", "gensi-name-label", label));
            row.appendChild(input);
            row.appendChild(hint);
            list.appendChild(row);

        });

        body.appendChild(el("p", "gensi-privacy", text.namesPrivacy));
        body.appendChild(list);
        refreshHints();

    }

    function render() {

        var list = steps();
        var step = list[stepIndex];

        root.textContent = "";

        var panel = el("div", "gensi-panel");
        var progress = el("div", "gensi-progress");
        var bar = el("div", "gensi-progress-bar");
        var body = el("div", "gensi-body");
        var footer = el("div", "gensi-actions gensi-footer");

        // The step total is unknown until names are in, so the names page shows a fixed start.
        bar.style.width = step.names ? "5%" : Math.round((100 * (stepIndex + 1)) / list.length) + "%";
        progress.appendChild(bar);
        panel.appendChild(progress);

        if (step.names) {

            panel.appendChild(el("h1", "gensi-title", text.namesTitle));
            var intro = fill(text.namesPrompt, {

                max: config.maxPeers

            });

            panel.appendChild(el("p", "gensi-prompt", intro));
            renderNames(body);

        } else {

            var prompt = fill(step.question.prompt, {

                name: step.focus ? step.focus.name : ""

            });

            panel.appendChild(el("p", "gensi-prompt", prompt));
            QUESTION_TYPES[step.question.type].render(app, step, body);

        }

        panel.appendChild(body);

        if (stepIndex > 0) {

            footer.appendChild(makeButton("gensi-button", text.back, function () {

                goTo(stepIndex - 1);

            }));

        }

        var isLast = stepIndex === list.length - 1 && !step.names;

        footer.appendChild(makeButton("gensi-button gensi-button-primary", isLast ? text.finish : text.next, next));
        panel.appendChild(footer);
        root.appendChild(panel);
        root.scrollTop = 0;

    }

    render();

}
