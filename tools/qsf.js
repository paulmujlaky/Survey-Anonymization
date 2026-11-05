// Qualtrics rejects imports unless ids match prefix_ plus 11-15 letters or digits.
var SURVEY_ID = "SV_gensiAnonMvp001";
var OWNER_ID = "UR_gensiOwner0001";
var BRAND_ID = "fairfield";
var BLOCK_ID = "BL_gensiNetwork001";
var TRASH_ID = "BL_gensiTrash00001";
var RESPONSE_SET_ID = "RS_gensiDefault001";
var QUESTION_ID = "QID1";

function element(type, primary, secondary, payload) {

    return {

        SurveyID: SURVEY_ID,
        Element: type,
        PrimaryAttribute: primary,
        SecondaryAttribute: secondary,
        TertiaryAttribute: null,
        Payload: payload

    };

}

function embeddedField(name) {

    return {

        Description: name,
        Type: "Recipient",
        Field: name,
        VariableType: "String",
        DataVisibility: [],
        AnalyzeText: false

    };

}

function buildQsf(questionJs, fields) {

    var blocks = [

        {

            Type: "Default",
            Description: "GENSI network module",
            ID: BLOCK_ID,
            BlockElements: [{

                Type: "Question",
                QuestionID: QUESTION_ID

            }]

        },

        {

            Type: "Trash",
            Description: "Trash / Unused Questions",
            ID: TRASH_ID,
            BlockElements: []

        }

    ];

    // Fields must sit before the block in the flow or Qualtrics drops them from the export.
    var flow = {

        Flow: [

            {

                Type: "EmbeddedData",
                FlowID: "FL_2",
                EmbeddedData: fields.map(embeddedField)

            },

            {

                ID: BLOCK_ID,
                Type: "Block",
                FlowID: "FL_3"

            }

        ],

        Properties: {

            Count: 3,
            RemovedFieldsets: []

        },

        FlowID: "FL_1",
        Type: "Root"

    };

    var options = {

        BackButton: "false",
        SaveAndContinue: "false",
        SurveyProtection: "PublicSurvey",
        BallotBoxStuffingPrevention: "false",
        NoIndex: "Yes",
        SecureResponseFiles: "true",
        SurveyExpiration: "None",
        SurveyTermination: "DefaultMessage",
        Header: "",
        Footer: "",
        ProgressBarDisplay: "None",
        PartialData: "+1 week",
        ValidationMessage: "",
        PreviousButton: "",
        NextButton: " → ",
        SkinLibrary: "",
        SkinType: "MQ",
        Skin: "",
        NewScoring: 1

    };

    var question = {

        QuestionText: "GENSI friendship module. It runs only in Preview or the published survey, not in this editor.",
        DefaultChoices: false,
        DataExportTag: "gensi_module",
        QuestionType: "DB",
        Selector: "TB",
        DataVisibility: {

            Private: false,
            Hidden: false

        },

        Configuration: {

            QuestionDescriptionOption: "UseText"

        },

        QuestionDescription: "GENSI network module",
        ChoiceOrder: [],

        Validation: {

            Settings: {

                Type: "None"

            }

        },

        GradingData: [],
        Language: [],
        NextChoiceId: 1,
        NextAnswerId: 1,
        QuestionJS: questionJs,
        QuestionID: QUESTION_ID

    };

    return {

        SurveyEntry: {

            SurveyID: SURVEY_ID,
            SurveyName: "GENSI Anonymous MVP",
            SurveyDescription: null,
            SurveyOwnerID: OWNER_ID,
            SurveyBrandID: BRAND_ID,
            DivisionID: null,
            SurveyLanguage: "EN",
            SurveyActiveResponseSet: RESPONSE_SET_ID,
            SurveyStatus: "Inactive",
            SurveyStartDate: "0000-00-00 00:00:00",
            SurveyExpirationDate: "0000-00-00 00:00:00",
            SurveyCreationDate: "2026-11-05 00:00:00",
            CreatorID: OWNER_ID,
            LastModified: "2026-11-05 00:00:00",
            LastAccessed: "0000-00-00 00:00:00",
            LastActivated: "0000-00-00 00:00:00",
            Deleted: null

        },

        SurveyElements: [

            element("BL", "Survey Blocks", null, blocks),
            element("FL", "Survey Flow", null, flow),
            element("SO", "Survey Options", null, options),
            element("SQ", QUESTION_ID, "GENSI network module", question),
            element("QC", "Survey Question Count", "1", null),
            element("RS", RESPONSE_SET_ID, "Default Response Set", null)

        ]

    };

}

module.exports = buildQsf;
