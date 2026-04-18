# GHL Custom Fields for Signup Webhook v2

These fields match the current `/signup` and `/voice-signup` webhook payload.

Webhook source pages:

- `https://liveoakjiujitsuacademy.com/signup`
- `https://liveoakjiujitsuacademy.com/voice-signup`

Raw webhook behavior:

- The form sends rich JSON to n8n first.
- n8n / ChatGPT should format the final GHL contact payload.
- You do **not** need a custom field for every nested object in the raw payload.
- You **do** want custom fields for the flat keys you want to persist in GHL.

## Built-In GHL Contact Fields

No custom-field setup is needed for these:

- `first_name`
- `last_name`
- `phone`
- `email`

Important mapping rule:

- `signup_type = self` -> built-in contact is the student
- `signup_type = parent_for_child` -> built-in contact name is the child, but built-in phone/email come from the parent
- `signup_type = self_plus_other` -> built-in contact is participant 1 / self

## Recommended Folders

Create these folders under **Settings > Custom Fields**:

1. `Signup General`
2. `Guardian`
3. `Person 1`
4. `Person 2`
5. `Person 3`
6. `Person 4`
7. `Person 5`

## Signup General

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Form Version | `form_version` | Single Line Text |
| Signup Source | `signup_source` | Single Line Text |
| Signup Path | `signup_path` | Single Line Text |
| Page URL | `page_url` | Single Line Text |
| Booking Mode | `booking_mode` | Single Line Text |
| Booking Mode Label | `booking_mode_label` | Single Line Text |
| Signup Type | `signup_type` | Single Line Text |
| SMS Consent | `sms_consent` | Checkbox |
| Legal Consent | `legal_consent` | Checkbox |
| Authorized Submitter Confirmation | `authorized_submitter_confirmation` | Checkbox |
| Person Count | `person_count` | Number |
| Participant Count | `participant_count` | Number |
| Programs Needed | `programs_needed` | Single Line Text |
| Contains Minor | `contains_minor` | Checkbox |

## Guardian

Use these for child signups so the parent's info is not lost when the contact record is named after the child.

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Primary Guardian First Name | `primary_guardian_first_name` | Single Line Text |
| Primary Guardian Last Name | `primary_guardian_last_name` | Single Line Text |
| Primary Guardian Phone | `primary_guardian_phone` | Phone |
| Primary Guardian Phone Display | `primary_guardian_phone_display` | Single Line Text |
| Primary Guardian Email | `primary_guardian_email` | Single Line Text |
| Primary Guardian Relationship | `primary_guardian_relationship` | Single Line Text |
| Parent 2 First Name | `parent_2_first_name` | Single Line Text |
| Parent 2 Last Name | `parent_2_last_name` | Single Line Text |
| Parent 2 Phone | `parent_2_phone` | Phone |
| Parent 2 Email | `parent_2_email` | Single Line Text |

## Person 1

`person_1_*` is always the first booking target.

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 1 Role | `person_1_role` | Single Line Text |
| Person 1 First Name | `person_1_first_name` | Single Line Text |
| Person 1 Last Name | `person_1_last_name` | Single Line Text |
| Person 1 Age | `person_1_age` | Number |
| Person 1 Is Minor | `person_1_is_minor` | Checkbox |
| Person 1 Program | `person_1_program` | Single Line Text |
| Person 1 Program Key | `person_1_program_key` | Single Line Text |
| Person 1 Date of Birth | `person_1_dob` | Date Picker |
| Person 1 Preferred Day | `person_1_preferred_day` | Single Line Text |
| Person 1 Preferred Time | `person_1_preferred_time` | Single Line Text |
| Person 1 Appointment Date | `person_1_appointment_date` | Single Line Text |
| Person 1 Appointment Date Short | `person_1_appointment_date_short` | Single Line Text |
| Person 1 Appointment Datetime | `person_1_appointment_datetime` | Single Line Text |
| Person 1 Relationship to Primary Contact | `person_1_relationship_to_primary_contact` | Single Line Text |
| Person 1 Medical Notes | `person_1_medical_notes` | Single Line Text |
| Person 1 Experience | `person_1_experience` | Single Line Text |

## Person 2

Used for:

- `me_plus_other`
- additional child signups when a parent adds more than one child

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 2 Role | `person_2_role` | Single Line Text |
| Person 2 First Name | `person_2_first_name` | Single Line Text |
| Person 2 Last Name | `person_2_last_name` | Single Line Text |
| Person 2 Age | `person_2_age` | Number |
| Person 2 Is Minor | `person_2_is_minor` | Checkbox |
| Person 2 Program | `person_2_program` | Single Line Text |
| Person 2 Program Key | `person_2_program_key` | Single Line Text |
| Person 2 Date of Birth | `person_2_dob` | Date Picker |
| Person 2 Preferred Day | `person_2_preferred_day` | Single Line Text |
| Person 2 Preferred Time | `person_2_preferred_time` | Single Line Text |
| Person 2 Appointment Date | `person_2_appointment_date` | Single Line Text |
| Person 2 Appointment Date Short | `person_2_appointment_date_short` | Single Line Text |
| Person 2 Appointment Datetime | `person_2_appointment_datetime` | Single Line Text |
| Person 2 Relationship to Primary Contact | `person_2_relationship_to_primary_contact` | Single Line Text |
| Person 2 Medical Notes | `person_2_medical_notes` | Single Line Text |
| Person 2 Experience | `person_2_experience` | Single Line Text |

