/* ==========================================================================
   PORTFOLIO CONTENT DATA
   --------------------------------------------------------------------------
   Everything you see on the website is generated from the object below.
   You should not need to touch index.html, style.css, or the other JS
   files just to update your information — edit the values here instead.

   Each top-level section is clearly marked. Image paths point to
   /assets/images/... — replace those files with your own and keep the
   same filenames, or change the path string to match a new filename.

   NOTE: sections below are marked "EDIT ... HERE" — these are the same
   thing as "CUSTOMIZE:" comments used elsewhere in this project. Both
   mean: this is a part of the code meant for you to change.
   ========================================================================== */

// ==========================================
// HEADER CONTENT MENU
// ADD / REMOVE / RENAME MENU ITEMS HERE
// --------------------------------------------------------------------------
// Powers the dropdown that opens under the header's "Content" button.
// "target" must match a section id in index.html exactly (no "#").
// Reorder, rename, add, or remove items freely — the dropdown and its
// active-section highlighting are both generated from this array.
// ==========================================
const navigationItems = [
  { number: "01", label: "Education", target: "education" },
  { number: "02", label: "Experience", target: "experience" },
  { number: "03", label: "Skills", target: "skills" },
  { number: "04", label: "Projects", target: "projects" },
  { number: "05", label: "Creative Works", target: "creative-works" }
];

