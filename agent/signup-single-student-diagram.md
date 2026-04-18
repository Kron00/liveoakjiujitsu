# Full Signup + Webhook Diagram

This is a full diagram set for the current signup system and the target single-student model.

Relevant files:

- [signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/signup.html:505)
- [voice-signup.html](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/voice-signup.html:574)
- [agent/ghl-setup-guide.md](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/agent/ghl-setup-guide.md:55)
- [agent/ghl-custom-fields.md](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/agent/ghl-custom-fields.md:1)

---

## 1. Full Current System

Two public pages feed two different webhook endpoints:

- `/signup` -> website webhook
- `/voice-signup` -> voice-agent webhook

Both pages currently allow multi-person registration.

### 1.1 Current System Map

```mermaid
flowchart TD
    A[Prospect] --> B{Entry point}

    B --> C[/signup]
    B --> D[/voice-signup]

    C --> E[Website signup form]
    D --> F[Voice-agent signup form]

    E --> G{Mode}
    F --> H{Mode}

    G --> G1[Just Me]
    G --> G2[My Child / Someone Else]
    G --> G3[Me + Others]

    H --> H1[Just Me]
    H --> H2[My Child / Someone Else]
    H --> H3[Me + Others]

    G1 --> I[Build JSON payload]
    G2 --> I
    G3 --> I
    H1 --> J[Build JSON payload]
    H2 --> J
    H3 --> J

    I --> K[Website webhook]
    J --> L[Voice webhook]

    K --> M[GoHighLevel workflow]
    L --> N[GoHighLevel workflow]

    M --> O[Create Contact]
    N --> P[Create Contact]

    O --> Q[Store custom fields]
    P --> R[Store custom fields]

    Q --> S[Book appointment from person_1 only]
    R --> T[Book appointment from person_1 only]
```

### 1.2 Current Page Logic

```mermaid
flowchart TD
    A[Open form] --> B{Who is this for?}

    B --> C[Just Me]
    B --> D[My Child / Someone Else]
    B --> E[Me + Others]

    C --> C1[Collect main person's name]
    C1 --> C2[Collect DOB]
    C2 --> C3[Determine program from DOB]
    C3 --> C4[Choose day and time]
    C4 --> C5[Collect phone and email]
    C5 --> C6[Optional medical notes and experience]

    D --> D1[Collect parent contact info]
    D1 --> D2[Optional second parent]
    D2 --> D3[Add 1 to 5 trainees]
    D3 --> D4[Each trainee enters name + DOB]
    D4 --> D5[Each trainee gets program from DOB]
    D5 --> D6[Each trainee chooses day and time]
    D6 --> D7[Optional medical notes and experience per trainee]

    E --> E1[Collect adult self info]
    E1 --> E2[Adult self DOB -> program]
    E2 --> E3[Adult self day and time]
    E3 --> E4[Optional second parent]
    E4 --> E5[Add 1 to 4 additional trainees]
    E5 --> E6[Each added trainee enters name + DOB]
    E6 --> E7[Each added trainee chooses day and time]
    E7 --> E8[Optional medical notes and experience per trainee]
```

### 1.3 Current Website Signup Payload

`/signup` currently works like this:

```mermaid
flowchart LR
    subgraph Website_Page
      A1[Built-in contact fields]
      A2[parent_2_* optional]
      A3[person_1_* ... person_5_*]
      A4[sms_consent, person_count, programs_needed]
    end

    subgraph Contact_Rule
      B1[Just Me -> contact = adult]
      B2[Others -> contact = parent]
      B3[Both -> contact = adult self]
    end

    subgraph Booking_Rule
      C1[Workflow books person_1]
    end

    A1 --> B1
    A1 --> B2
    A1 --> B3
    A3 --> C1
```

### 1.4 Current Voice Signup Payload

`/voice-signup` is the same structure, but also includes emergency-contact behavior.

```mermaid
flowchart LR
    subgraph Voice_Page
      A1[Built-in contact fields]
      A2[parent_2_* optional]
      A3[person_1_* ... person_5_*]
      A4[person_X_emergency_contact]
      A5[person_X_emergency_contact_phone]
      A6[sms_consent, person_count, programs_needed]
    end

    subgraph Contact_Rule
      B1[Just Me -> contact = adult]
      B2[Others -> contact = parent]
      B3[Both -> contact = adult self]
    end

    subgraph Booking_Rule
      C1[Workflow books person_1]
    end

    A1 --> B1
    A1 --> B2
    A1 --> B3
    A3 --> C1
    A4 --> C1
    A5 --> C1
```

### 1.5 Current Identity Mismatch

This is the part that makes the current model confusing.

