# Antigravity Prompt — Fix Sanjeevani Triage, Booking & Care Workflow

## Objective

Fix and complete the **existing Sanjeevani triage → provider matching → booking → consultation → prescription/referral** workflow.

A lot of the UI, buttons, routes, and components may already exist. **Do not rebuild working functionality.** First inspect the existing codebase and identify what is already implemented, then connect/fix the broken logic, API calls, state transitions, database updates, and button handlers.

The goal is to make the entire patient journey functional end-to-end.

---

# 1. First: Audit the Existing Implementation

Before changing code:

1. Inspect the current patient triage flow.
2. Inspect the LLM/triage response structure.
3. Inspect doctor/clinic/hospital models and availability logic.
4. Inspect booking/request schemas and database collections/tables.
5. Inspect existing doctor request portals.
6. Inspect existing appointment, consultation, prescription, medicine reminder, summary, and referral pages.
7. Inspect every existing button related to these flows and verify whether it has:
   - a working click handler,
   - correct API call,
   - correct backend mutation,
   - loading state,
   - success/error handling,
   - correct navigation,
   - correct state refresh.
8. Reuse existing components, routes, services, APIs, and database structures wherever possible.
9. Only introduce new schema/API/state structures when the existing implementation cannot support the required behavior.

Do not create duplicate pages or duplicate APIs unnecessarily.

---

# 2. Triage Decision Routing

The LLM should classify the patient's situation into one of:

- `TELECONSULTATION`
- `CLINIC_VISIT`
- `EMERGENCY`

The LLM may use a **temporary diagnosis / suspected condition and speciality recommendation** for routing.

Important:

- The LLM diagnosis is **temporary/triage-level only**.
- Do not treat it as the doctor's final diagnosis.
- Use the predicted speciality/condition to find suitable doctors/clinics.
- Store the triage result so it can be displayed to the patient and passed to the provider.
- The doctor remains responsible for the final diagnosis.

Example conceptual result:

```json
{
  "route": "TELECONSULTATION",
  "temporary_diagnosis": "...",
  "recommended_speciality": "...",
  "urgency": "routine"
}
```

The exact schema should follow the existing project's conventions.

---

# 3. TELECONSULTATION WORKFLOW

## 3.1 Create One Patient Consultation Request

If triage recommends teleconsultation:

1. Create a single consultation request for the patient.
2. Determine the relevant speciality from the triage result.
3. Find all currently eligible/available doctors matching that speciality.
4. Send/show the same consultation request to **every eligible doctor**.

Do NOT send the patient into a single-doctor flow.

Conceptually:

```text
Patient
   ↓
LLM Triage
   ↓
TELECONSULTATION
   ↓
Temporary diagnosis + speciality
   ↓
Find eligible doctors
   ↓
Doctor A ─┐
Doctor B ─┼── Same patient request
Doctor C ─┘
```

---

## 3.2 Request Lifecycle

The consultation request must have a clear lifecycle/state.

Suggested states:

```text
OPEN
PARTIALLY_ACCEPTED
ACCEPTED_BY_PATIENT
SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
EXPIRED
```

Use the existing status system if one already exists.

### Important rule

The request remains active for the patient until the patient chooses one accepted doctor and schedules/accepts the appointment.

---

# 4. MULTIPLE DOCTORS CAN ACCEPT

Example:

Patient sends request.

```text
Doctor A → accepts
Doctor B → accepts
Doctor C → does not accept
```

The patient must now see the accepted doctors as choices.

Show a comparison interface containing at least:

- Doctor name
- Profile/photo
- Speciality
- Qualification/experience if already available
- Rating
- Consultation fee
- Available appointment timings
- Relevant availability information
- Any other existing provider metadata

Example:

```text
Choose your doctor

Doctor A
₹500
4.8 ★
Available: 10:30 AM, 12:00 PM
[Choose]

Doctor B
₹350
4.6 ★
Available: 11:00 AM, 1:30 PM
[Choose]
```

Do not automatically select the first doctor who accepts.