const portfolioData = {

  // ==============================
  // PERSONAL INFORMATION
  // EDIT YOUR INFORMATION HERE
  // ==============================
  personal: {
    name: "Anghela Aliza",
    logoShort: "AA",                 // shown in the header on the left
    roles: ["BSIT Student", "Artist"],
    kicker: "Portfolio — 2026",
    heroDescription:
      "Welcome, chooms! 👋 Welcome to my personal portfolio. Learn more about me, explore my work, and feel free to ask my companion, Charlie, anything about me—well, anything except my secrets, of course!",
    aboutLead: "Anghela Aliza Magaling",
    aboutBody: [
      "I’m an Information Technology student interested in development, UI/UX design, creative technology, and interactive digital experiences. I enjoy working on projects where technology and design come together to create something both functional and visually engaging.",
      "Outside of coursework, I spend time sketching, exploring digital art, experimenting with interface designs, and learning new technologies to expand my technical and creative skills."
    ],
    quickInfo: [
      { label: "Based in", value: "Philippines" },
      { label: "Field", value: "Information Technology" },
      { label: "Focus", value: "UI/UX, Development, Creative Tech, multimedia" }
    ],
    profileImage: "assets/images/profile.png",
    heroBackground: "assets/images/coverpg.png",
    resume: "assets/documents/ALIZA_ANGHELA_CV.pdf",
    email: "alizaanghela004@gmail.com",
    socials: [
      { label: "GitHub", url: "https://github.com/Charlieshima1404", icon: "github" },
    ]
  },

  // ==============================
  // EDUCATION
  // EDIT YOUR EDUCATION HERE
  // Add or remove objects from this array — the timeline renders
  // automatically in the order you list them.
  // ==============================
  educationBackground: "assets/images/BG3RD.png",
  education: [
    {
      year: "2023 – Present ",
      degree: "Bachelor of Science in Information Technology",
      school: "Philippine Christian University",
      description:
        "Dean’s Lister (2023 – 2026)"
    },
    {
      year: "2021 – 2023",
      degree: "Senior High School —  Accountancy, Business, and Management",
      school: "Paco Catholic School",
      description:
        "Graduated With Honors (2023)"
    }
  ],

  // ==============================
  // EXPERIENCE
  // EDIT YOUR EXPERIENCE HERE
  // Leave this array empty ( [] ) if you have no experience yet —
  // the section will still display cleanly.
  // ==============================
  experience: [
    {
      role: "Creative Media Intern ",
      company: "Philippine Christian University",
      year: "2026",
      description:
        "Supported the university’s multimedia and digital initiatives by developing creative media, assisting promotional activities, and collaborating with the institution’s development team.",
      responsibilities: [
        "Created advertising and promotional materials for the university",
        "Collaborated with the senior developer on the university website",
        "Assisted with photography and other multimedia activities",
        "Supported the production of creative content for university events"
      ],
    }
  ],

  // ==============================
  // SKILLS
  // EDIT YOUR SKILLS HERE
  // Grouped by category — add/remove categories or tags freely.
  // ==============================

  skillsBackground: "assets/images/BG2ND.png",
  skills: [
    
    { category: "Programming Languages", tags: ["HTML", "CSS", "JavaScript", "Java", "C#", "C++","MySQL", "SQL Server"] },
    { category: "Soft Skills", tags: ["Critical Thinking", "Collaboration", " Strong Work Ethic", "Adaptability", "Time Management"] },
    { category: "Core Competencies", tags: ["Web Development", "UI/UX Design"] },
    { category: "Software & Tools", tags: ["Visual Studio", "Figma", "Canva", "Microsoft Office"," Adobe creative cloud"] }
  ],

  // ==============================
  // PROJECTS
  // EDIT YOUR PROJECTS HERE
  // - "featured: true" on ONE project makes it the large showcase card.
  // - "category" is used by the filter bar — keep values short/consistent.
  // - "images" powers the gallery inside the project modal (2+ recommended).
  // - Add a new project by copying one object below and editing the values.
  // ==============================
 projects: [
  {
    title: "Portfolio Website",
    date: "November 2025",
    category: "Web",
    featured: true,
    thumbnail: "assets/images/projects/portf/portfolio img1.png",
    images: [
      "assets/images/projects/portf/portfolio img1.png",
      "assets/images/projects/portf/portfolio img2.png",
      "assets/images/projects/portf/portfolio img3.png"
    ],
    description: "A responsive personal portfolio website designed and developed to showcase academic projects, technical skills, and UI/UX design work.",
    problem: "Academic projects and creative work needed to be presented in a single, organized, and interactive platform.",
    solution: "Developed a responsive portfolio website that presents projects, skills, and creative work through an interactive and organized interface.",
    role: "UI/UX Designer + Front-end Developer",
    technologies: ["HTML", "CSS", "JavaScript", "Netlify"],
    features: [
      "Responsive portfolio layout",
      "Interactive project presentation",
      "Showcase for academic projects and UI/UX designs"
    ],
    process:
      "Designed the website structure and interface, developed the front end using HTML, CSS, and JavaScript, then deployed the completed website using Netlify.",
    github: "https://github.com/Charlieshima1404/3b2025portfolio",
    demo: "https://anghelabsit3b2025portfolio.netlify.app"
  },

  {
    title: "Software System Design and Architecture Project",
    date: "November 2025",
    category: "Project",
    thumbnail: "assets/images/projects/systemarch/systemarch1.png",
    images: [
      "assets/images/projects/systemarch/systemarch1.png",
      "assets/images/projects/systemarch/systemarch2.png",
      "assets/images/projects/systemarch/systemarch3.png"
    ],
    description: "An academic project focused on analyzing requirements and designing the architecture, database, and user interface of a proposed information system.",
    problem: "A proposed information system required a structured design that clearly defined its requirements, processes, database, and user interface.",
    solution: "Designed the system architecture, database structure, process flows, and user interface based on the identified system requirements.",
    role: "System Designer",
    technologies: ["Figma", "Canva", "UML", "Database Design", "Wireframing"],
    features: [
      "System architecture design",
      "Database schema design",
      "UML diagrams and process flowcharts",
      "UI wireframes and test cases"
    ],
    process:
      "Analyzed system requirements, developed the database and system architecture, created UML diagrams and process flowcharts, designed UI wireframes, and evaluated the proposed system for scalability, security, and performance.",
    PDF: "assets/documents/Software_Design.pdf"
  },

  {
    title: "Cemetery Lot Information System",
    date: "December 2025",
    category: "System",
    thumbnail: "assets/images/projects/clm/clm img1.png",
    images: [
      "assets/images/projects/clm/clm img1.png",
      "assets/images/projects/clm/clm img2.png",
      "assets/images/projects/clm/clm img3.png"
    ],
    description: "An academic group project that developed a system for managing cemetery lot information and related records.",
    problem: "Managing cemetery lot information requires an organized system for storing, accessing, and managing records efficiently.",
    solution: "Developed a system that integrates core information management features with an organized user interface and workflow.",
    role: "Software Developer + UI/UX Designer",
    technologies: ["C#", ".NET Framework", ".NET Core", "Microsoft SQL Server"],
    features: [
      "Cemetery lot information management",
      "Database-driven system",
      "Organized user interface and workflow"
    ],
    process:
      "Collaborated with the development team to develop and integrate core system features while leading the UI/UX design, visual concept, and user flow of the application.",
  },

  {
    title: "Department Store Customer Service System",
    date: "May 2025",
    category: "System",
    thumbnail: "assets/images/projects/NO IMAGE.png",
    images: [
      "assets/images/projects/NO IMAGE.png"
    ],
    description: "An academic group project that developed a Java-based system for managing customer registration, service requests, barcode lookup, and receipts.",
    problem: "Customer service operations require an organized workflow for handling customer information, service requests, and transaction records.",
    solution: "Developed a customer service management system with dedicated modules for registration, barcode lookup, service requests, and receipt generation.",
    role: "Developer + System Planner",
    technologies: ["Java", "Object-Oriented Programming (OOP)"],
    features: [
      "Customer registration",
      "Barcode lookup",
      "Service request management",
      "Receipt module"
    ],
    process:
      "Worked as part of a development team, led the system architecture and workflow design, and developed core modules using object-oriented programming principles.",
    github: "",
    demo: ""
  },

  {
    title: "Infographics",
    date: "May 2025",
    category: "Project",
    thumbnail: "assets/images/projects/INFOGRAPH/BLANKO (10).png",
    images: [
      "assets/images/projects/INFOGRAPH/BLANKO (10).png",
      "assets/images/projects/INFOGRAPH/BLANKO (11).png",
      "assets/images/projects/INFOGRAPH/BLANKO (12).png",
      "assets/images/projects/INFOGRAPH/Data Privacy vs Data Security_aliza.png",
      "assets/images/projects/INFOGRAPH/Privacy Awareness Campaign.png"
    ],
    description: "A visual design project focused on presenting information through clear, organized, and engaging infographic materials.",
    problem: "Complex information can be difficult to understand when presented only through text or unstructured content.",
    solution: "Created visually organized infographic materials that present information in a clear and accessible format.",
    role: "Graphic Designer",
    technologies: ["Canva"],
    features: [
      "Information-focused visual layouts",
      "Organized visual hierarchy",
      "Clear and engaging presentation"
    ],
    process:
      "Planned the content structure, organized the information into visual sections, and developed the infographic layout with emphasis on readability and visual presentation.",
    github: "",
    demo: ""
  }
],

  // ==============================
  // ARTWORKS
  // EDIT YOUR ARTWORKS HERE
  // Add or remove objects freely — the gallery lays itself out
  // automatically no matter how many you add.
  // ==============================
  artworks: [

  {
    title: "SHS Graduation Portrait",
    image: "assets/images/artworks/graduationpic.png",
    year: "2023",
    medium: "Digital Illustration",
    category: "Digital Art",
    description: "A half-portrait created in a Gorillaz-inspired style for SHS graduation. The artwork was printed as keepsakes for classmates, making it both a personal creative project and a memorable part of the graduation experience."
  },

  {
    title: "DOODLELA",
    image: "assets/images/artworks/mascot.png",
    year: "2024",
    medium: "Digital Illustration",
    category: "Character Design",
    description: "A personal brand mascot inspired by childhood drawings and the visual style of Charlie Brown. The character represents a playful and personal approach to illustration and creative identity."
  },
  
{
  title: "JPCS Logo",
  image: "assets/images/artworks/JPCS LOGO.png",
  year: "2024",
  medium: "Logo Design",
  category: "Graphic Design",
  description: "Being chosen by JPCS to create their logo was already an honor, but having my design selected meant even more to me. The process was both meaningful and challenging as I learned to balance their vision and requests with my own creative perspective. Seeing my design become the logo they chose made the experience especially rewarding and gave me greater confidence in my ability to create work that represents others."
},

  {
    title: "2024 WBC Group Poster — Scott Pilgrim Style",
    image: "assets/images/artworks/walang mga braincell vs year 2024 STICKER.png",
    year: "2024",
    medium: "Digital Illustration",
    category: "Digital Art",
    description: "A remake of a group poster featuring friends reimagined as characters inspired by the visual style of Scott Pilgrim. The project combines portrait illustration, character interpretation, and a shared creative concept."
  },

  {
    title: "2022 WBC Group Poster",
    image: "assets/images/artworks/walngbraincell 2022.png",
    year: "2022",
    medium: "Digital Illustration",
    category: "Digital Art",
    description: "My first group poster created for friends, featuring multiple portraits illustrated in my personal art style. This project marked one of my early experiences creating artwork centered around people and shared memories."
  },


  {
    title: "Business Pins",
    image: "assets/images/artworks/PINNS.png",
    year: "2024",
    medium: "Hand-Drawn & Digital Illustration",
    category: "Small Business",
    description: "My first small business, where I design and hand-draw collectible pins inspired by iconic characters as well as completely original designs. Creating and selling these pins gave me an opportunity to express my creativity, develop confidence in my artistic skills, and share my personal style with others."
  }

],
};
