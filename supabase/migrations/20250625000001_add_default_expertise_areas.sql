-- Add default expertise areas to the database
INSERT INTO public.expertise_areas (area_id, name, category, description, is_active) VALUES
-- Programming Languages
(gen_random_uuid(), 'JavaScript', 'Programming', 'JavaScript programming language and ecosystem', true),
(gen_random_uuid(), 'Python', 'Programming', 'Python programming language and frameworks', true),
(gen_random_uuid(), 'React', 'Frontend', 'React.js library and ecosystem', true),
(gen_random_uuid(), 'Node.js', 'Backend', 'Node.js runtime and server-side development', true),
(gen_random_uuid(), 'TypeScript', 'Programming', 'TypeScript programming language', true),
(gen_random_uuid(), 'Java', 'Programming', 'Java programming language and frameworks', true),
(gen_random_uuid(), 'C++', 'Programming', 'C++ programming language', true),
(gen_random_uuid(), 'C#', 'Programming', 'C# programming language and .NET', true),
(gen_random_uuid(), 'Go', 'Programming', 'Go programming language', true),
(gen_random_uuid(), 'Rust', 'Programming', 'Rust programming language', true),

-- Web Development
(gen_random_uuid(), 'HTML/CSS', 'Frontend', 'HTML and CSS web development', true),
(gen_random_uuid(), 'Vue.js', 'Frontend', 'Vue.js framework', true),
(gen_random_uuid(), 'Angular', 'Frontend', 'Angular framework', true),
(gen_random_uuid(), 'Next.js', 'Frontend', 'Next.js React framework', true),
(gen_random_uuid(), 'Express.js', 'Backend', 'Express.js web framework', true),
(gen_random_uuid(), 'Django', 'Backend', 'Django Python web framework', true),
(gen_random_uuid(), 'Flask', 'Backend', 'Flask Python web framework', true),
(gen_random_uuid(), 'Spring Boot', 'Backend', 'Spring Boot Java framework', true),
(gen_random_uuid(), 'Laravel', 'Backend', 'Laravel PHP framework', true),
(gen_random_uuid(), 'ASP.NET', 'Backend', 'ASP.NET framework', true),

-- Database & Data
(gen_random_uuid(), 'SQL', 'Database', 'SQL database management', true),
(gen_random_uuid(), 'PostgreSQL', 'Database', 'PostgreSQL database', true),
(gen_random_uuid(), 'MongoDB', 'Database', 'MongoDB NoSQL database', true),
(gen_random_uuid(), 'MySQL', 'Database', 'MySQL database', true),
(gen_random_uuid(), 'Redis', 'Database', 'Redis in-memory database', true),
(gen_random_uuid(), 'Data Science', 'Data', 'Data science and analytics', true),
(gen_random_uuid(), 'Machine Learning', 'AI/ML', 'Machine learning algorithms and models', true),
(gen_random_uuid(), 'Deep Learning', 'AI/ML', 'Deep learning and neural networks', true),
(gen_random_uuid(), 'Data Analysis', 'Data', 'Data analysis and visualization', true),
(gen_random_uuid(), 'Big Data', 'Data', 'Big data processing and analytics', true),

-- Cloud & DevOps
(gen_random_uuid(), 'AWS', 'Cloud', 'Amazon Web Services', true),
(gen_random_uuid(), 'Azure', 'Cloud', 'Microsoft Azure cloud platform', true),
(gen_random_uuid(), 'Google Cloud', 'Cloud', 'Google Cloud Platform', true),
(gen_random_uuid(), 'Docker', 'DevOps', 'Docker containerization', true),
(gen_random_uuid(), 'Kubernetes', 'DevOps', 'Kubernetes orchestration', true),
(gen_random_uuid(), 'CI/CD', 'DevOps', 'Continuous Integration/Deployment', true),
(gen_random_uuid(), 'Terraform', 'DevOps', 'Infrastructure as Code with Terraform', true),
(gen_random_uuid(), 'Jenkins', 'DevOps', 'Jenkins automation server', true),
(gen_random_uuid(), 'Git', 'DevOps', 'Git version control', true),
(gen_random_uuid(), 'Linux', 'DevOps', 'Linux system administration', true),