The **patient makes the final choice**.

---

# 5. PATIENT ACCEPTS ONE DOCTOR

When the patient chooses Doctor A:

1. Lock Doctor A as the selected provider.
2. Allow the patient to select an available appointment slot.
3. Create/confirm the appointment.
4. Mark the consultation request as `SCHEDULED` or equivalent.
5. Remove/cancel/close the same request from every other doctor's request portal.
6. Prevent another doctor from accepting or acting on the already-selected request.
7. Update all relevant patient/doctor appointment states.

Example:

```text
Doctor A → selected → appointment created
Doctor B → request removed/closed
Doctor C → request removed/closed
```

This must be **atomic/idempotent** so race conditions do not produce multiple confirmed appointments.

### Race-condition requirement

If two doctors accept at nearly the same time:

- Both may appear as accepted options.
- The patient chooses one.
- Once the patient confirms one doctor, all competing requests must be closed.
- A second appointment must not accidentally be created from the same consultation request.

Use server-side validation/transactions/conditional updates where supported.

---

# 6. DOCTOR REQUEST PORTAL

Fix the doctor-side request portal so that:

- New matching requests appear.
- Doctor can accept/reject if allowed.
- Accepting changes the correct backend state.
- Patient can see accepted doctors.
- Once another doctor is selected by the patient, the request disappears or becomes closed for the other doctors.
- Closed/expired/selected requests cannot be acted upon.
- UI updates without requiring a manual refresh where practical.

Do not rely only on frontend hiding.

The backend must enforce the state.

---

# 7. CLINIC VISIT WORKFLOW

If triage recommends `CLINIC_VISIT`:

Find suitable clinics based on the temporary diagnosis/speciality.

Patient should see a clinic list containing:

- Clinic name
- Distance from patient
- Consultation/visit fee
- Rating
- Speciality/relevance
- Available timings
- Any existing clinic metadata

Sort/rank results intelligently based on relevance, availability, distance, rating, and fee where the current product supports those fields.

Example:

```text
Recommended Clinics

Clinic A
2.1 km
₹300
4.7 ★
General Medicine
Today: 11:30 AM

[Book Visit]

Clinic B
3.4 km
₹250
4.5 ★
General Medicine
Today: 1:00 PM

[Book Visit]
```

---

# 8. CLINIC TOKEN + ARRIVAL TIME

When the patient chooses a clinic:

1. Confirm the visit.
2. Generate/get the clinic token number using the existing token system.
3. Determine the expected consultation/arrival timing.
4. Show:
   - Clinic
   - Address
   - Distance
   - Token number
   - Expected time/window
   - Fee
   - Booking status
5. Persist the booking.
6. Make sure duplicate token/booking creation cannot happen from repeated button clicks.

Example:

```text
Clinic Visit Confirmed

Clinic: ABC Clinic
Token: A-27
Expected Time: 4:30 PM
Fee: ₹300

[View Booking]
```

---

# 9. EMERGENCY WORKFLOW

If triage determines `EMERGENCY`:

1. Identify the nearest suitable clinic/hospital that can handle the emergency.
2. Send an emergency alert to the selected facility.
3. Include the patient's available location and relevant emergency/triage information.
4. Trigger the existing ambulance/emergency dispatch flow if one exists.
5. The ambulance request should be associated with the emergency case.
6. Patient should receive a clear emergency status screen.

Conceptually:

```text
Patient
   ↓
Emergency Triage
   ↓
Nearest suitable facility
   ↓
Emergency alert
   ↓
Ambulance dispatch
   ↓
Patient location
   ↓
Hospital/Clinic
```

Do not expose the patient's location unnecessarily to unrelated providers.

If the project already has an emergency escalation implementation, **repair and connect it rather than rebuilding it**.

---

# 10. TELECONSULTATION CALL EXPERIENCE

Once the appointment is scheduled, the consultation should support:

### Primary mode

**Video consultation**

Use the project's existing video-call implementation/provider if already present.

### Fallback

If video fails or network quality is insufficient:

