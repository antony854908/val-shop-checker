// Manual metadata for store items that are live in-game but not yet indexed by
// valorant-api.com (brand-new patch content). Only used when the catalog has
// no entry for an ID, so real data automatically takes over once published.
//
// IDs come from the "[StorefrontService] N item(s) missing from catalog" log.
// Item names without `name` are built from the bundle name + item type.

const BUNDLES = {
  champions2026: {
    name: 'Champions 2026',
    subName: 'คอลเลกชันรุ่นลิมิเต็ด',
    description: 'เฉลิมฉลองการแข่งขัน Champions 2026 และสนับสนุนทีมโปรดของคุณด้วยชุดบันเดิลรุ่นลิมิเต็ด ตั้งแต่วันที่ 22 กันยายน ถึง 20 ตุลาคม รายได้ส่วนหนึ่งจากคอลเลกชัน Champions 2026 จะมอบให้ทีมพันธมิตรใน VCT'
  },
  wardenLaunch: {
    name: 'Warden Launch',
    subName: 'คอลเลกชันเปิดตัวไรเฟิลใหม่ Warden (แพตช์ 13.06)',
    description: 'ชุดเปิดตัวปืนไรเฟิลใหม่ Warden ที่มาพร้อมแพตช์ 13.06'
  }
};

// Patch 13.06 (2026-09-22), order matches the in-game bundle layout
const ITEMS = {
  // Champions 2026 (6,640 VP)
  '9f88e377-48ec-6bcf-9641-a495870b05ef': { bundle: 'champions2026', name: 'Champions 2026 มีด (Melee)' },
  '49dd8152-4901-0fc7-3d4a-cbb7c4f4e409': { bundle: 'champions2026', name: 'Champions 2026 Phantom' },
  '4b8e7084-4df0-5f39-8c02-0e8035849195': { bundle: 'champions2026', name: 'Champions 2026 การ์ดผู้เล่น #1' },
  'd30271ae-4ce1-5ed2-c55f-f08a6247c274': { bundle: 'champions2026', name: 'Champions 2026 การ์ดผู้เล่น #2' },
  '49b3553d-44a2-9f61-c050-52a401064495': { bundle: 'champions2026', name: 'Champions 2026 การ์ดผู้เล่น #3' },
  '7f6ac746-4b70-cd78-e74e-e9b178c009a6': { bundle: 'champions2026', type: 'spray' },
  'eb86ef90-485a-f84e-3478-a7b5a9bac61b': { bundle: 'champions2026', name: 'Champions 2026 พวงกุญแจ' },
  // Warden Launch (995 VP)
  '3cda025f-468b-3a1d-8936-b1b26d7c8fe5': { bundle: 'wardenLaunch' },
  '1ecb8866-4410-aff2-8a56-e1bdd3d1a83a': { bundle: 'wardenLaunch' },
  'd3a923ca-406c-0eaf-c635-78981fc2bde4': { bundle: 'wardenLaunch' },
  '1fcebda8-477c-3f29-c70d-11a43f2fbce7': { bundle: 'wardenLaunch' }
};

const TYPE_LABELS = {
  skin: 'สกินปืน',
  buddy: 'พวงกุญแจ',
  card: 'การ์ดผู้เล่น',
  spray: 'สเปรย์',
  title: 'ฉายา',
  item: 'ไอเทม'
};

// -> { name, itemType, bundle } or null
function getItemOverride(uuid, itemType) {
  const entry = uuid && ITEMS[uuid.toLowerCase()];
  if (!entry) return null;
  const bundle = BUNDLES[entry.bundle] || null;
  const type = entry.type || itemType || 'item';
  const name = entry.name || `${bundle ? bundle.name + ' ' : ''}${TYPE_LABELS[type] || TYPE_LABELS.item}`;
  return { name, itemType: type, bundle };
}

// Bundle metadata inferred from its items (first override hit wins)
function getBundleOverride(itemUuids) {
  for (const id of itemUuids || []) {
    const entry = id && ITEMS[id.toLowerCase()];
    if (entry && BUNDLES[entry.bundle]) return BUNDLES[entry.bundle];
  }
  return null;
}

module.exports = { getItemOverride, getBundleOverride };