```mermaid
flowchart TD
    A[Current built-in GHL contact] --> B{Mode used?}

    B --> C[Just Me]
    B --> D[Others]
    B --> E[Both]

    C --> C1[Contact name = trainee]
    C --> C2[person_1 = same trainee]

    D --> D1[Contact name = parent]
    D --> D2[person_1 = child]

    E --> E1[Contact name = adult self]
    E --> E2[person_1 = adult self]
    E --> E3[person_2+ = other trainees]
```

The bad branch is `Others`:

- built-in contact record belongs to the parent
- booking logic belongs to `person_1`
- the trainee and the contact are not the same person

---

## 2. Current Field Ownership

### 2.1 Current Data Model

```mermaid
flowchart LR
    subgraph Built_In_GHL_Contact
      A1[first_name]
      A2[last_name]
      A3[phone]
      A4[email]
    end

    subgraph Shared_Custom_Fields
      B1[sms_consent]
      B2[person_count]
      B3[programs_needed]
      B4[parent_2_first_name]
      B5[parent_2_last_name]
      B6[parent_2_phone]
      B7[parent_2_email]
    end

    subgraph Person_Custom_Fields
      C1[person_1_*]
      C2[person_2_*]
      C3[person_3_*]
      C4[person_4_*]
      C5[person_5_*]
    end

    D1[Just Me] --> A1
    D1 --> A2
    D1 --> A3
    D1 --> A4
    D1 --> C1

    D2[Others] -->|parent| A1
    D2 -->|parent| A2
    D2 -->|parent| A3
    D2 -->|parent| A4
    D2 -->|trainees| C1
    D2 -->|trainees| C2
    D2 -->|trainees| C3
    D2 -->|trainees| C4
    D2 -->|trainees| C5

    D3[Both] -->|adult self| A1
    D3 -->|adult self| A2
    D3 -->|adult self| A3
    D3 -->|adult self| A4
    D3 -->|adult self| C1
    D3 -->|other trainees| C2
    D3 -->|other trainees| C3
    D3 -->|other trainees| C4
    D3 -->|other trainees| C5

    D2 --> B1
    D2 --> B2
    D2 --> B3
    D2 --> B4
    D2 --> B5
    D2 --> B6
    D2 --> B7

    D3 --> B1
    D3 --> B2
    D3 --> B3
    D3 --> B4
    D3 --> B5
    D3 --> B6
    D3 --> B7
```

### 2.2 Current Appointment Booking

From [ghl-setup-guide.md](/Users/julian/Documents/Projects/Business/liveoakjiujitsu/agent/ghl-setup-guide.md:55), the workflow books by `person_1_program` and `person_1_appointment_datetime`.

```mermaid
flowchart TD
    A[Inbound webhook] --> B[Create Contact]
    B --> C[Add Tag]
    C --> D{person_1_program}

    D -->|Adult| E[Book Adult Trial]
    D -->|Youth| F[Book Youth Trial]
    D -->|Sprouts| G[Book Sprouts Trial]

    E --> H[Send SMS]
    F --> H
    G --> H
```

That is why `person_1` is the most important object in the payload.

---

## 3. Proposed Full Target System

New business rule:

- one submission = one student account
- remove multi-person registration from both `/signup` and `/voice-signup`
- the account name should always be the student
- if the student is a child, parent contact info should still be attached to that student account

That means both pages should use the same two-mode model:

- `self`
- `parent-for-child`

### 3.1 Proposed System Map

```mermaid
flowchart TD
    A[Prospect] --> B{Entry point}

    B --> C[/signup]
    B --> D[/voice-signup]

    C --> E[Single-student signup form]
    D --> F[Single-student voice signup form]

    E --> G{Who is training?}
    F --> H{Who is training?}

    G --> G1[Myself]
    G --> G2[My Child]

    H --> H1[Myself]
    H --> H2[My Child]

    G1 --> I[Build student-first payload]
    G2 --> I
    H1 --> J[Build student-first payload]
    H2 --> J

    I --> K[Website webhook]
    J --> L[Voice webhook]

    K --> M[GoHighLevel workflow]
    L --> N[GoHighLevel workflow]

    M --> O[Create Contact where contact name = student]
    N --> P[Create Contact where contact name = student]

    O --> Q[Store guardian info in custom fields if needed]
    P --> R[Store guardian info in custom fields if needed]

    Q --> S[Book appointment from person_1]
    R --> T[Book appointment from person_1]
```

### 3.2 Proposed Page Logic

