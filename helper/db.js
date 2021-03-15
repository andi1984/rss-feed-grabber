const createClient = require("@supabase/supabase-js").createClient;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_PUBLIC
);
const tableName = process.env.SUPABASE_TABLE_NAME;

/**
 * Get items from database.
 * @param {number} limit
 * @param {number} [offset]
 * @returns {Object}
 */
async function getItems(limit, offset = 0) {
  const request = await supabase
    .from(tableName)
    .select("*")
    .order("date", { ascending: false })
    .range(offset, offset + (limit - 1));

  if (request.error) {
    throw new Error(request.error.message);
  }

  return request.data;
}

module.exports = {
  getItems,
};
