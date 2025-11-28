import { Material, MaterialType, User, UserRole, FormTemplate } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Researcher', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/id/1/200/200' },
  { id: 'u2', name: 'Bob Subject', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/id/2/200/200' },
  { id: 'admin1', name: 'Dr. Admin', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/id/3/200/200' },
];

export const MOCK_MATERIALS: Material[] = [
  {
    id: 'm1',
    title: 'Cognitive Science Basics',
    author: 'J. Smith',
    type: MaterialType.TEXT,
    coverUrl: 'https://picsum.photos/id/20/300/450',
    assignedToUserIds: ['u1', 'u2'],
    content: `Cognitive science is the interdisciplinary, scientific study of the mind and its processes. It examines the nature, the tasks, and the functions of cognition (in a broad sense). Cognitive scientists study intelligence and behavior, with a focus on how nervous systems represent, process, and transform information. Mental faculties of concern to cognitive scientists include language, perception, memory, attention, reasoning, and emotion; to understand these faculties, cognitive scientists borrow from fields such as linguistics, psychology, artificial intelligence, philosophy, neuroscience, and anthropology.

    The typical analysis of cognitive science spans many levels of organization, from learning and decision to logic and planning; from neural circuitry to modular brain organization. One of the fundamental concepts of cognitive science is that "thinking can best be understood in terms of representational structures in the mind and computational procedures that operate on those structures."
    
    (This is a sample text for the reading experiment platform. The user can scroll, select text, and ask AI questions about this content.)`
  },
  {
    id: 'm2',
    title: 'Ocean Life Documentary',
    author: 'Nature Channel',
    type: MaterialType.VIDEO,
    coverUrl: 'https://picsum.photos/id/40/300/450',
    assignedToUserIds: ['u1'],
    content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // Public sample video
  },
  {
    id: 'm3',
    title: 'The Future of AI',
    author: 'Tech Weekly',
    type: MaterialType.HTML,
    coverUrl: 'https://picsum.photos/id/60/300/450',
    assignedToUserIds: ['u2'],
    content: `
      <article class="prose lg:prose-xl">
        <h1>The Future of Artificial Intelligence</h1>
        <p>Artificial intelligence (AI) is rapidly transforming industries, healthcare, and daily life. As machine learning models become more sophisticated, the potential for both positive impact and ethical challenges grows.</p>
        <h2>Key Areas of Development</h2>
        <ul>
          <li><strong>Generative AI:</strong> Creating new content, code, and art.</li>
          <li><strong>Healthcare:</strong> Predicting diseases and personalizing treatment.</li>
          <li><strong>Robotics:</strong> Automating physical tasks in complex environments.</li>
        </ul>
        <blockquote>"The question is not whether machines will think, but whether men will do." - B.F. Skinner</blockquote>
      </article>
    `
  },
  {
    id: 'm4',
    title: 'Ambient Sounds',
    author: 'Relaxation Labs',
    type: MaterialType.AUDIO,
    coverUrl: 'https://picsum.photos/id/80/300/450',
    assignedToUserIds: ['u1', 'u2'],
    content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Public sample audio
  }
];

export const MOCK_FORMS: FormTemplate[] = [
  {
    id: 'f1',
    title: 'Research Consent Form',
    type: 'CONSENT',
    content: 'By participating in this study, you agree to have your reading behavior and eye movements monitored. Your data will be anonymized and used solely for academic research purposes.',
    createdAt: Date.now()
  },
  {
    id: 'f2',
    title: 'Post-Experiment Survey',
    type: 'QUESTIONNAIRE',
    content: 'Please answer the following questions regarding your experience with the reading materials.',
    questions: [
      'How difficult did you find the text?',
      'Did you feel fatigued during the session?',
      'On a scale of 1-5, how interesting was the topic?'
    ],
    createdAt: Date.now() - 1000000
  }
];