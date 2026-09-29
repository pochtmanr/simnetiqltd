# Redacted real fixtures

The JSON files next to this note are synthetic. A passing corpus does not prove production numbers.

When a source export exists, add redacted fixtures under `fixtures/redacted-real/`. That directory is gitignored. Do not commit raw exports.

1. Freeze a UTC cutoff and the source admin view that will be compared.
2. Export the same window from the local calculation service, not from a second formula.
3. Replace account, customer, and document ids with stable tokens. Keep relationships: parent ids, `economic_transaction_id`, and `component_id` still line up.
4. Remove emails, phone numbers, device secrets, SMS body text, postal addresses, and credentials. Titles may stay only when they do not identify a person.
5. Keep original currency amounts, nulls, quality, and coverage. Do not fill missing tax, fees, or FX with zero.
6. Run `npm run test:business-os-contract` against any fixture you promote into the tracked corpus. A redacted file that fails the schema stays out of git until it is fixed or explicitly recorded as a rejected case.
7. Record the cutoff, formula version, and source commit in the step handoff. Do not record secret values.
