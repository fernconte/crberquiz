import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  console.error("NEON_DATABASE_URL is not set.");
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminUsername || !adminPassword) {
  console.error("ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD are required.");
  process.exit(1);
}

const sql = neon(databaseUrl);

const categories = [
  {
    id: "web",
    name: "Web Security",
    slug: "web-security",
    description: "Injection, auth hardening, browser attacks.",
  },
  {
    id: "iot",
    name: "IoT Security",
    slug: "iot-security",
    description: "Firmware, radio protocols, and embedded risks.",
  },
  {
    id: "hardware",
    name: "Hardware Security",
    slug: "hardware-security",
    description: "Side-channel analysis, tamper resistance, boot chains.",
  },
  {
    id: "crypto",
    name: "Cryptography",
    slug: "cryptography",
    description: "Protocols, key management, and practical crypto design.",
  },
  {
    id: "social",
    name: "Social Engineering",
    slug: "social-engineering",
    description: "Human-layer attacks and defensive playbooks.",
  },
];

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function seedAdmin() {
  const normalizedEmail = adminEmail.trim().toLowerCase();
  const normalizedUsername = adminUsername.trim().toLowerCase();

  const existing = await sql`
    select id from users
    where lower(email) = ${normalizedEmail}
       or lower(username) = ${normalizedUsername}
    limit 1
  `;

  if (existing.length > 0) {
    console.log("Admin user already exists.");
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(adminPassword, salt);

  await sql`
    insert into users (email, username, display_name, role, salt, password_hash, password_algo)
    values (
      ${normalizedEmail},
      ${adminUsername.trim()},
      ${adminUsername.trim()},
      'admin',
      ${salt},
      ${passwordHash},
      'scrypt'
    )
  `;

  console.log("Admin user created.");
}

async function seedCategories() {
  for (const category of categories) {
    await sql`
      insert into categories (id, name, slug, description)
      values (
        ${category.id},
        ${category.name},
        ${category.slug},
        ${category.description}
      )
      on conflict (id) do nothing
    `;
  }
  console.log("Categories seeded.");
}

async function main() {
  await seedAdmin();
  await seedCategories();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
