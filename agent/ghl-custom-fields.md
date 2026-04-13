# GHL Custom Fields for Voice Agent Signup Form

These custom fields need to be created in GoHighLevel to receive data from the `/voice-agent-signup` form webhook.

Webhook URL: `https://services.leadconnectorhq.com/hooks/lotrqaddDPbq4iNMladP/webhook-trigger/1c84f1cf-d106-49c0-9d51-fdf006b737a3`

---

## Built-In Contact Fields (no setup needed)

These map automatically to GHL's standard contact fields:

- `first_name` — Contact First Name
- `last_name` — Contact Last Name
- `phone` — Contact Phone
- `email` — Contact Email

---

## GHL Folder Structure

Create these folders under **Settings > Custom Fields** to keep things organized:

1. **Signup General** — holds the general/account-level fields (SMS Consent, Person Count, Programs Needed, Parent 2 fields)
2. **Person 1** — holds all 9 fields for person 1
3. **Person 2** — holds all 9 fields for person 2
4. **Person 3** — holds all 9 fields for person 3
5. **Person 4** — holds all 9 fields for person 4
6. **Person 5** — holds all 9 fields for person 5

---

## General Custom Fields

> **Folder: Signup General**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| SMS Consent | `sms_consent` | Checkbox |
| Person Count | `person_count` | Number |
| Programs Needed | `programs_needed` | Single Line Text |
| Parent 2 First Name | `parent_2_first_name` | Single Line Text |
| Parent 2 Last Name | `parent_2_last_name` | Single Line Text |
| Parent 2 Phone | `parent_2_phone` | Phone |
| Parent 2 Email | `parent_2_email` | Single Line Text |

---

## Person 1

> **Folder: Person 1**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 1 First Name | `person_1_first_name` | Single Line Text |
| Person 1 Last Name | `person_1_last_name` | Single Line Text |
| Person 1 Age | `person_1_age` | Number |
| Person 1 Program | `person_1_program` | Single Line Text |
| Person 1 Appointment Datetime | `person_1_appointment_datetime` | Single Line Text |
| Person 1 Date of Birth | `person_1_dob` | Date Picker |
| Person 1 Emergency Contact | `person_1_emergency_contact` | Single Line Text |
| Person 1 Allergies | `person_1_allergies` | Single Line Text |
| Person 1 Experience | `person_1_experience` | Single Line Text |

---

## Person 2

> **Folder: Person 2**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 2 First Name | `person_2_first_name` | Single Line Text |
| Person 2 Last Name | `person_2_last_name` | Single Line Text |
| Person 2 Age | `person_2_age` | Number |
| Person 2 Program | `person_2_program` | Single Line Text |
| Person 2 Appointment Datetime | `person_2_appointment_datetime` | Single Line Text |
| Person 2 Date of Birth | `person_2_dob` | Date Picker |
| Person 2 Emergency Contact | `person_2_emergency_contact` | Single Line Text |
| Person 2 Allergies | `person_2_allergies` | Single Line Text |
| Person 2 Experience | `person_2_experience` | Single Line Text |

---

## Person 3

> **Folder: Person 3**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 3 First Name | `person_3_first_name` | Single Line Text |
| Person 3 Last Name | `person_3_last_name` | Single Line Text |
| Person 3 Age | `person_3_age` | Number |
| Person 3 Program | `person_3_program` | Single Line Text |
| Person 3 Appointment Datetime | `person_3_appointment_datetime` | Single Line Text |
| Person 3 Date of Birth | `person_3_dob` | Date Picker |
| Person 3 Emergency Contact | `person_3_emergency_contact` | Single Line Text |
| Person 3 Allergies | `person_3_allergies` | Single Line Text |
| Person 3 Experience | `person_3_experience` | Single Line Text |

---

## Person 4

> **Folder: Person 4**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 4 First Name | `person_4_first_name` | Single Line Text |
| Person 4 Last Name | `person_4_last_name` | Single Line Text |
| Person 4 Age | `person_4_age` | Number |
| Person 4 Program | `person_4_program` | Single Line Text |
| Person 4 Appointment Datetime | `person_4_appointment_datetime` | Single Line Text |
| Person 4 Date of Birth | `person_4_dob` | Date Picker |
| Person 4 Emergency Contact | `person_4_emergency_contact` | Single Line Text |
| Person 4 Allergies | `person_4_allergies` | Single Line Text |
| Person 4 Experience | `person_4_experience` | Single Line Text |

---

## Person 5

> **Folder: Person 5**

| Field Name | Webhook Key | Field Type |
|---|---|---|
| Person 5 First Name | `person_5_first_name` | Single Line Text |
| Person 5 Last Name | `person_5_last_name` | Single Line Text |
| Person 5 Age | `person_5_age` | Number |
| Person 5 Program | `person_5_program` | Single Line Text |
| Person 5 Appointment Datetime | `person_5_appointment_datetime` | Single Line Text |
| Person 5 Date of Birth | `person_5_dob` | Date Picker |
| Person 5 Emergency Contact | `person_5_emergency_contact` | Single Line Text |
| Person 5 Allergies | `person_5_allergies` | Single Line Text |
| Person 5 Experience | `person_5_experience` | Single Line Text |

---

## Total Field Count

- **7** general custom fields
- **9** fields × **5** people = **45** per-person fields
- **52 custom fields total**

---

## Possible Values Reference

**Program values:**
- `Sprouts (Ages 3–5)`
- `Youth BJJ (Ages 6–12)`
- `Adult & Teen BJJ (Ages 13+)`

**Appointment Datetime format:** `YYYY-MM-DD HH:MM AM/PM` (e.g. `2026-04-13 06:00 PM`)

**Experience values:**
- `None`
- `Less than 1 year`
- `1-3 years`
- `3+ years`

**Date of Birth format:** `YYYY-MM-DD` (e.g. `1994-03-22`)

**Allergies:** Free text, only sent if filled in (optional field)

**Phone format:** Send contact phone values in E.164 when posting to GHL (for US numbers: `+1XXXXXXXXXX`).
