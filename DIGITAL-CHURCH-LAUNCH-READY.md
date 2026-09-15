# Origin — Digital Church Launch Readiness

The project is structured as a digital church experience with public pages, community, live, news, prophetic room, giving, contact, admin and department-admin areas, plus a configurable launch countdown.

## Included launch polish
- Black-and-white cinematic launch screen.
- Glowing, pulsing **GRACE • PEACE** near the bottom of the countdown.
- Responsive mobile layout.
- Reduced-motion accessibility support.
- Production-oriented metadata and theme settings.
- Existing API, Supabase and admin architecture preserved.

## Before going public
1. Run the SQL migrations listed in `SETUP_CHECKLIST.md` in Supabase.
2. Confirm production environment variables are configured in the deployment host.
3. Set and test the launch date in **Church Settings → Launch Countdown**.
4. Test Home, About, Programs, Partnership, College, Contact, Give, Community, Live, News and Prophetic Room.
5. Test contact, newsletter, prayer requests, authentication, admin and department-admin flows.
6. If using meetings, configure `DAILY_API_KEY` and test a real meeting.
7. Verify the church's final logo, contact details, giving instructions, social links and legal/privacy information.
8. Deploy and test the production domain on both desktop and mobile.

## Important
Code readiness does not replace account-level setup. Supabase credentials, production secrets, third-party accounts, domain/DNS and final content must be verified in the production environment before announcing the public launch.
