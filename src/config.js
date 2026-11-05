// Edit this file for each study, then run: node tools/build.js
var GENSI_CONFIG = {

    minPeers: 5,
    maxPeers: 10,
    maxNameLength: 20,

    // false = a warning the participant can click past; true = they cannot continue.
    requireMinPeers: false,
    requireAnswers: false,

    // Qualtrics' Simple layout stores JS-set data under "__js_"; use "" for older layouts.
    fieldPrefix: "__js_",

    text: {

        namesTitle: "Your closest friends",
        namesPrompt: "Please list up to {max} of your closest friends. Use a first name or a nickname, one person per box.",
        namesPrivacy: "These names stay in your browser so you can recognize each person. They are never saved or sent to the researchers, who only see Peer 1, Peer 2, and so on.",
        namePlaceholder: "First name",
        peerLabel: "Friend {n}",

        duplicateHint: "Same name as another box",
        duplicateMessage: "You entered \"{name}\" more than once. Are these different people?",
        duplicateKeep: "Yes, different people",
        duplicateEdit: "No, let me fix it",

        fewPeersMessage: "You listed {count}, and we are hoping for at least {min}. If you can think of anyone else, please add them.",
        fewPeersBlocked: "Please list at least {min} people to continue.",
        fewPeersContinue: "Continue anyway",
        fewPeersEdit: "Add more",

        noPeers: "Please enter at least one name to continue.",
        incompleteMessage: "You have not answered for everyone. Would you like to go back and finish?",
        incompleteBlocked: "Please answer for everyone to continue.",
        incompleteContinue: "Continue anyway",
        incompleteEdit: "Go back",

        ok: "OK",
        back: "Back",
        next: "Next",
        finish: "Finish",
        unplaced: "Not placed yet",
        leaveWarning: "If you leave now, your answers on this page will be lost."

    },

    // Placeholder questions: replace with your study's measures. Ids become column names.
    questions: [

        {

            id: "closeness",
            type: "dragBoxes",
            prompt: "How close do you feel to each person? Drag each name into a box, or tap a name and then a box.",
            options: [

                {

                    value: 1,
                    label: "Not close"

                },

                {

                    value: 2,
                    label: "Somewhat close"

                },

                {

                    value: 3,
                    label: "Close"

                },

                {

                    value: 4,
                    label: "Very close"

                },

                {

                    value: 5,
                    label: "Extremely close"

                }

            ]

        },

        {

            id: "contact",
            type: "choice",
            prompt: "How often do you talk with {name}?",
            options: [

                {

                    value: 1,
                    label: "Less than monthly"

                },

                {

                    value: 2,
                    label: "Monthly"

                },

                {

                    value: 3,
                    label: "Weekly"

                },

                {

                    value: 4,
                    label: "Daily"

                }

            ]

        },

        {

            id: "same_school",
            type: "clickSelect",
            prompt: "Select everyone who attends your university."

        },

        {

            id: "knows",
            type: "ties",
            prompt: "Who among these people knows {name}? Select everyone who does."

        }

    ]

};

if (typeof module !== "undefined") {

    module.exports = GENSI_CONFIG;

}
