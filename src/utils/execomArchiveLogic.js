// Pure decisions for the /teams archive page: which batches the era filter
// shows, and whether a member matches the active search/role filters.

export function batchVisible(batch, era) {
  return era === 'all' || batch.era === era;
}

export function memberMatches(member, query, role) {
  const matchesRole = role === 'all' || member.category === role;
  if (!matchesRole) return false;
  if (!query) return true;
  const haystack =
    `${member.name} ${member.role} ${member.company} ${member.year || ''}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

// Members shown when a search is active: every member across batches that
// matches the query + era + role. Returns them with their batch title for
// the result caption.
export function searchMembers(batches, query, era, role) {
  const q = (query || '').trim();
  const results = [];
  for (const batch of batches) {
    if (!batchVisible(batch, era)) continue;
    for (const member of batch.members) {
      if (memberMatches(member, q, role)) {
        results.push({ ...member, batchTitle: batch.title });
      }
    }
  }
  return results;
}
