# T14 production email setup — October 21, 2026

The authenticated Render environment was inspected during T12. It contains
DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET, NODE_ENV and NODE_VERSION, with no
linked environment groups. RESEND_API_KEY and MAIL_FROM are absent. Visiting
Resend domains redirects to login; Google sign-in also requires an interactive
login. No usable Resend credential or verified sending domain was provided.
No credentials were created, account settings changed or verification mail sent.

T14 remains pending access, rather than complete. To finish:

1. Sign in to the intended Resend account and identify a verified sending domain.
2. Store the sending key privately in Render as RESEND_API_KEY and set MAIL_FROM
   to an address on that verified domain. Do not commit either value or put it
   in frontend configuration.
3. Deploy the configuration and verify registration/verification and password
   recovery/setup delivery for the intended recipients. Record provider delivery
   and actual inbox/code completion separately.

The default onboarding@resend.dev address only sends test mail to the account
owner; it cannot establish production delivery to other users. See
[Resend's sender restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
The existing production mail failure remains a 503, with no console OTP fallback.
T17's verified password setup/recovery requires this operational gate before
release acceptance. No local tests/builds or workflow dispatch were run for T14.
