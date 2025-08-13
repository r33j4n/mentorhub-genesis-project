-- Add default expertise areas to the database
INSERT INTO public.expertise_areas (id, name, description) VALUES
-- Programming Languages
(gen_random_uuid(), 'JavaScript', 'JavaScript programming language and ecosystem'),
(gen_random_uuid(), 'Python', 'Python programming language and frameworks'),
(gen_random_uuid(), 'React', 'React.js library and ecosystem'),
(gen_random_uuid(), 'Node.js', 'Node.js runtime and server-side development'),
(gen_random_uuid(), 'TypeScript', 'TypeScript programming language'),
(gen_random_uuid(), 'Java', 'Java programming language and frameworks'),
(gen_random_uuid(), 'C++', 'C++ programming language'),
(gen_random_uuid(), 'C#', 'C# programming language and .NET'),
(gen_random_uuid(), 'Go', 'Go programming language'),
(gen_random_uuid(), 'Rust', 'Rust programming language'),

-- Web Development
(gen_random_uuid(), 'HTML/CSS', 'HTML and CSS web development'),
(gen_random_uuid(), 'Vue.js', 'Vue.js framework'),
(gen_random_uuid(), 'Angular', 'Angular framework'),
(gen_random_uuid(), 'Next.js', 'Next.js React framework'),
(gen_random_uuid(), 'Express.js', 'Express.js web framework'),
(gen_random_uuid(), 'Django', 'Django Python web framework'),
(gen_random_uuid(), 'Flask', 'Flask Python web framework'),
(gen_random_uuid(), 'Spring Boot', 'Spring Boot Java framework'),
(gen_random_uuid(), 'Laravel', 'Laravel PHP framework'),
(gen_random_uuid(), 'ASP.NET', 'ASP.NET framework'),

-- Database & Data
(gen_random_uuid(), 'SQL', 'SQL database management'),
(gen_random_uuid(), 'PostgreSQL', 'PostgreSQL database'),
(gen_random_uuid(), 'MongoDB', 'MongoDB NoSQL database'),
(gen_random_uuid(), 'MySQL', 'MySQL database'),
(gen_random_uuid(), 'Redis', 'Redis in-memory database'),
(gen_random_uuid(), 'Data Science', 'Data science and analytics'),
(gen_random_uuid(), 'Machine Learning', 'Machine learning algorithms and models'),
(gen_random_uuid(), 'Deep Learning', 'Deep learning and neural networks'),
(gen_random_uuid(), 'Data Analysis', 'Data analysis and visualization'),
(gen_random_uuid(), 'Big Data', 'Big data processing and analytics'),

-- Cloud & DevOps
(gen_random_uuid(), 'AWS', 'Amazon Web Services'),
(gen_random_uuid(), 'Azure', 'Microsoft Azure cloud platform'),
(gen_random_uuid(), 'Google Cloud', 'Google Cloud Platform'),
(gen_random_uuid(), 'Docker', 'Docker containerization'),
(gen_random_uuid(), 'Kubernetes', 'Kubernetes orchestration'),
(gen_random_uuid(), 'CI/CD', 'Continuous Integration/Deployment'),
(gen_random_uuid(), 'Terraform', 'Infrastructure as Code with Terraform'),
(gen_random_uuid(), 'Jenkins', 'Jenkins automation server'),
(gen_random_uuid(), 'Git', 'Git version control'),
(gen_random_uuid(), 'Linux', 'Linux system administration'),

-- Mobile Development
(gen_random_uuid(), 'React Native', 'React Native mobile development'),
(gen_random_uuid(), 'Flutter', 'Flutter mobile development'),
(gen_random_uuid(), 'iOS Development', 'iOS app development with Swift'),
(gen_random_uuid(), 'Android Development', 'Android app development'),
(gen_random_uuid(), 'Xamarin', 'Xamarin cross-platform development'),

-- AI & Machine Learning
(gen_random_uuid(), 'TensorFlow', 'TensorFlow machine learning framework'),
(gen_random_uuid(), 'PyTorch', 'PyTorch machine learning framework'),
(gen_random_uuid(), 'Natural Language Processing', 'NLP and text processing'),
(gen_random_uuid(), 'Computer Vision', 'Computer vision and image processing'),
(gen_random_uuid(), 'AI Ethics', 'AI ethics and responsible AI'),

-- Business & Product
(gen_random_uuid(), 'Product Management', 'Product management and strategy'),
(gen_random_uuid(), 'Agile/Scrum', 'Agile development methodologies'),
(gen_random_uuid(), 'Project Management', 'Project management and leadership'),
(gen_random_uuid(), 'Startup Strategy', 'Startup development and strategy'),
(gen_random_uuid(), 'Business Development', 'Business development and growth'),

-- Design & UX
(gen_random_uuid(), 'UI/UX Design', 'User interface and experience design'),
(gen_random_uuid(), 'Graphic Design', 'Graphic design and visual communication'),
(gen_random_uuid(), 'Web Design', 'Web design and layout'),
(gen_random_uuid(), 'Prototyping', 'Prototyping and wireframing'),
(gen_random_uuid(), 'Design Systems', 'Design systems and component libraries'),

-- Testing & Quality
(gen_random_uuid(), 'Unit Testing', 'Unit testing and test-driven development'),
(gen_random_uuid(), 'Integration Testing', 'Integration testing strategies'),
(gen_random_uuid(), 'Performance Testing', 'Performance and load testing'),
(gen_random_uuid(), 'Security Testing', 'Security testing and vulnerability assessment'),
(gen_random_uuid(), 'Quality Assurance', 'QA processes and methodologies'),

-- Architecture & Design Patterns
(gen_random_uuid(), 'System Design', 'System design and architecture'),
(gen_random_uuid(), 'Microservices', 'Microservices architecture'),
(gen_random_uuid(), 'API Design', 'API design and development'),
(gen_random_uuid(), 'Design Patterns', 'Software design patterns'),
(gen_random_uuid(), 'Clean Code', 'Clean code principles and practices'),

-- Career & Leadership
(gen_random_uuid(), 'Technical Leadership', 'Technical leadership and mentoring'),
(gen_random_uuid(), 'Career Development', 'Career planning and development'),
(gen_random_uuid(), 'Interview Preparation', 'Technical interview preparation'),
(gen_random_uuid(), 'Public Speaking', 'Public speaking and presentation skills'),
(gen_random_uuid(), 'Team Management', 'Team management and leadership'),

-- Specialized Technologies
(gen_random_uuid(), 'Blockchain', 'Blockchain and cryptocurrency development'),
(gen_random_uuid(), 'IoT', 'Internet of Things development'),
(gen_random_uuid(), 'Game Development', 'Game development and programming'),
(gen_random_uuid(), 'AR/VR', 'Augmented and Virtual Reality development'),
(gen_random_uuid(), 'Cybersecurity', 'Cybersecurity and ethical hacking'); 