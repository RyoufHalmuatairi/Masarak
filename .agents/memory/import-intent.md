---
name: Project scope and target
description: User's stated project completion goal and intended release platforms.
---

The user initially imported Masarak for experimentation and modifications. The current goal is to complete the full scope in the project report, fix existing issues, implement the missing features, test the whole product, and prepare it for release on iOS and Android.

**Why:** The user explicitly set the full report as the target, selected iOS and Android, and required one bounded task at a time with a saved version and result before moving on, rather than scope expansion or treating source code as proof of hosted activation.

**How to apply:** Use saved acceptance criteria, implement only the current bounded task, verify it, save the changes, report the result, and stop before the next task. Distinguish local test evidence from live provider/database and device verification; leave unverified criteria open. Preserve the current stack unless an agreed technical need requires a change, and do not describe the app as release-ready until the features, security, mobile builds, and tests have been verified.

Do not initiate a publishing setup or suggest publishing while the app is still incomplete, including a backend-only publishing step for an unfinished feature.

**Why:** The user objected that the app was not ready and they had not asked for publishing when backend email-hook publishing was suggested.

**How to apply:** Keep implementation and local testing separate from external activation. Explain hosting requirements without starting a publishing flow, and wait for an explicit publishing request after readiness has been agreed.

The user separately approved preparing and running the email hook inside Supabase without publishing Masarak.

**Why:** The user selected a Supabase function after its separate cloud setup and Brevo credential requirements were explained.

**How to apply:** This permits that email function's setup only. It does not permit publishing the Replit project, the mobile application, or unrelated services, nor does it establish release readiness.

The user chose to use a newly created Supabase project under a new account rather than the project previously set up by their teammate.

**Why:** The user approved starting with a new Supabase project while retaining the application code.

**How to apply:** Configure and verify the new project independently. Do not assume old users or data have migrated, and do not delete or modify the teammate's project.