```text
Video Call
   ↓
Connection failure / poor network
   ↓
Offer:
   → Switch to Voice Call
   → Retry Video
   → Reschedule
```

Both patient and doctor should have appropriate options.

---

# 11. TELECONSULTATION FAILURE / RESCHEDULING

Do not leave the appointment stuck indefinitely if the call cannot connect.

Handle states such as:

```text
SCHEDULED
CONNECTING
VIDEO_CONNECTED
VIDEO_FAILED
VOICE_CONNECTED
RESCHEDULE_REQUESTED
RESCHEDULED
CANCELLED
```

The exact implementation can use the existing status model.

If video does not connect:

### Patient can:

- Retry video
- Switch to voice
- Request/reschedule appointment
- Cancel if allowed by existing business rules

### Doctor can:

- Retry video
- Switch to voice
- Request/reschedule
- End/cancel according to existing rules

If one party switches to voice, synchronize that state for both sides.

Do not create a second appointment just because the call mode changes.

---

# 12. POST-CONSULTATION WORKFLOW

After the doctor completes the consultation, make sure the patient can access:

1. Prescription
2. Medicines
3. Medicine reminders
4. Consultation summary
5. Referral information, if provided
6. Appointment/consultation history

The flow should be:

```text
Consultation Complete
        ↓
Prescription
        ↓
Medicines
        ↓
Medicine Reminders
        ↓
Consultation Summary
        ↓
Referral (if applicable)
```

---

# 13. PRESCRIPTION DOWNLOAD

If prescription functionality already exists:

- Fix the download button.
- Verify the backend returns the correct prescription.
- Ensure the patient can download/view the complete prescription.
- Preserve doctor/patient/appointment association.
- Handle loading and errors.
- Do not generate an empty or unrelated prescription.

If PDF generation already exists, reuse it.

---

# 14. MEDICINE REMINDERS

After prescription:

1. Extract/use prescribed medicines from the existing prescription data.
2. Allow/show medicine reminder configuration.
3. Persist reminder times.
4. Display reminders in the patient's dashboard/reminder section.
5. Ensure the existing "Add Reminder" button actually works.

Do not create duplicate reminders when the button is clicked multiple times.

---

# 15. CONSULTATION SUMMARY

Generate/display a useful consultation summary using the actual consultation data.

The summary can contain:

- Reason for consultation
- Temporary triage information
- Final doctor diagnosis
- Symptoms discussed
- Doctor's assessment
- Advice
- Medicines
- Follow-up instructions
- Referral information

Do not represent the LLM's temporary diagnosis as the doctor's final diagnosis.

Fix the existing summary button/page if already present.

---

# 16. REFERRAL WORKFLOW

Referral functionality already exists but some buttons are non-functional.

Audit and repair it.

When a doctor refers the patient:

```text
Doctor
  ↓
Create Referral
  ↓
Select destination/speciality/facility
  ↓
Save referral
  ↓
Patient sees referral
  ↓
Patient can open/view referral
  ↓
Patient can proceed to the referred destination/workflow
```

Fix:

- Referral buttons
- API calls
- Navigation
- Database persistence
- Patient visibility
- Status updates
- Any existing referral acceptance/continuation flow

Do not rebuild the referral module if it already exists.

---

# 17. BUTTON FUNCTIONALITY AUDIT

This is a major requirement.

Search the entire codebase for buttons/actions related to:

- Book
- Accept
- Reject
- Choose Doctor
- Choose Clinic
- Confirm
- Schedule
- Reschedule
- Video Call
- Voice Call
- Retry
- Switch to Voice
- Download Prescription
- Add Reminder
- Summary
- Referral
- Emergency
- Ambulance
- View Appointment
- Complete Consultation

For every relevant button:

### Verify

```text
Button
 ↓
Correct handler
 ↓
Validation
 ↓
API/service call
 ↓
Database mutation
 ↓
Loading state
 ↓
Success/error response
 ↓
Correct UI update/navigation
```

A button must not merely look functional.

Remove placeholder handlers such as:

```js
onClick={() => {}}
```

or fake success notifications where real functionality is expected.

---

# 18. DATA CONSISTENCY

Maintain strong relationships between:

```text
Patient
  ↓
Triage Case
  ↓
Consultation Request
  ↓
Provider Responses
  ↓
Selected Provider
  ↓
Appointment
  ↓
Consultation
  ↓
Prescription
  ↓
Medicines / Reminders
  ↓
Summary
  ↓
Referral
```

Every object should be traceable to the correct patient and case.

Do not allow data from one patient's consultation to appear for another patient.

---

# 19. AUTHORIZATION & SECURITY

Enforce permissions server-side.

### Patient

Can:

- Create triage request
- View own provider options
- Choose provider
- Book own appointment
- View own prescription
- View own reminders
- View own summaries
- View own referrals

### Doctor

Can:

- View matching patient requests
- Accept/reject requests
- View authorized patient consultation information
- Conduct assigned consultation
- Create prescription
- Create referral
- Complete consultation

### Clinic/Hospital/Admin

Use the existing role permissions.

Never trust only frontend role checks.

---

# 20. IDEMPOTENCY & DUPLICATE ACTION PROTECTION

Repeated clicks must not create:

- Duplicate appointments
- Duplicate bookings
- Duplicate tokens
- Duplicate prescriptions
- Duplicate reminders
- Duplicate referrals
- Duplicate emergency alerts

Add appropriate server-side checks and frontend loading/disabled states.

---

# 21. REAL-TIME / REFRESH BEHAVIOR

Where the current stack supports it, update request and booking states in real time.

Important cases:

### Doctor accepts

Patient should eventually see the doctor in the accepted-provider list.

### Patient selects Doctor A

Doctor B should no longer see an actionable request.

### Appointment is scheduled

Both patient and doctor should see the appointment.

### Consultation completes

Patient should see prescription/summary/referral.

Use the project's existing realtime mechanism if available rather than adding another system unnecessarily.

---

# 22. ERROR & EMPTY STATES

Every major workflow must handle:

- No matching doctors
- No available clinics
- No available appointment slots
- Doctor rejects request
- Doctor becomes unavailable
- Request expires
- Appointment conflict
- Network failure
- Video failure
- Voice failure
- API failure
- Unauthorized action
- Duplicate submission

Provide meaningful user-facing messages and recovery actions.

Do not silently fail.

---

# 23. DO NOT BREAK EXISTING FEATURES

Before modifying anything:

- Identify the current stack.
- Identify current APIs.
- Identify current database.
- Identify current authentication.
- Identify current triage implementation.
- Identify current teleconsultation implementation.
- Identify current referral implementation.
- Identify current emergency implementation.
- Identify existing UI components.

Reuse them wherever possible.

Do not replace the entire architecture just to implement these changes.

---

# 24. IMPLEMENTATION STRATEGY

Work in this order:

### Phase 1 — Audit

Map:

```text
Frontend routes
Backend routes
Database models
API/services
State management
Existing components
Existing buttons
```

### Phase 2 — Fix Triage Routing

Implement/repair:

```text
LLM result
   ↓
TELECONSULTATION / CLINIC_VISIT / EMERGENCY
```

### Phase 3 — Fix Teleconsultation

Implement:

```text
One request
   ↓
All matching doctors
   ↓
Multiple doctors can accept
   ↓
Patient comparison
   ↓
Patient chooses one
   ↓
Appointment
   ↓
Close all competing requests
```

### Phase 4 — Fix Clinic Visit

Implement:

```text
Diagnosis/speciality
   ↓
Relevant clinics
   ↓
Distance + fee + rating + timing
   ↓
Patient chooses clinic
   ↓
Token + arrival timing
```

### Phase 5 — Fix Emergency

Implement/connect:

```text
Emergency
   ↓
Nearest suitable facility
   ↓
Alert
   ↓
Ambulance
```

### Phase 6 — Fix Consultation

Implement:

```text
Video
 ↓
Retry / Voice fallback / Reschedule
```