```mermaid
flowchart TD
    A[Open form] --> B{Who is training?}

    B --> C[Myself]
    B --> D[My Child]

    C --> C1[Collect student first and last name]
    C1 --> C2[Collect student DOB]
    C2 --> C3[Determine program from DOB]
    C3 --> C4[Choose day and time]
    C4 --> C5[Collect student phone and email]
    C5 --> C6[Optional student details]

    D --> D1[Collect child first and last name]
    D1 --> D2[Collect child DOB]
    D2 --> D3[Determine program from DOB]
    D3 --> D4[Choose day and time]
    D4 --> D5[Collect parent/guardian first and last name]
    D5 --> D6[Collect parent/guardian phone and email]
    D6 --> D7[Optional second parent]
    D7 --> D8[Optional student details]
```

### 3.3 Proposed Identity Rule

```mermaid
flowchart TD
    A[Every submission] --> B[Exactly one student]
    B --> C[Student always becomes person_1]
    C --> D[Student always becomes built-in contact first_name and last_name]
    D --> E{Signup type}
    E -->|self| F[Built-in contact phone/email = student]
    E -->|parent-for-child| G[Built-in contact phone/email = parent]
```

This is the simplest way to preserve:

- one student per booking
- current `person_1` appointment logic
- account named after the child when a parent is signing up

---

## 4. Proposed Data Model

### 4.1 Full Proposed Ownership

```mermaid
flowchart LR
    subgraph Built_In_GHL_Contact
      A1[first_name = student first name]
      A2[last_name = student last name]
      A3[phone = student phone for self or parent phone for child]
      A4[email = student email for self or parent email for child]
    end

    subgraph Tracking_Fields
      B1[signup_source]
      B2[signup_path]
      B3[page_url]
      B4[sms_consent]
      B5[signup_type]
      B6[person_count = 1]
    end

    subgraph Student_Fields
      C1[person_1_first_name]
      C2[person_1_last_name]
      C3[person_1_dob]
      C4[person_1_program]
      C5[person_1_appointment_datetime]
      C6[person_1_medical_notes optional]
      C7[person_1_experience optional]
    end

    subgraph Guardian_Fields
      D1[primary_guardian_first_name]
      D2[primary_guardian_last_name]
      D3[primary_guardian_phone]
      D4[primary_guardian_email]
      D5[relationship_to_student optional]
      D6[parent_2_first_name optional]
      D7[parent_2_last_name optional]
      D8[parent_2_phone optional]
      D9[parent_2_email optional]
    end

    E1[Self signup] --> A1
    E1 --> A2
    E1 --> A3
    E1 --> A4
    E1 --> B1
    E1 --> B2
    E1 --> B3
    E1 --> B4
    E1 --> B5
    E1 --> B6
    E1 --> C1
    E1 --> C2
    E1 --> C3
    E1 --> C4
    E1 --> C5
    E1 --> C6
    E1 --> C7

    E2[Parent-for-child signup] --> A1
    E2 --> A2
    E2 --> A3
    E2 --> A4
    E2 --> B1
    E2 --> B2
    E2 --> B3
    E2 --> B4
    E2 --> B5
    E2 --> B6
    E2 --> C1
    E2 --> C2
    E2 --> C3
    E2 --> C4
    E2 --> C5
    E2 --> C6
    E2 --> C7
    E2 --> D1
    E2 --> D2
    E2 --> D3
    E2 --> D4
    E2 --> D5
    E2 --> D6
    E2 --> D7
    E2 --> D8
    E2 --> D9
```

### 4.2 Why New Primary Guardian Fields Are Needed

```mermaid
flowchart TD
    A[Desired behavior] --> B[Contact name should be child]
    B --> C[Built-in first_name and last_name must be child]
    C --> D[Parent 1 can no longer live only in built-in contact fields]
    D --> E[Need dedicated custom fields for primary guardian]
```

Without those fields, you would lose the parent's name when the child becomes the contact record name.

---

## 5. Proposed Webhook Payloads

### 5.1 Self Signup

```mermaid
flowchart LR
    A[Form mode: self] --> B[first_name = student]
    A --> C[last_name = student]
    A --> D[phone = student]
    A --> E[email = student]
    A --> F[signup_type = self]
    A --> G[person_1_first_name = student]
    A --> H[person_1_last_name = student]
    A --> I[person_1_dob]
    A --> J[person_1_program]
    A --> K[person_1_appointment_datetime]
```

### 5.2 Parent-for-Child Signup

```mermaid
flowchart LR
    A[Form mode: parent-for-child] --> B[first_name = child]
    A --> C[last_name = child]
    A --> D[phone = parent]
    A --> E[email = parent]
    A --> F[signup_type = parent_for_child]
    A --> G[person_1_first_name = child]
    A --> H[person_1_last_name = child]
    A --> I[person_1_dob]
    A --> J[person_1_program]
    A --> K[person_1_appointment_datetime]
    A --> L[primary_guardian_first_name]
    A --> M[primary_guardian_last_name]
    A --> N[primary_guardian_phone]
    A --> O[primary_guardian_email]
```

### 5.3 Proposed Field Matrix

