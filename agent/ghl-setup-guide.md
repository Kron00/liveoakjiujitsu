# GHL Setup Guide — Voice Agent Signup Form

Step-by-step instructions for wiring up the `/voice-signup` form to GoHighLevel.

---

## Step 1: Delete Old Custom Fields

Go to **Settings → Custom Fields** and delete these 10 fields from each Person folder (1–5):

- ❌ Person X Preferred Day
- ❌ Person X Preferred Time

That's 2 fields × 5 folders = **10 fields deleted**.

---

## Step 2: Create New Custom Fields

In each Person folder (1–5), create **one** new field:

| Folder | Field Name | Webhook Key | Field Type |
|---|---|---|---|
| Person 1 | Person 1 Appointment Datetime | `person_1_appointment_datetime` | Single Line Text |
| Person 2 | Person 2 Appointment Datetime | `person_2_appointment_datetime` | Single Line Text |
| Person 3 | Person 3 Appointment Datetime | `person_3_appointment_datetime` | Single Line Text |
| Person 4 | Person 4 Appointment Datetime | `person_4_appointment_datetime` | Single Line Text |
| Person 5 | Person 5 Appointment Datetime | `person_5_appointment_datetime` | Single Line Text |

That's **5 new fields**. Net result: 52 total custom fields (was 57).

---

## Step 3: Update the Create Contact Action

In the **Voice Agent Sign Up** workflow, open the **Create Contact** action.

**Remove** these 10 field mappings:
- All `person_X_preferred_day` rows (5 rows)
- All `person_X_preferred_time` rows (5 rows)

**Add** these 5 new field mappings:

| Select Field | Value |
|---|---|
| Person 1 Appointment Datetime | `{{inboundWebhookRequest.person_1_appointment_datetime}}` |
| Person 2 Appointment Datetime | `{{inboundWebhookRequest.person_2_appointment_datetime}}` |
| Person 3 Appointment Datetime | `{{inboundWebhookRequest.person_3_appointment_datetime}}` |
| Person 4 Appointment Datetime | `{{inboundWebhookRequest.person_4_appointment_datetime}}` |
| Person 5 Appointment Datetime | `{{inboundWebhookRequest.person_5_appointment_datetime}}` |

Click **Save action**.

---

## Step 4: Create Calendars (if not done)

You need three trial calendars under **Calendars**:

1. **Adult Trial** — for Adult BJJ (Ages 18+)
2. **Youth Trial** — for Youth BJJ (Ages 6–17)
3. **Sprouts Trial** — for Sprouts (Ages 3–5)

Set each calendar's timezone to **America/Los_Angeles** (Pacific Time).

---

## Step 5: Add Conditional Branching + Book Appointment

After the **Add Tag** action and before the **SMS** action, add an **If/Else** branch.

### Branch 1: Adult

- **Condition:** `{{inboundWebhookRequest.person_1_program}}` contains `Adult`
- **Action:** Book Appointment
  - Action Name: `Book Adult Trial`
  - Calendar: **Adult Trial**
  - Start Date & Time: `{{inboundWebhookRequest.person_1_appointment_datetime}}`

### Branch 2: Youth

- **Condition:** `{{inboundWebhookRequest.person_1_program}}` contains `Youth`
- **Action:** Book Appointment
  - Action Name: `Book Youth Trial`
  - Calendar: **Youth Trial**
  - Start Date & Time: `{{inboundWebhookRequest.person_1_appointment_datetime}}`

### Branch 3: Sprouts

- **Condition:** `{{inboundWebhookRequest.person_1_program}}` contains `Sprouts`
- **Action:** Book Appointment
  - Action Name: `Book Sprouts Trial`
  - Calendar: **Sprouts Trial**
  - Start Date & Time: `{{inboundWebhookRequest.person_1_appointment_datetime}}`

All three branches then continue to the **SMS** action.

> **Note:** This books Person 1 only. For multi-person signups (person 2–5), you would need additional branching logic or a separate workflow. Start with Person 1 and add more later if needed.

---

## Step 6: Update the SMS Action

After the Book Appointment branches, the existing **SMS** action sends the confirmation:

- **Message:**
  ```
  Hey {{contact.first_name}}! It's Gigi from Live Oak Jiu Jitsu Academy. You're all set for your free trial! Remember to bring flip flops, a water bottle, and comfortable athletic clothes. Arrive 10 minutes early for a quick tour. See you soon! 🤙
  ```

---

## Step 7: Test It

Submit a test through the live form at `https://www.liveoakjiujitsuacademy.com/voice-signup` and check:

1. ✅ Contact created with all custom fields populated
2. ✅ Tag added
3. ✅ Appointment booked on the correct calendar at the correct date/time
4. ✅ SMS confirmation sent

---

## Final Workflow Order

```
Inbound Webhook
  → Create Contact (52 custom fields mapped)
  → Add Tag ("Voice Agent Signup")
  → If/Else (branch on person_1_program)
    → Book Appointment (correct calendar + appointment_datetime)
  → SMS (confirmation message)
  → END
```
