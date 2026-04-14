# GHL Custom Fields for Student-First Signup

These fields match the new n8n webhook payload from:

- `/signup`
- `/voice-signup`

The main rule is:

- GHL built-in contact name should always be `person_1`
- parent or guardian info must live in custom fields when `mode = my_child`

## Built-In GHL Contact Fields

Map these from the formatted n8n output:

| GHL Built-In Field | Value |
|---|---|
| First Name | `ghl_contact.first_name` |
| Last Name | `ghl_contact.last_name` |
| Phone | `ghl_contact.phone` |
| Email | `ghl_contact.email` |

## Recommended Custom Field Groups

### 1. Signup Meta

| Field Name | Key |
|---|---|
| Signup Source | `signup_source` |
| Signup Path | `signup_path` |
| Mode | `mode` |
| Mode Label | `mode_label` |
| Submitted At | `submitted_at` |
| Browser Timezone | `browser_timezone` |
| SMS Consent | `sms_consent` |
| Legal Consent | `legal_consent` |
| Authorized Submitter Confirmation | `authorized_submitter_confirmation` |
| Participant Count | `participant_count` |
| Programs Needed | `programs_needed` |

### 2. Primary Contact

| Field Name | Key |
|---|---|
| Primary Contact Role | `primary_contact_role` |
| Primary Contact First Name | `primary_contact_first_name` |
| Primary Contact Last Name | `primary_contact_last_name` |
| Primary Contact Full Name | `primary_contact_full_name` |
| Primary Contact Phone | `primary_contact_phone` |
| Primary Contact Phone Raw | `primary_contact_phone_raw` |
| Primary Contact Email | `primary_contact_email` |

### 3. Secondary Contact

| Field Name | Key |
|---|---|
| Secondary Contact Role | `secondary_contact_role` |
| Secondary Contact First Name | `secondary_contact_first_name` |
| Secondary Contact Last Name | `secondary_contact_last_name` |
| Secondary Contact Full Name | `secondary_contact_full_name` |
| Secondary Contact Phone | `secondary_contact_phone` |
| Secondary Contact Phone Raw | `secondary_contact_phone_raw` |
| Secondary Contact Email | `secondary_contact_email` |

### 4. Primary Guardian

Only populated for `my_child`.

| Field Name | Key |
|---|---|
| Primary Guardian First Name | `primary_guardian_first_name` |
| Primary Guardian Last Name | `primary_guardian_last_name` |
| Primary Guardian Full Name | `primary_guardian_full_name` |
| Primary Guardian Phone | `primary_guardian_phone` |
| Primary Guardian Phone Raw | `primary_guardian_phone_raw` |
| Primary Guardian Email | `primary_guardian_email` |

### 5. Student 1

| Field Name | Key |
|---|---|
| Person 1 Relation To Submitter | `person_1_relation_to_submitter` |
| Person 1 First Name | `person_1_first_name` |
| Person 1 Last Name | `person_1_last_name` |
| Person 1 Full Name | `person_1_full_name` |
| Person 1 Age | `person_1_age` |
| Person 1 DOB | `person_1_dob` |
| Person 1 Program Code | `person_1_program_code` |
| Person 1 Program | `person_1_program` |
| Person 1 Preferred Day | `person_1_preferred_day` |
| Person 1 Preferred Time | `person_1_preferred_time` |
| Person 1 Appointment Date | `person_1_appointment_date` |
| Person 1 Appointment Time | `person_1_appointment_time` |
| Person 1 Appointment Datetime | `person_1_appointment_datetime` |
| Person 1 Date Short | `person_1_date_short` |
| Person 1 Allergies | `person_1_allergies` |
| Person 1 Experience | `person_1_experience` |

### 6. Student 2

Only needed for `me_plus_other`.

| Field Name | Key |
|---|---|
| Person 2 Relation To Submitter | `person_2_relation_to_submitter` |
| Person 2 First Name | `person_2_first_name` |
| Person 2 Last Name | `person_2_last_name` |
| Person 2 Full Name | `person_2_full_name` |
| Person 2 Age | `person_2_age` |
| Person 2 DOB | `person_2_dob` |
| Person 2 Program Code | `person_2_program_code` |
| Person 2 Program | `person_2_program` |
| Person 2 Preferred Day | `person_2_preferred_day` |
| Person 2 Preferred Time | `person_2_preferred_time` |
| Person 2 Appointment Date | `person_2_appointment_date` |
| Person 2 Appointment Time | `person_2_appointment_time` |
| Person 2 Appointment Datetime | `person_2_appointment_datetime` |
| Person 2 Date Short | `person_2_date_short` |
| Person 2 Allergies | `person_2_allergies` |
| Person 2 Experience | `person_2_experience` |

## Booking Logic

If you want the main GHL booking to always match the main contact name:

- `just_me` -> book from `person_1_*`
- `my_child` -> book from `person_1_*` and the GHL name will already be the child
- `me_plus_other` -> main contact is still `person_1`; `person_2` is stored for the second person

If you later want to create two separate appointments for `me_plus_other`, do that in n8n after the formatting step.
