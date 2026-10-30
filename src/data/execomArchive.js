// Single source of truth for the Execom archive (/teams): past committee
// batches grouped by academic year. Each batch currently shows only its
// group photo — the photo slot is a placeholder until real images land.

import Group202526 from '../assets/execom/group-2025-26.webp';
import Group202526Sm from '../assets/execom/group-2025-26-1200.webp';
import Group202425 from '../assets/execom/group-2024-25.webp';
import Group202425Sm from '../assets/execom/group-2024-25-1200.webp';

export const execomArchive = [
  {
    year: '2025-26',
    title: 'Execom 2025–2026',
    groupSub: 'AGM 2026 Group Photo',
    photo: Group202526,
    photoSmall: Group202526Sm,
  },
  {
    year: '2024-25',
    photo: Group202425,
    photoSmall: Group202425Sm,
    title: 'Execom 2024–2025',
    groupSub: 'AGM 2025 Group Photo',
  },
];
