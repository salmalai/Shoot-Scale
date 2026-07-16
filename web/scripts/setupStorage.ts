// One-time setup: creates the private Supabase Storage bucket that holds
// Sandcastles JSON exports. Run with: npm run setup-storage

import { supabaseAdmin } from "../lib/supabaseAdmin";

// Kept in sync with lib/tools/sandcastles.ts's SANDCASTLES_BUCKET — not imported
// directly because that module chain is marked "server-only" (Next-bundler-only)
// and this script runs standalone under tsx.
const SANDCASTLES_BUCKET = "sandcastles-exports";

async function main() {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) throw error;

  if (buckets?.some((b) => b.name === SANDCASTLES_BUCKET)) {
    console.log(`Bucket "${SANDCASTLES_BUCKET}" already exists.`);
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(SANDCASTLES_BUCKET, {
    public: false,
  });
  if (createError) throw createError;
  console.log(`Created bucket "${SANDCASTLES_BUCKET}".`);
}

main().catch((err) => {
  console.error("Failed to set up storage:", err);
  process.exit(1);
});
