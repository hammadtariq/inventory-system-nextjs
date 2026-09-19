import db from "@/lib/postgres";

// Inventory rows are sometimes created with an explicit id (matching the id of
// the Items/product they came from — see pages/api/purchase/approve/[id].js and
// pages/api/sales/returns/index.js) instead of letting Postgres assign one via
// inventories_id_seq. Postgres sequences don't auto-advance when a primary key
// value is supplied explicitly, so without this call the sequence silently
// drifts behind the real MAX(id) until a later auto-generated insert collides
// with an already-taken id ("duplicate key value violates unique constraint
// inventories_pkey"). GREATEST keeps this a no-op if the sequence is already
// ahead, and reading last_value (not currval()) avoids the "currval is not yet
// defined in this session" error on a session's first call.
export const bumpInventorySequence = async (id, transaction) => {
  await db.sequelize.query(
    `SELECT setval(
       pg_get_serial_sequence('inventories', 'id'),
       GREATEST(:id, (SELECT last_value FROM inventories_id_seq))
     )`,
    { replacements: { id }, transaction }
  );
};
