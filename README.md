# Cell-Wars
Human Biology: Immunology (Agario based game)

## Local Multiplayer Testing

`localhost` only points to the current device. If you scan a QR code from a phone and it opens `localhost:5173`, the phone is trying to reach itself, not your computer.

1. Run `npm run dev`.
2. Use the Network URL Vite prints, such as `http://192.168.1.25:5173`.
3. Open that Network URL on the host computer before creating the room, or set `VITE_JOIN_ORIGIN` in `.env.local` to that origin.
4. Make sure the other device is on the same Wi-Fi and Windows Firewall allows Node/Vite.

For people outside your Wi-Fi, use a deployed site or a tunnel such as Cloudflare Tunnel/ngrok. Real cross-device rooms also need the Supabase backend working; local fallback rooms are only stored in the host browser.

If your computer has multiple IPs, avoid virtual adapters like `192.168.56.x`; use the Wi-Fi/LAN address that matches your phone's network.

## Publishing

The app is a Vite React site, so it can be published as a static website.

Recommended path:

1. Push this repository to GitHub.
2. Import it into Vercel or Netlify.
3. Use `npm run build` as the build command.
4. Use `dist` as the publish/output directory.
5. Add these environment variables in the host dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_JOIN_ORIGIN`, set to the published site origin, for example `https://cell-wars.example.com`

`vercel.json` and `netlify.toml` are included so routes like `/join`, `/host`, and `/play` load correctly when opened directly from a QR code.

Solo play and the learning tabs work as a normal published site. Cross-device hosted rooms need Supabase anonymous auth and the tables from `supabase/schema.sql` so phones and computers can share room state.

In Supabase, enable anonymous sign-ins for the project. The app uses anonymous Supabase users so students do not need accounts, but rooms are still shared through the database.
