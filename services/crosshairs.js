/**
 * Valorant Pro Player Crosshairs Database & Parser
 * Verified in-game crosshair codes and team metadata
 */

const PRO_CROSSHAIRS = [
  {
    id: 'tenz',
    player: 'TenZ',
    realName: 'Tyson Ngo',
    team: 'Sentinels',
    teamLogo: 'SEN',
    role: 'Duelist / Controller',
    category: 'sentinels',
    style: 'Classic 1-3-2-2',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;s;1;P;c;5;h;0;m;1;0t;1;0l;3;0v;3;0g;1;0o;2;0a;1;0f;0;1b;0;S;c;5;s;0.8;o;1',
    description: 'เป้าเล็งประจำตัวของ TenZ เส้นบาง คมชัด ยิง Headshot แม่นยำทุกระยะ'
  },
  {
    id: 'aspas',
    player: 'Aspas',
    realName: 'Erick Santos',
    team: 'Leviatán',
    teamLogo: 'LEV',
    role: 'Duelist',
    category: 'americas',
    style: 'Clean Cyan Dot / Tight',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;P;c;5;o;1;d;1;z;3;f;0;0b;0;1b;0',
    description: 'เป้า Dot ของ Aspas ราชา Duelist อันดับ 1 ของโลก เหมาะสำหรับมือยิงแตะหัว'
  },
  {
    id: 'jinggg',
    player: 'Jinggg',
    realName: 'Wang Jing Jie',
    team: 'Paper Rex',
    teamLogo: 'PRX',
    role: 'Duelist (Raze God)',
    category: 'paper-rex',
    style: 'Box Cross 1-4-0-0',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;s;1;P;c;5;h;0;0l;4;0v;4;0o;0;0a;1;0f;0;1b;0;S;c;5;s;0.8',
    description: 'เป้าเล็งประจำตัวของ Jinggg ขวัญใจสายบุก ว่องไว เห็นชัดเจนกลางจอ'
  },
  {
    id: 'f0rsaken',
    player: 'f0rsakeN',
    realName: 'Jason Susanto',
    team: 'Paper Rex',
    teamLogo: 'PRX',
    role: 'Flex / Duelist',
    category: 'paper-rex',
    style: 'Tight Box Dot',
    colorName: 'Black Outlined White',
    colorHex: '#FFFFFF',
    code: '0;s;1;P;o;1;0t;1;0l;1;0o;1;0a;1;0f;0;1b;0;S;c;0',
    description: 'เป้าเล็งกะทัดรัดของ f0rsakeN ช่วยให้โฟกัสตำแหน่งกลางจอได้รวดเร็ว'
  },
  {
    id: 'zmjjkk',
    player: 'ZmjjKK (KangKang)',
    realName: 'Zheng Yongkang',
    team: 'EDward Gaming',
    teamLogo: 'EDG',
    role: 'Duelist / Operator God (Champions 2024 MVP)',
    category: 'champions',
    style: 'Yellow Dynamic 1-3-2-2',
    colorName: 'Yellow',
    colorHex: '#FFFF00',
    code: '0;p;0;s;1;P;c;7;u;000000FF;h;0;f;0;0l;3;0v;3;0g;1;0o;2;0a;1;0f;0;1b;0;A;c;7;u;000000FF;h;0;f;0;0s;0;0l;4;0v;4;0g;1;0o;2;0a;1;0f;0;1b;0;S;c;5;s;0.8',
    description: 'เป้าเล็งของ ZmjjKK แชมป์โลก VCT Champions 2024 ชัดเจนทั้งสะบัดและสไนเปอร์'
  },
  {
    id: 'demon1',
    player: 'Demon1',
    realName: 'Max Mazanov',
    team: 'NRG Esports',
    teamLogo: 'NRG',
    role: 'Duelist / Jett (Champions 2023 MVP)',
    category: 'champions',
    style: 'Minimal White Dot',
    colorName: 'White',
    colorHex: '#FFFFFF',
    code: '0;s;1;P;o;1;d;1;m;1;0b;0;1b;0',
    description: 'เป้า Dot สีขาว คมกริบ สไตล์ Demon1 เจ้าของ Headshot Rate สูงที่สุดในประวัติศาสตร์'
  },
  {
    id: 'boaster',
    player: 'Boaster',
    realName: 'Jake Howlett',
    team: 'Fnatic',
    teamLogo: 'FNC',
    role: 'IGL / Controller',
    category: 'fnatic',
    style: 'Green Dot',
    colorName: 'Green',
    colorHex: '#00FF00',
    code: '0;s;1;P;c;1;o;1;d;1;0b;0;1b;0',
    description: 'เป้า Dot สีเขียวสุดคลาสสิกของ Boaster กัปตันทีม Fnatic'
  },
  {
    id: 'chronicle',
    player: 'Chronicle',
    realName: 'Timofey Khromov',
    team: 'Fnatic',
    teamLogo: 'FNC',
    role: 'Initiator / Flex (3x International Trophy)',
    category: 'fnatic',
    style: 'Yellow Cross 1-3-2-2',
    colorName: 'Yellow',
    colorHex: '#FFFF00',
    code: '0;P;c;7;o;1;f;0;0t;1;0l;3;0v;3;0g;1;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้าสีเหลืองมีขอบของ Chronicle ผู้คว้าแชมป์ระดับนานาชาติมากที่สุด'
  },
  {
    id: 'yay',
    player: 'yay (El Diablo)',
    realName: 'Jaccob Whiteaker',
    team: 'Bleed Esports',
    teamLogo: 'BLD',
    role: 'Chamber / Sentinel / Duelist',
    category: 'americas',
    style: 'Solid White Cross 1-4-0-0',
    colorName: 'White',
    colorHex: '#FFFFFF',
    code: '0;P;h;0;f;0;0l;4;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้ากากบาทสีขาวในตำนานของ El Diablo นิ่งและคงที่ทุกการลากหัว'
  },
  {
    id: 'sscary',
    player: 'sScary',
    realName: 'Nutchapon Matarat',
    team: 'Bleed / Thai Pro',
    teamLogo: 'TH',
    role: 'Controller God',
    category: 'thai-pros',
    style: 'Cyan Cross 1-4-2-0',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;P;c;5;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้าเล็งประจำตัวของ sScary ผู้เล่น Controller ระดับท็อปของประเทศไทยและเอเชีย'
  },
  {
    id: 'patiphan',
    player: 'Patiphan',
    realName: 'Patiphan Chaiwong',
    team: 'Talon Esports',
    teamLogo: 'TLN',
    role: 'Duelist / Flex',
    category: 'thai-pros',
    style: 'Green Cross 1-4-2-0',
    colorName: 'Green',
    colorHex: '#00FF00',
    code: '0;P;c;1;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0',
    description: 'เป้าเล็งของ Patiphan ซูเปอร์สตาร์อีสปอร์ตไทย ความแม่นยำสูงในจังหวะดวลเดี่ยว'
  },
  {
    id: 'primmie',
    player: 'Primmie',
    realName: 'Papaphat Sriprapha',
    team: 'Talon Esports',
    teamLogo: 'TLN',
    role: 'Duelist Prodigy (Rank 1 APAC)',
    category: 'thai-pros',
    style: 'Cyan Dot 1-2-1-1',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;P;c;5;h;0;0l;2;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้าเล็งของ Primmie ดาวรุ่งอันดับ 1 เซิร์ฟเวอร์เอเชียแปซิฟิก (Rank 1 APAC)'
  },
  {
    id: 'derke',
    player: 'Derke',
    realName: 'Nikita Sirmitev',
    team: 'Fnatic',
    teamLogo: 'FNC',
    role: 'Duelist',
    category: 'fnatic',
    style: 'Small Dot with Inner Line',
    colorName: 'White',
    colorHex: '#FFFFFF',
    code: '0;s;1;P;o;1;d;1;f;0;s;0;0b;0;1t;0;1l;1;1o;0;1a;1;1m;0;1f;0;S;o;1',
    description: 'เป้าเล็งประจำตัวของ Derke ดวลระยะประชิดและกลางได้แม่นยำมาก'
  },
  {
    id: 'smoggy',
    player: 'Smoggy',
    realName: 'Zhao Hang',
    team: 'EDward Gaming',
    teamLogo: 'EDG',
    role: 'Controller / Flex',
    category: 'champions',
    style: 'Cyan Micro Dot',
    colorName: 'Cyan',
    colorHex: '#00FFFF',
    code: '0;P;c;5;o;1;d;1;z;1;f;0;0b;0;1b;0',
    description: 'เป้า Dot ขนาดเล็กของ Smoggy ผู้เล่นคนสำคัญของ EDG แชมป์โลก 2024'
  },
  {
    id: 'cned',
    player: 'cNed',
    realName: 'Mehmet Yağız İpek',
    team: 'FUT Esports',
    teamLogo: 'FUT',
    role: 'Duelist / Jett',
    category: 'emea',
    style: 'Yellow Box 1-4-0-0',
    colorName: 'Yellow',
    colorHex: '#FFFF00',
    code: '0;P;c;7;h;0;f;0;0l;4;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้าสีเหลืองสว่างของ cNed แชมป์โลก Champions 2021'
  },
  {
    id: 'cryocells',
    player: 'Cryocells',
    realName: 'Matthew Panganiban',
    team: '100 Thieves',
    teamLogo: '100T',
    role: 'Duelist / Chamber',
    category: 'americas',
    style: 'White 1-4-0-0',
    colorName: 'White',
    colorHex: '#FFFFFF',
    code: '0;P;h;0;0l;4;0o;0;0a;1;0f;0;1b;0',
    description: 'เป้ามาตรฐานสีขาวของ Cryocells คมกริบสำหรับผู้เล่นสไตล์ Tap Shot'
  }
];

function getAllCrosshairs(filterCategory = '', searchQuery = '') {
  let list = PRO_CROSSHAIRS;
  if (filterCategory && filterCategory !== 'all') {
    list = list.filter(c => c.category === filterCategory);
  }
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(c => 
      c.player.toLowerCase().includes(q) ||
      c.team.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.style.toLowerCase().includes(q)
    );
  }
  return list;
}

module.exports = {
  PRO_CROSSHAIRS,
  getAllCrosshairs
};
