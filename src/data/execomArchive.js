// Single source of truth for the Execom archive (/teams): past committee
// batches grouped by academic year. Member photos are intentionally null —
// real images land later; the page renders initial-avatar placeholders.
// Era tags drive the era-thread filter (FOSS roots → web era → AI era).

export const ERAS = [
  { id: 'all', label: 'All Eras' },
  { id: 'foss', label: 'FOSS Roots' },
  { id: 'web', label: 'Web Era' },
  { id: 'ai', label: 'AI Era' },
];

export const ROLE_FILTERS = [
  { id: 'all', label: 'All Roles' },
  { id: 'chair', label: 'Leadership' },
  { id: 'tech', label: 'Tech' },
  { id: 'design', label: 'Design' },
];

export const execomArchive = [
  {
    year: '2024-25',
    era: 'ai',
    title: 'Execom 2024–2025',
    groupSub: 'College Courtyard Handover & Valedictory',
    members: [
      { name: 'Aditya Krishnan', role: 'Chairperson', category: 'chair', company: 'Microsoft' },
      { name: 'Sneha R Menon', role: 'Vice Chairperson', category: 'chair', company: 'Zoho' },
      { name: 'Karthik Varma', role: 'Secretary', category: 'chair', company: 'Cisco' },
      { name: 'Pooja Nair', role: 'Joint Secretary', category: 'chair', company: 'AWS' },
      { name: 'Farhan K S', role: 'Treasurer', category: 'chair', company: 'Fintech' },
      { name: 'Devika S', role: 'R&D Lead', category: 'tech', company: 'AI Lab' },
      {
        name: 'Sebin Mathew',
        role: 'Project Coordinator',
        category: 'tech',
        company: 'Systems Architect',
      },
      {
        name: 'Aleetta Mariya',
        role: 'Outreach Coordinator',
        category: 'chair',
        company: 'Community Lead',
      },
      { name: 'Steve Jose', role: 'Dev Lead', category: 'tech', company: 'Full Stack' },
      { name: 'Abhirami P', role: 'Design Lead', category: 'design', company: 'Product Design' },
      { name: 'Lisha Jins', role: 'Operations Lead', category: 'chair', company: 'Operations' },
      {
        name: 'Abel S Mathew',
        role: 'Algorithmic Lead',
        category: 'tech',
        company: 'Competitive Coder',
      },
    ],
  },
  {
    year: '2023-24',
    era: 'ai',
    title: 'Execom 2023–2024',
    groupSub: 'Seminar Hall Inauguration',
    members: [
      { name: 'Kiran Prakash', role: 'Chairperson', category: 'chair', company: 'Amazon' },
      { name: 'Meera Nambiar', role: 'Technical Lead', category: 'tech', company: 'Oracle' },
      { name: 'Arjun Das', role: 'Events Coordinator', category: 'chair', company: 'TCS' },
      { name: 'Fathima Zahra', role: 'Design Lead', category: 'design', company: 'Zomato' },
    ],
  },
  {
    year: '2022-23',
    era: 'web',
    title: 'Execom 2022–2023',
    groupSub: 'Web Team Flag-off',
    members: [
      { name: 'Vivek Chandran', role: 'Chairperson', category: 'chair', company: 'Razorpay' },
      { name: 'Ananya S', role: 'Vice Chairperson', category: 'chair', company: 'IIT Madras' },
      { name: 'Rohan Kurian', role: 'Web Lead', category: 'tech', company: 'Freshworks' },
    ],
  },
  {
    year: '2021-22',
    era: 'web',
    title: 'Execom 2021–2022',
    groupSub: 'Virtual Chapter Leadership',
    members: [
      { name: 'Rahul Varma', role: 'Chairperson', category: 'chair', company: 'Uber' },
      { name: 'Anjali Sharma', role: 'Vice Chairperson', category: 'chair', company: 'Razorpay' },
      { name: 'Rohan Nambiar', role: 'Tech Lead', category: 'tech', company: 'Freshworks' },
      { name: 'Kavya Pillai', role: 'Design Lead', category: 'design', company: 'Swiggy' },
      { name: 'Gautam Mohan', role: 'Secretary', category: 'chair', company: 'Postman' },
      { name: 'Divya Nair', role: 'Events Coordinator', category: 'chair', company: 'Walmart' },
    ],
  },
  {
    year: '2017-18',
    era: 'foss',
    title: 'Execom 2017–2018',
    groupSub: '',
    members: [
      { name: 'Manoj Kumar', role: 'Chairperson', category: 'chair', company: 'Startup VP' },
      { name: 'Deepa Joseph', role: 'Secretary', category: 'chair', company: 'IBM Research' },
    ],
  },
  {
    year: '2012',
    era: 'foss',
    title: 'Execom 2012 Archive',
    groupSub: 'CCF Lab 3 Launch Ceremony',
    members: [],
  },
];
