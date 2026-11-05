function readField(engine, name) {

    if (engine.getJSEmbeddedData) {

        var modern = engine.getJSEmbeddedData(name);

        if (modern) {

            return modern;

        }

    }

    return engine.getEmbeddedData ? engine.getEmbeddedData(name) : "";

}

// Layouts disagree on which setter persists, and a field only one of them owns is simply ignored.
function writeField(engine, name, value) {

    if (engine.setJSEmbeddedData) {

        engine.setJSEmbeddedData(name, value);

    }

    if (engine.setEmbeddedData) {

        engine.setEmbeddedData(name, value);

    }

}

function clickNext(question) {

    if (question.clickNextButton) {

        question.clickNextButton();

        return;

    }

    var button = document.getElementById("NextButton");

    if (button) {

        button.click();

    }

}

function warnBeforeLeaving(event) {

    event.preventDefault();
    event.returnValue = GENSI_CONFIG.text.leaveWarning;

    return GENSI_CONFIG.text.leaveWarning;

}

function injectStyles() {

    if (document.getElementById("gensi-styles")) {

        return;

    }

    var style = document.createElement("style");

    style.id = "gensi-styles";
    style.textContent = GENSI_CSS;
    document.head.appendChild(style);

}

// View Response replays question JS on a report page, where the module would hide the data.
function isResponseReport() {

    return window.location.pathname.indexOf("/Q/Data/") !== -1;

}

function mount(engine, question) {

    if (isResponseReport()) {

        return function () {};

    }

    if (readField(engine, FIELD_COMPLETE) === "1") {

        clickNext(question);

        return function () {};

    }

    injectStyles();

    // Mounted on body, outside Qualtrics' form, so typed names are never part of a page submit.
    var host = document.createElement("div");

    host.id = "gensi-root";
    host.setAttribute("role", "main");

    ["keydown", "keypress", "keyup"].forEach(function (type) {

        host.addEventListener(type, function (event) {

            event.stopPropagation();

        });

    });

    function unmount() {

        window.removeEventListener("beforeunload", warnBeforeLeaving);

        if (host.parentNode) {

            host.parentNode.removeChild(host);

        }

    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.body.appendChild(host);

    createApp(host, GENSI_CONFIG, function (record) {

        Object.keys(record).forEach(function (name) {

            writeField(engine, name, record[name]);

        });

        unmount();
        clickNext(question);

    });

    return unmount;

}

(function () {

    var unmount = function () {};

    Qualtrics.SurveyEngine.addOnReady(function () {

        var errors = validateConfig(GENSI_CONFIG);

        if (errors.length) {

            throw new Error("GENSI config: " + errors.join("; "));

        }

        unmount = mount(Qualtrics.SurveyEngine, this);

    });

    Qualtrics.SurveyEngine.addOnUnload(function () {

        unmount();

    });

})();