-- Mobile Development
(gen_random_uuid(), 'React Native', 'Mobile', 'React Native mobile development', true),
(gen_random_uuid(), 'Flutter', 'Mobile', 'Flutter mobile development', true),
(gen_random_uuid(), 'iOS Development', 'Mobile', 'iOS app development with Swift', true),
(gen_random_uuid(), 'Android Development', 'Mobile', 'Android app development', true),
(gen_random_uuid(), 'Xamarin', 'Mobile', 'Xamarin cross-platform development', true),

-- AI & Machine Learning
(gen_random_uuid(), 'TensorFlow', 'AI/ML', 'TensorFlow machine learning framework', true),
(gen_random_uuid(), 'PyTorch', 'AI/ML', 'PyTorch machine learning framework', true),
(gen_random_uuid(), 'Natural Language Processing', 'AI/ML', 'NLP and text processing', true),
(gen_random_uuid(), 'Computer Vision', 'AI/ML', 'Computer vision and image processing', true),
(gen_random_uuid(), 'AI Ethics', 'AI/ML', 'AI ethics and responsible AI', true),

-- Business & Product
(gen_random_uuid(), 'Product Management', 'Business', 'Product management and strategy', true),
(gen_random_uuid(), 'Agile/Scrum', 'Business', 'Agile development methodologies', true),
(gen_random_uuid(), 'Project Management', 'Business', 'Project management and leadership', true),
(gen_random_uuid(), 'Startup Strategy', 'Business', 'Startup development and strategy', true),
(gen_random_uuid(), 'Business Development', 'Business', 'Business development and growth', true),

-- Design & UX
(gen_random_uuid(), 'UI/UX Design', 'Design', 'User interface and experience design', true),
(gen_random_uuid(), 'Graphic Design', 'Design', 'Graphic design and visual communication', true),
(gen_random_uuid(), 'Web Design', 'Design', 'Web design and layout', true),
(gen_random_uuid(), 'Prototyping', 'Design', 'Prototyping and wireframing', true),
(gen_random_uuid(), 'Design Systems', 'Design', 'Design systems and component libraries', true),

-- Testing & Quality
(gen_random_uuid(), 'Unit Testing', 'Testing', 'Unit testing and test-driven development', true),
(gen_random_uuid(), 'Integration Testing', 'Testing', 'Integration testing strategies', true),
(gen_random_uuid(), 'Performance Testing', 'Testing', 'Performance and load testing', true),
(gen_random_uuid(), 'Security Testing', 'Testing', 'Security testing and vulnerability assessment', true),
(gen_random_uuid(), 'Quality Assurance', 'Testing', 'QA processes and methodologies', true),

-- Architecture & Design Patterns
(gen_random_uuid(), 'System Design', 'Architecture', 'System design and architecture', true),
(gen_random_uuid(), 'Microservices', 'Architecture', 'Microservices architecture', true),
(gen_random_uuid(), 'API Design', 'Architecture', 'API design and development', true),
(gen_random_uuid(), 'Design Patterns', 'Architecture', 'Software design patterns', true),
(gen_random_uuid(), 'Clean Code', 'Architecture', 'Clean code principles and practices', true),

-- Career & Leadership
(gen_random_uuid(), 'Technical Leadership', 'Career', 'Technical leadership and mentoring', true),
(gen_random_uuid(), 'Career Development', 'Career', 'Career planning and development', true),
(gen_random_uuid(), 'Interview Preparation', 'Career', 'Technical interview preparation', true),
(gen_random_uuid(), 'Public Speaking', 'Career', 'Public speaking and presentation skills', true),
(gen_random_uuid(), 'Team Management', 'Career', 'Team management and leadership', true),

-- Specialized Technologies
(gen_random_uuid(), 'Blockchain', 'Emerging', 'Blockchain and cryptocurrency development', true),
(gen_random_uuid(), 'IoT', 'Emerging', 'Internet of Things development', true),
(gen_random_uuid(), 'Game Development', 'Gaming', 'Game development and programming', true),
(gen_random_uuid(), 'AR/VR', 'Emerging', 'Augmented and Virtual Reality development', true),
(gen_random_uuid(), 'Cybersecurity', 'Security', 'Cybersecurity and ethical hacking', true); 