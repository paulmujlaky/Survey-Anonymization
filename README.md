# GENSI Anonymous for Qualtrics

GENSI for Qualtrics, where peer names stay in the participant's browser and the export shows only `peer1`, `peer2`, and so on.

## Use

1. In your own Qualtrics account, go to **Survey > From a File** and import `dist/GENSI_Anonymous.qsf`.
2. Turn on **Survey options > Security > Anonymize responses**. Otherwise Qualtrics records IP addresses and locations.
3. Click **Preview** to try it. The builder shows only placeholder text, because JavaScript doesn't run there.
4. Publish it and take it once with fake names.
5. Export the data. The `peer` columns should have values, and the fake names should not appear.

If the peer columns are empty, set `fieldPrefix` to `""` in `src/config.js`, rebuild and re-import.

If the import fails, paste `dist/gensi-qualtrics.js` into a Text/Graphic question's JavaScript. Then add `dist/embedded-data-fields.txt` as Embedded Data at the top of Survey Flow, and turn off the Back button.

## Change the study

Edit peers, questions and wording in `src/config.js`, then rebuild and re-import:

```bash
node tools/build.js
```

## Commands

Make long peer and tie tables from an export:

```bash
node tools/reshape_export.js path/to/export.csv
```

Run the tests:

```bash
node --test test/core.test.js
```

Run a local mock at http://localhost:4173:

```bash
node test/serve.js
```

## Limits

Data saves only at Finish, and a refresh loses the participant's progress. Names typed into other open-text questions are saved normally.

## License

GPL-3.0, inherited from GENSI (Stark & Krosnick, 2017).