| Field | Self | Parent-for-child |
|---|---|---|
| `first_name` | student | child |
| `last_name` | student | child |
| `phone` | student | parent |
| `email` | student | parent |
| `signup_type` | `self` | `parent_for_child` |
| `person_1_first_name` | student | child |
| `person_1_last_name` | student | child |
| `person_1_dob` | student | child |
| `person_1_program` | student | child |
| `person_1_appointment_datetime` | student | child |
| `primary_guardian_*` | blank | populated |
| `parent_2_*` | optional | optional |
| `person_count` | `1` | `1` |

---

## 6. Proposed GHL Workflow

### 6.1 Proposed Workflow Map

```mermaid
flowchart TD
    A[Inbound webhook] --> B[Create Contact]
    B --> C[Map built-in contact name to student]
    C --> D[Map built-in phone/email to student or parent depending on signup_type]
    D --> E[Map person_1 custom fields]
    E --> F[Map primary_guardian custom fields if present]
    F --> G[Add Tag]
    G --> H{person_1_program}

    H -->|Adult| I[Book Adult Trial]
    H -->|Youth| J[Book Youth Trial]
    H -->|Sprouts| K[Book Sprouts Trial]

    I --> L[Send SMS]
    J --> L
    K --> L
```

### 6.2 Proposed Workflow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant P as Signup Page
    participant W as Webhook
    participant G as GoHighLevel Workflow
    participant C as GHL Contact
    participant Cal as Calendar

    U->>P: Fill out single-student form
    P->>P: Determine program from student DOB
    P->>P: Collect one appointment time
    P->>W: POST student-first payload
    W->>G: Trigger workflow
    G->>C: Create/update contact
    Note over G,C: Contact name always = student
    G->>C: Save guardian custom fields if parent signup
    G->>Cal: Book appointment using person_1_program and person_1_appointment_datetime
    G->>C: Send confirmation SMS
```

---

## 7. Exact Simplification You Want

This is the clean mental model.

```mermaid
flowchart TD
    A[One submission] --> B[One student]
    B --> C[One student record]
    C --> D[One booking]
    D --> E[person_1 always equals the booked student]
    E --> F{Who is providing contact info?}
    F -->|Student| G[Built-in contact phone/email = student]
    F -->|Parent| H[Built-in contact phone/email = parent]
    H --> I[Parent name/email/phone also stored in guardian fields]
```

---

## 8. Concrete Page Changes

### 8.1 Both `/signup` and `/voice-signup`

```mermaid
flowchart TD
    A[Current three modes] --> B[Remove Just Me / Others / Both structure]
    B --> C[Replace with two modes]
    C --> D[Myself]
    C --> E[My Child]

    D --> F[Render one student form]
    E --> G[Render child identity + parent contact form]

    F --> H[Always submit one student]
    G --> H
```

### 8.2 Field Cleanup

```mermaid
flowchart LR
    A[Remove repeatable person cards] --> B[Delete person_2 to person_5 form UI]
    B --> C[Remove multi-person validation]
    C --> D[Remove person_count branching complexity]
    D --> E[Keep only person_1 payload building]
```

### 8.3 Voice Page Extras

If you keep voice-specific emergency contact fields, the single-student version becomes:

```mermaid
flowchart TD
    A[/voice-signup] --> B{Mode}
    B --> C[Myself]
    B --> D[My Child]

    C --> E[Student info]
    E --> F[Student emergency contact]
    F --> G[Submit one student]

    D --> H[Child info]
    H --> I[Parent contact info]
    I --> J[Emergency contact for child]
    J --> K[Submit one student]
```

---

## 9. Recommended Final Architecture

```mermaid
flowchart TD
    A[/signup] --> C[Shared single-student payload shape]
    B[/voice-signup] --> C

    C --> D[first_name / last_name always = student]
    C --> E[phone / email = student or parent depending on mode]
    C --> F[person_1_* always = student]
    C --> G[primary_guardian_* only when parent is signing up]
    C --> H[parent_2_* optional]

    D --> I[GoHighLevel Create Contact]
    E --> I
    F --> J[GoHighLevel Book Appointment]
    G --> I
    H --> I

    I --> K[Student-named contact record]
    J --> L[Correct calendar booking]
```

## 10. Bottom Line

The simplest correct model is:

- both pages use the same single-student flow
- remove all multi-person registration
- `person_1` is always the student being booked
- built-in contact `first_name` and `last_name` are always the student
- built-in contact `phone` and `email` come from the student for self-signup, or the parent for child-signup
- primary parent info needs dedicated custom fields, otherwise it gets lost

If you want, I can do the next artifact too:

1. a stripped-down implementation plan for both HTML files
2. a GHL custom-field checklist for the new guardian fields
3. a before/after payload example in raw JSON