## Person 3

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 3 Role | `person_3_role` | Single Line Text |
| Person 3 First Name | `person_3_first_name` | Single Line Text |
| Person 3 Last Name | `person_3_last_name` | Single Line Text |
| Person 3 Age | `person_3_age` | Number |
| Person 3 Is Minor | `person_3_is_minor` | Checkbox |
| Person 3 Program | `person_3_program` | Single Line Text |
| Person 3 Program Key | `person_3_program_key` | Single Line Text |
| Person 3 Date of Birth | `person_3_dob` | Date Picker |
| Person 3 Preferred Day | `person_3_preferred_day` | Single Line Text |
| Person 3 Preferred Time | `person_3_preferred_time` | Single Line Text |
| Person 3 Appointment Date | `person_3_appointment_date` | Single Line Text |
| Person 3 Appointment Date Short | `person_3_appointment_date_short` | Single Line Text |
| Person 3 Appointment Datetime | `person_3_appointment_datetime` | Single Line Text |
| Person 3 Relationship to Primary Contact | `person_3_relationship_to_primary_contact` | Single Line Text |
| Person 3 Medical Notes | `person_3_medical_notes` | Single Line Text |
| Person 3 Experience | `person_3_experience` | Single Line Text |

## Person 4

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 4 Role | `person_4_role` | Single Line Text |
| Person 4 First Name | `person_4_first_name` | Single Line Text |
| Person 4 Last Name | `person_4_last_name` | Single Line Text |
| Person 4 Age | `person_4_age` | Number |
| Person 4 Is Minor | `person_4_is_minor` | Checkbox |
| Person 4 Program | `person_4_program` | Single Line Text |
| Person 4 Program Key | `person_4_program_key` | Single Line Text |
| Person 4 Date of Birth | `person_4_dob` | Date Picker |
| Person 4 Preferred Day | `person_4_preferred_day` | Single Line Text |
| Person 4 Preferred Time | `person_4_preferred_time` | Single Line Text |
| Person 4 Appointment Date | `person_4_appointment_date` | Single Line Text |
| Person 4 Appointment Date Short | `person_4_appointment_date_short` | Single Line Text |
| Person 4 Appointment Datetime | `person_4_appointment_datetime` | Single Line Text |
| Person 4 Relationship to Primary Contact | `person_4_relationship_to_primary_contact` | Single Line Text |
| Person 4 Medical Notes | `person_4_medical_notes` | Single Line Text |
| Person 4 Experience | `person_4_experience` | Single Line Text |

## Person 5

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 5 Role | `person_5_role` | Single Line Text |
| Person 5 First Name | `person_5_first_name` | Single Line Text |
| Person 5 Last Name | `person_5_last_name` | Single Line Text |
| Person 5 Age | `person_5_age` | Number |
| Person 5 Is Minor | `person_5_is_minor` | Checkbox |
| Person 5 Program | `person_5_program` | Single Line Text |
| Person 5 Program Key | `person_5_program_key` | Single Line Text |
| Person 5 Date of Birth | `person_5_dob` | Date Picker |
| Person 5 Preferred Day | `person_5_preferred_day` | Single Line Text |
| Person 5 Preferred Time | `person_5_preferred_time` | Single Line Text |
| Person 5 Appointment Date | `person_5_appointment_date` | Single Line Text |
| Person 5 Appointment Date Short | `person_5_appointment_date_short` | Single Line Text |
| Person 5 Appointment Datetime | `person_5_appointment_datetime` | Single Line Text |
| Person 5 Relationship to Primary Contact | `person_5_relationship_to_primary_contact` | Single Line Text |
| Person 5 Medical Notes | `person_5_medical_notes` | Single Line Text |
| Person 5 Experience | `person_5_experience` | Single Line Text |

## Keys You Do Not Need as GHL Custom Fields

These are useful inside n8n, but usually do not need to be persisted directly in GHL:

- `primary_contact`
- `ghl_contact`
- `participants`
- `booking_targets`
- `programs_requested`
- `participant_1_*`
- `participant_2_*`
- `participant_3_*`
- `participant_4_*`
- `participant_5_*`

Those are best used by the ChatGPT formatting step before the final GHL create / update action.

## Minimum Booking Fields

If you want the leanest possible GHL setup, the minimum high-value fields are:

- `signup_type`
- `programs_needed`
- `primary_guardian_*`
- `parent_2_*`
- `person_1_program`
- `person_1_appointment_datetime`
- `person_1_dob`
- `person_1_medical_notes`
- `person_1_experience`
- `person_2_*` through `person_5_*` if you plan to allow additional kids

## Value Notes

- Program labels:
  - `Sprouts (Ages 3–5)`
  - `Youth BJJ (Ages 6–17)`
  - `Adult BJJ (Ages 18+)`
- Program keys:
  - `sprouts`
  - `youth`
  - `adult`
- Appointment datetime format:
  - `YYYY-MM-DD HH:MM AM/PM`
- Date of birth format:
  - `YYYY-MM-DD`
- US phone values sent toward GHL should be E.164:
  - `+1XXXXXXXXXX`
