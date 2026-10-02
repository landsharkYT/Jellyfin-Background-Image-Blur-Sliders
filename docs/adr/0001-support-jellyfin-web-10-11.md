# Support Jellyfin Web on Jellyfin 10.11

The first release supports Jellyfin Web clients backed by Jellyfin Server 10.11. Native clients do not share Jellyfin Web's document or CSS, and Jellyfin 12 uses a different plugin ABI and runtime, so claiming either target would require a separate implementation or build plus its own testing.
