import { Pool } from "pg";

declare global {
  // Keep one pool during local Next.js hot reloads.
  var campusOpsPool: Pool | undefined;
  var campusOpsDbReady: Promise<void> | undefined;
}

export const pool = globalThis.campusOpsPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com") ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== "production") globalThis.campusOpsPool = pool;

const equipmentSeed = [
  ["EQ-1042", "Main Chiller Unit", "ပင်မ အအေးပေးစက်", "Innovation Centre", "Plant room · B1", "HVAC", "Attention", "2 min ago"],
  ["EQ-1087", "Air Handling Unit 04", "လေဝင်လေထွက်စက် ၀၄", "Engineering Block", "Roof · Zone C", "HVAC", "Operational", "4 min ago"],
  ["EQ-1124", "Lift Controller B", "ဓာတ်လှေကားထိန်းချုပ်စက် B", "Library", "Core B · Level 1", "Vertical transport", "Offline", "8 min ago"],
  ["EQ-1158", "Solar Inverter Array", "နေရောင်ခြည် အင်ဗာတာ", "Science Block", "Roof · East", "Energy", "Operational", "11 min ago"],
  ["EQ-1191", "Water Pump 02", "ရေစုပ်စက် ၀၂", "Student Centre", "Service room · G", "Plumbing", "Operational", "13 min ago"],
  ["EQ-1216", "Emergency Generator", "အရေးပေါ်မီးစက်", "Innovation Centre", "Plant room · G", "Power", "Operational", "18 min ago"],
  ["EQ-1189", "Lighting Panel L3", "မီးအလင်းထိန်းချုပ်ခုံ L3", "Engineering Block", "Floor 3 · Room 3.14", "Lighting", "Attention", "Yesterday"],
] as const;

const ticketSeed = [
  ["MT-26091", "EQ-1124", "Lift Controller B", "Controller is not responding; lift isolated for safety.", "Library · Core B", "M. Carter", "Critical", "Open", "Today, 09:42"],
  ["MT-26090", "EQ-1042", "Main Chiller Unit", "Supply temperature remains above target range.", "Innovation Centre · B1", "A. Rahman", "High", "In progress", "Today, 08:16"],
  ["MT-26087", "EQ-1189", "Lighting Panel L3", "Intermittent lighting in seminar room 3.14.", "Engineering Block · L3", "J. Green", "Medium", "Resolved", "Yesterday, 15:05"],
] as const;

export async function ensureDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!globalThis.campusOpsDbReady) {
    globalThis.campusOpsDbReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS equipment (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, mm TEXT NOT NULL DEFAULT '',
          building TEXT NOT NULL, location TEXT NOT NULL, category TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('Operational','Attention','Offline')),
          updated TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS maintenance_requests (
          id TEXT PRIMARY KEY, equipment_id TEXT REFERENCES equipment(id) ON DELETE SET NULL,
          equipment TEXT NOT NULL, issue TEXT NOT NULL, location TEXT NOT NULL,
          reporter TEXT NOT NULL, priority TEXT NOT NULL CHECK (priority IN ('Critical','High','Medium','Low')),
          status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In progress','Resolved')),
          created TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS app_users (
          email TEXT PRIMARY KEY, name TEXT NOT NULL, password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      const eqCount = Number((await pool.query("SELECT COUNT(*)::int AS n FROM equipment")).rows[0].n);
      if (eqCount === 0) {
        for (const row of equipmentSeed) await pool.query(
          "INSERT INTO equipment (id,name,mm,building,location,category,status,updated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING", [...row],
        );
      }
      const ticketCount = Number((await pool.query("SELECT COUNT(*)::int AS n FROM maintenance_requests")).rows[0].n);
      if (ticketCount === 0) {
        for (const row of ticketSeed) await pool.query(
          "INSERT INTO maintenance_requests (id,equipment_id,equipment,issue,location,reporter,priority,status,created) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING", [...row],
        );
      }
    })().catch((error) => { globalThis.campusOpsDbReady = undefined; throw error; });
  }
  await globalThis.campusOpsDbReady;
}

export function asEquipment(row: Record<string, unknown>) {
  return { id: row.id, name: row.name, mm: row.mm, building: row.building, location: row.location, category: row.category, status: row.status, updated: row.updated };
}
export function asTicket(row: Record<string, unknown>) {
  return { id: row.id, equipmentId: row.equipment_id, equipment: row.equipment, issue: row.issue, location: row.location, reporter: row.reporter, priority: row.priority, status: row.status, created: row.created };
}