### Phase 7 — Fix Post-Consultation

Connect:

```text
Prescription
 ↓
Download
 ↓
Medicine reminders
 ↓
Summary
 ↓
Referral
```

### Phase 8 — Button Audit

Test every relevant existing button.

---

# 25. TEST THESE END-TO-END SCENARIOS

## Scenario A — Teleconsultation

```text
Patient starts triage
→ LLM recommends teleconsultation
→ speciality determined
→ Doctor A and Doctor B receive request
→ Doctor A accepts
→ Doctor B accepts
→ Patient sees A + B
→ Patient compares fee/timing/rating
→ Patient chooses Doctor B
→ Patient schedules appointment
→ Doctor A request closes
→ Doctor B appointment becomes confirmed
→ Consultation starts
→ Video works
→ Doctor completes consultation
→ Prescription available
→ Patient downloads prescription
→ Medicine reminder works
→ Summary available
```

## Scenario B — Video Failure

```text
Appointment
→ Start video
→ Video fails
→ Patient/doctor sees retry + voice + reschedule
→ Switch to voice
→ Both sides enter voice consultation
→ Consultation completes normally
```

## Scenario C — Clinic

```text
Patient starts triage
→ Clinic visit recommended
→ Relevant clinics shown
→ Distance/fee/rating/timing shown
→ Patient chooses clinic
→ Booking confirmed
→ Token generated
→ Expected timing shown
```

## Scenario D — Emergency

```text
Patient starts triage
→ Emergency detected
→ Suitable nearest facility selected
→ Emergency alert sent
→ Ambulance workflow triggered
→ Patient sees emergency status
```

## Scenario E — Referral

```text
Doctor completes consultation
→ Doctor creates referral
→ Referral persists
→ Patient sees referral
→ Referral button works
→ Patient can continue to referred care
```

---

# 26. FINAL ACCEPTANCE CRITERIA

The implementation is complete only when:

- [ ] Triage correctly routes to teleconsultation, clinic visit, or emergency.
- [ ] Temporary LLM diagnosis/speciality is used for routing, not treated as final diagnosis.
- [ ] Teleconsultation requests go to all eligible doctors of the relevant speciality.
- [ ] Multiple doctors can accept the same request.
- [ ] Patient can compare accepted doctors.
- [ ] Comparison includes fee, timing, and ratings.
- [ ] Patient chooses the final doctor.
- [ ] Selecting one doctor closes the request for all other doctors.
- [ ] Duplicate appointments cannot be created.
- [ ] Clinic recommendations show distance, fee, rating, speciality and timing where available.
- [ ] Clinic booking generates/assigns a token and expected timing.
- [ ] Emergency routes to a suitable nearby facility and triggers the existing ambulance flow.
- [ ] Teleconsultation supports video.
- [ ] Video has retry/voice fallback/reschedule handling.
- [ ] Voice mode synchronizes between patient and doctor.
- [ ] Prescription can be viewed/downloaded.
- [ ] Medicine reminders work.
- [ ] Consultation summary works.
- [ ] Referral buttons and flow work.
- [ ] Existing non-functional buttons are repaired.
- [ ] Loading/error/empty states exist.
- [ ] Backend authorization is enforced.
- [ ] Duplicate actions are prevented.
- [ ] Existing working functionality is preserved.

---

# IMPORTANT ANTIGRAVITY INSTRUCTION

**Do not stop after making the UI look correct.**

Trace every workflow from:

```text
UI
→ handler
→ API
→ backend logic
→ database
→ returned state
→ frontend state
→ navigation/UI
```

If a button already exists but is non-functional, **wire it to the real existing backend/service instead of creating a fake success state**.

If something is already implemented, reuse it.

If something is partially implemented, complete it.

If there is a conflict between the existing implementation and the workflow above, prioritize the workflow above while preserving the project's existing architecture and conventions.

After implementation, run the relevant tests/build/lint checks and manually verify the complete end-to-end patient, doctor, clinic, and emergency flows.
