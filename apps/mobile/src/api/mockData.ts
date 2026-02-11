import { Script, Comment, Genre } from '../types';

export const MOCK_SCRIPTS: Script[] = [
  {
    scriptId: '1',
    title: 'The Last Sunset',
    logline: 'A retired astronaut must return to space one final time to save Earth from an approaching asteroid.',
    synopsis: 'When NASA discovers a massive asteroid heading towards Earth, they realize their only hope lies with Commander Sarah Chen, a retired astronaut haunted by a tragic mission that ended her career. Reluctantly, she agrees to lead one final mission, assembling a crew of young astronauts who must learn to trust her unconventional methods. As they journey towards the asteroid, Sarah must confront her past demons while teaching her crew that sometimes the greatest victories come from our deepest failures.',
    genre: 'Sci-Fi',
    language: 'English',
    pageCount: 24,
    scriptFileS3Key: 'scripts/1/the-last-sunset.pdf',
    copyright: {
      hasCertificate: true,
      certificateNumber: 'L-78945/2024',
    },
    writer: {
      name: 'Rahul Sharma',
      mobile: '+910000000001',
      mobileVerified: true,
    },
    payment: {
      orderId: 'ORD_001',
      paymentId: 'PAY_001',
      amount: 9900,
      status: 'PAID',
    },
    status: 'PUBLISHED',
    likeCount: 156,
    dislikeCount: 12,
    commentCount: 23,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    scriptId: '2',
    title: 'Mumbai Dreams',
    logline: 'Three strangers from different walks of life find their fates intertwined during one chaotic night in Mumbai.',
    synopsis: 'On the night of Diwali, a struggling street food vendor, an ambitious corporate lawyer, and a retired Bollywood actress find themselves stranded together when the city comes to a standstill. As fireworks light up the sky, they share their stories, fears, and dreams, discovering that despite their different backgrounds, they all seek the same thing: a sense of belonging in a city of millions.',
    genre: 'Drama',
    language: 'Hindi',
    pageCount: 22,
    scriptFileS3Key: 'scripts/2/mumbai-dreams.pdf',
    copyright: {
      hasCertificate: false,
    },
    writer: {
      name: 'Priya Patel',
      mobile: '+910000000002',
      mobileVerified: true,
    },
    payment: {
      orderId: 'ORD_002',
      paymentId: 'PAY_002',
      amount: 9900,
      status: 'PAID',
    },
    status: 'PUBLISHED',
    likeCount: 89,
    dislikeCount: 5,
    commentCount: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    scriptId: '3',
    title: 'The Silent Witness',
    logline: 'A deaf forensic artist must solve a series of murders using only visual clues that others have missed.',
    synopsis: 'Maya Verma lost her hearing in a childhood accident, but gained an extraordinary ability to observe details others miss. Working as a forensic sketch artist for the Delhi Police, she stumbles upon a pattern connecting several unsolved cases. When her discoveries put her in the crosshairs of a dangerous killer, Maya must use her unique perspective to stay one step ahead while uncovering a conspiracy that reaches the highest levels of power.',
    genre: 'Thriller',
    language: 'Hindi',
    pageCount: 25,
    scriptFileS3Key: 'scripts/3/silent-witness.pdf',
    copyright: {
      hasCertificate: true,
      certificateNumber: 'L-12345/2024',
    },
    writer: {
      name: 'Vikram Malhotra',
      mobile: '+910000000003',
      mobileVerified: true,
    },
    payment: {
      orderId: 'ORD_003',
      paymentId: 'PAY_003',
      amount: 9900,
      status: 'PAID',
    },
    status: 'PUBLISHED',
    likeCount: 234,
    dislikeCount: 18,
    commentCount: 45,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    scriptId: '4',
    title: 'Love in the Time of Lockdown',
    logline: 'Two neighbors who never spoke fall in love through their balconies during a city-wide lockdown.',
    synopsis: 'Arjun, a introverted software developer, and Meera, a free-spirited yoga instructor, have lived in adjacent apartments for two years without ever meeting. When a sudden lockdown confines everyone to their homes, they begin communicating through handwritten notes, balcony conversations, and creative gestures. As days turn into weeks, their unusual courtship blossoms into something neither expected, proving that love can find a way even when the world stands still.',
    genre: 'Romance',
    language: 'Hindi',
    pageCount: 20,
    scriptFileS3Key: 'scripts/4/lockdown-love.pdf',
    copyright: {
      hasCertificate: false,
    },
    writer: {
      name: 'Ananya Krishnan',
      mobile: '+910000000004',
      mobileVerified: true,
    },
    payment: {
      orderId: 'ORD_004',
      paymentId: 'PAY_004',
      amount: 9900,
      status: 'PAID',
    },
    status: 'PUBLISHED',
    likeCount: 312,
    dislikeCount: 8,
    commentCount: 67,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    scriptId: '5',
    title: 'The Comedy Club',
    logline: 'A failed banker discovers his true calling as a stand-up comedian at age 50.',
    synopsis: 'After being laid off from his corporate job, 50-year-old Suresh Iyer stumbles into an open mic night and discovers he has a gift for making people laugh. Against the wishes of his traditional family and the skepticism of young comedians half his age, Suresh pursues his unlikely dream. Along the way, he learns that it\'s never too late to reinvent yourself, and that the best jokes come from life\'s biggest failures.',
    genre: 'Comedy',
    language: 'English',
    pageCount: 18,
    scriptFileS3Key: 'scripts/5/comedy-club.pdf',
    copyright: {
      hasCertificate: true,
      certificateNumber: 'L-99887/2024',
    },
    writer: {
      name: 'Deepak Menon',
      mobile: '+910000000005',
      mobileVerified: true,
    },
    payment: {
      orderId: 'ORD_005',
      paymentId: 'PAY_005',
      amount: 9900,
      status: 'PAID',
    },
    status: 'PUBLISHED',
    likeCount: 178,
    dislikeCount: 22,
    commentCount: 34,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    scriptId: '1',
    commentId: 'c1',
    commenterName: 'Amit Kumar',
    commentText: 'Amazing concept! The emotional depth of the protagonist is beautifully crafted.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    scriptId: '1',
    commentId: 'c2',
    commenterName: 'Sneha Reddy',
    commentText: 'Would love to see this made into a film. The space sequences sound visually stunning!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    scriptId: '1',
    commentId: 'c3',
    commenterName: 'Film Enthusiast',
    commentText: 'Great screenplay structure. The three-act format is perfectly balanced.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    scriptId: '3',
    commentId: 'c4',
    commenterName: 'Mystery Lover',
    commentText: 'The twist at the end caught me completely off guard. Brilliant writing!',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    scriptId: '3',
    commentId: 'c5',
    commenterName: 'Ravi Shankar',
    commentText: 'As someone from the deaf community, I appreciate the authentic representation.',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Get scripts with optional genre filter
export function getMockScripts(genre?: Genre): Script[] {
  if (genre) {
    return MOCK_SCRIPTS.filter((s) => s.genre === genre);
  }
  return MOCK_SCRIPTS;
}

// Get script by ID
export function getMockScriptById(scriptId: string): Script | undefined {
  return MOCK_SCRIPTS.find((s) => s.scriptId === scriptId);
}

// Get comments for a script
export function getMockComments(scriptId: string): Comment[] {
  return MOCK_COMMENTS.filter((c) => c.scriptId === scriptId);
}
