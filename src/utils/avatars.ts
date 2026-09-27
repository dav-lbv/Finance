// Collection d'avatars caricatures d'animaux vectoriels (SVG haute définition en data URI)
// Style moderne d'applications fintech/web3 : Fond dégradé doux avec caricatures expressives

const createSvgAvatar = (bgGradient: [string, string], svgContent: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="100%" stop-color="${bgGradient[1]}" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#grad)" />
    ${svgContent}
  </svg>`.replace(/\n\s*/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export interface AnimalAvatar {
  id: string;
  name: string;
  url: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  {
    id: 'fox',
    name: 'Renard Rusé',
    url: createSvgAvatar(['#FF6B4A', '#E03D1A'], `
      <!-- Ears -->
      <polygon points="30,22 45,55 18,48" fill="#D32F2F" />
      <polygon points="32,28 42,50 24,47" fill="#FFF" />
      <polygon points="90,22 75,55 102,48" fill="#D32F2F" />
      <polygon points="88,28 78,50 96,47" fill="#FFF" />
      <!-- Head -->
      <polygon points="60,95 20,52 100,52" fill="#FF7043" />
      <!-- Cheeks White -->
      <polygon points="60,95 20,52 42,66" fill="#FFFFFF" />
      <polygon points="60,95 100,52 78,66" fill="#FFFFFF" />
      <!-- Eyes -->
      <circle cx="44" cy="54" r="5" fill="#212121" />
      <circle cx="46" cy="52" r="1.8" fill="#FFFFFF" />
      <circle cx="76" cy="54" r="5" fill="#212121" />
      <circle cx="78" cy="52" r="1.8" fill="#FFFFFF" />
      <!-- Nose -->
      <circle cx="60" cy="85" r="4.5" fill="#212121" />
    `),
  },
  {
    id: 'panda',
    name: 'Panda Zen',
    url: createSvgAvatar(['#37474F', '#263238'], `
      <!-- Ears -->
      <circle cx="32" cy="35" r="14" fill="#212121" />
      <circle cx="88" cy="35" r="14" fill="#212121" />
      <!-- Face -->
      <ellipse cx="60" cy="65" rx="40" ry="34" fill="#FFFFFF" />
      <!-- Eye patches -->
      <ellipse cx="44" cy="60" rx="11" ry="8" fill="#212121" transform="rotate(-15 44 60)" />
      <ellipse cx="76" cy="60" rx="11" ry="8" fill="#212121" transform="rotate(15 76 60)" />
      <!-- Eyes -->
      <circle cx="44" cy="60" r="3.5" fill="#FFFFFF" />
      <circle cx="44" cy="60" r="2" fill="#212121" />
      <circle cx="76" cy="60" r="3.5" fill="#FFFFFF" />
      <circle cx="76" cy="60" r="2" fill="#212121" />
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="74" rx="6" ry="4" fill="#212121" />
      <path d="M56,79 Q60,83 64,79" stroke="#212121" stroke-width="2" fill="none" stroke-linecap="round" />
    `),
  },
  {
    id: 'lion',
    name: 'Lion Majestueux',
    url: createSvgAvatar(['#FFA000', '#FF6F00'], `
      <!-- Mane -->
      <circle cx="60" cy="60" r="44" fill="#B26A00" />
      <!-- Face -->
      <circle cx="60" cy="64" r="30" fill="#FFC107" />
      <!-- Ears -->
      <circle cx="36" cy="40" r="9" fill="#B26A00" />
      <circle cx="36" cy="40" r="5" fill="#FFE082" />
      <circle cx="84" cy="40" r="9" fill="#B26A00" />
      <circle cx="84" cy="40" r="5" fill="#FFE082" />
      <!-- Eyes -->
      <ellipse cx="48" cy="60" rx="4" ry="5" fill="#212121" />
      <circle cx="49" cy="58" r="1.5" fill="#FFF" />
      <ellipse cx="72" cy="60" rx="4" ry="5" fill="#212121" />
      <circle cx="73" cy="58" r="1.5" fill="#FFF" />
      <!-- Snout -->
      <ellipse cx="60" cy="73" rx="14" ry="9" fill="#FFF8E1" />
      <polygon points="54,69 66,69 60,76" fill="#8D4004" />
      <path d="M55,79 Q60,83 65,79" stroke="#8D4004" stroke-width="2" fill="none" stroke-linecap="round" />
    `),
  },
  {
    id: 'owl',
    name: 'Chouette Sage',
    url: createSvgAvatar(['#4A148C', '#311B92'], `
      <!-- Tuft Ears -->
      <polygon points="34,22 45,46 25,40" fill="#7E57C2" />
      <polygon points="86,22 75,46 95,40" fill="#7E57C2" />
      <!-- Body -->
      <ellipse cx="60" cy="65" rx="38" ry="36" fill="#9575CD" />
      <!-- Belly -->
      <ellipse cx="60" cy="74" rx="24" ry="22" fill="#D1C4E9" />
      <!-- Eye rings -->
      <circle cx="44" cy="56" r="15" fill="#FFFFFF" />
      <circle cx="76" cy="56" r="15" fill="#FFFFFF" />
      <!-- Pupils -->
      <circle cx="44" cy="56" r="7" fill="#FFB300" />
      <circle cx="44" cy="56" r="4" fill="#212121" />
      <circle cx="46" cy="54" r="1.5" fill="#FFFFFF" />
      <circle cx="76" cy="56" r="7" fill="#FFB300" />
      <circle cx="76" cy="56" r="4" fill="#212121" />
      <circle cx="78" cy="54" r="1.5" fill="#FFFFFF" />
      <!-- Beak -->
      <polygon points="60,63 54,73 66,73" fill="#FF8F00" />
    `),
  },
  {
    id: 'bear',
    name: 'Ours Prévoyant',
    url: createSvgAvatar(['#4E342E', '#3E2723'], `
      <!-- Ears -->
      <circle cx="34" cy="36" r="12" fill="#6D4C41" />
      <circle cx="34" cy="36" r="6" fill="#D7CCC8" />
      <circle cx="86" cy="36" r="12" fill="#6D4C41" />
      <circle cx="86" cy="36" r="6" fill="#D7CCC8" />
      <!-- Head -->
      <circle cx="60" cy="64" r="36" fill="#795548" />
      <!-- Muzzle -->
      <ellipse cx="60" cy="74" rx="18" ry="14" fill="#D7CCC8" />
      <!-- Nose & Mouth -->
      <ellipse cx="60" cy="70" rx="7" ry="5" fill="#212121" />
      <path d="M55,78 Q60,82 65,78" stroke="#212121" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- Eyes -->
      <circle cx="46" cy="57" r="4" fill="#212121" />
      <circle cx="47" cy="55" r="1.5" fill="#FFF" />
      <circle cx="74" cy="57" r="4" fill="#212121" />
      <circle cx="75" cy="55" r="1.5" fill="#FFF" />
    `),
  },
  {
    id: 'cat',
    name: 'Chat Stratège',
    url: createSvgAvatar(['#00897B', '#004D40'], `
      <!-- Ears -->
      <polygon points="26,24 45,52 18,48" fill="#4DB6AC" />
      <polygon points="28,29 42,49 23,46" fill="#FF80AB" />
      <polygon points="94,24 75,52 102,48" fill="#4DB6AC" />
      <polygon points="92,29 78,49 97,46" fill="#FF80AB" />
      <!-- Head -->
      <ellipse cx="60" cy="64" rx="38" ry="32" fill="#80CBC4" />
      <!-- Eyes -->
      <ellipse cx="44" cy="58" rx="6" ry="8" fill="#FFD54F" />
      <ellipse cx="44" cy="58" rx="2" ry="7" fill="#004D40" />
      <ellipse cx="76" cy="58" rx="6" ry="8" fill="#FFD54F" />
      <ellipse cx="76" cy="58" rx="2" ry="7" fill="#004D40" />
      <!-- Nose -->
      <polygon points="57,68 63,68 60,72" fill="#E91E63" />
      <path d="M55,75 Q60,78 65,75" stroke="#004D40" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <!-- Whiskers -->
      <line x1="28" y1="68" x2="14" y2="65" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
      <line x1="28" y1="73" x2="14" y2="76" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
      <line x1="92" y1="68" x2="106" y2="65" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
      <line x1="92" y1="73" x2="106" y2="76" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" />
    `),
  },
  {
    id: 'koala',
    name: 'Koala Économe',
    url: createSvgAvatar(['#546E7A', '#37474F'], `
      <!-- Big Fuzzy Ears -->
      <circle cx="28" cy="38" r="16" fill="#78909C" />
      <circle cx="28" cy="38" r="10" fill="#CFD8DC" />
      <circle cx="92" cy="38" r="16" fill="#78909C" />
      <circle cx="92" cy="38" r="10" fill="#CFD8DC" />
      <!-- Face -->
      <ellipse cx="60" cy="65" rx="38" ry="32" fill="#B0BEC5" />
      <!-- Eyes -->
      <circle cx="43" cy="58" r="4.5" fill="#212121" />
      <circle cx="44" cy="56" r="1.5" fill="#FFF" />
      <circle cx="77" cy="58" r="4.5" fill="#212121" />
      <circle cx="78" cy="56" r="1.5" fill="#FFF" />
      <!-- Big Koala Nose -->
      <ellipse cx="60" cy="69" rx="10" ry="15" fill="#263238" />
    `),
  },
  {
    id: 'tiger',
    name: 'Tigre Leader',
    url: createSvgAvatar(['#E65100', '#BF360C'], `
      <!-- Ears -->
      <circle cx="34" cy="36" r="11" fill="#FB8C00" />
      <circle cx="34" cy="36" r="6" fill="#FFFFFF" />
      <circle cx="86" cy="36" r="11" fill="#FB8C00" />
      <circle cx="86" cy="36" r="6" fill="#FFFFFF" />
      <!-- Head -->
      <ellipse cx="60" cy="64" rx="38" ry="33" fill="#FFA726" />
      <!-- Tiger Stripes -->
      <polygon points="60,34 56,44 64,44" fill="#212121" />
      <polygon points="50,38 46,47 54,45" fill="#212121" />
      <polygon points="70,38 66,45 74,47" fill="#212121" />
      <!-- Eyes -->
      <ellipse cx="44" cy="59" rx="5" ry="5.5" fill="#212121" />
      <circle cx="46" cy="57" r="1.5" fill="#FFF" />
      <ellipse cx="76" cy="59" rx="5" ry="5.5" fill="#212121" />
      <circle cx="78" cy="57" r="1.5" fill="#FFF" />
      <!-- Muzzle -->
      <ellipse cx="60" cy="73" rx="15" ry="10" fill="#FFFFFF" />
      <polygon points="56,69 64,69 60,74" fill="#D84315" />
      <path d="M55,79 Q60,83 65,79" stroke="#212121" stroke-width="2" fill="none" stroke-linecap="round" />
    `),
  },
];

export const DEFAULT_AVATAR = ANIMAL_AVATARS[0].url;
