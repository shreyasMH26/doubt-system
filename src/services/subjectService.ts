import { supabase } from '../lib/supabase';
import type { Subject } from '../types';

export const DEFAULT_SUBJECTS: Subject[] = [
  // CSE / ISE Core
  { id: 'sub-cse-dsa', name: 'Data Structures & Algorithms', slug: 'data-structures-algorithms', description: 'Arrays, Trees, Graphs, Sorting, Dynamic Programming', icon: '💻' },
  { id: 'sub-cse-dbms', name: 'Database Management Systems', slug: 'database-management-systems', description: 'SQL, Normalization, Transactions, Indexing', icon: '🗄️' },
  { id: 'sub-cse-os', name: 'Operating Systems', slug: 'operating-systems', description: 'Processes, Threads, Memory Management, CPU Scheduling', icon: '🖥️' },
  { id: 'sub-cse-cn', name: 'Computer Networks', slug: 'computer-networks', description: 'OSI Model, TCP/IP, Routing Protocols, Socket Programming', icon: '🌐' },
  { id: 'sub-cse-oop', name: 'Object-Oriented Programming (Java/C++)', slug: 'object-oriented-programming', description: 'Classes, Inheritance, Polymorphism, Design Patterns', icon: '☕' },
  { id: 'sub-cse-daa', name: 'Design & Analysis of Algorithms', slug: 'design-analysis-algorithms', description: 'Divide & Conquer, Greedy, DP, NP-Completeness', icon: '⚡' },
  { id: 'sub-cse-toc', name: 'Theory of Computation & Automata', slug: 'theory-of-computation', description: 'DFA, NFA, Regular Expressions, Turing Machines', icon: '🔄' },
  { id: 'sub-cse-coa', name: 'Computer Organization & Architecture', slug: 'computer-organization-architecture', description: 'Instruction Sets, Pipeline Hazards, Cache Memory', icon: '🏗️' },
  { id: 'sub-cse-se', name: 'Software Engineering & Agile', slug: 'software-engineering', description: 'SDLC, Agile Scrum, System Design, Testing Methodologies', icon: '📊' },
  { id: 'sub-cse-web', name: 'Web Technologies & Full Stack', slug: 'web-technologies', description: 'HTML, CSS, JavaScript, React, Node.js, REST APIs', icon: '🌐' },
  { id: 'sub-cse-aiml', name: 'Artificial Intelligence & Machine Learning', slug: 'ai-machine-learning', description: 'Supervised Learning, Neural Networks, Deep Learning', icon: '🤖' },
  { id: 'sub-cse-cloud', name: 'Cloud Computing & DevOps', slug: 'cloud-computing', description: 'AWS, GCP, Docker, Kubernetes, CI/CD Pipelines', icon: '☁️' },
  { id: 'sub-cse-cyber', name: 'Cyber Security & Cryptography', slug: 'cyber-security', description: 'Network Security, RSA, AES, Authentication Protocols', icon: '🔒' },
  { id: 'sub-cse-comp', name: 'System Software & Compilers', slug: 'compilers-system-software', description: 'Lexical Analysis, Parsing, Syntax Directed Translation', icon: '⚙️' },

  // First Year / Common Engineering (VTU / JIT)
  { id: 'sub-eng-math1', name: 'Engineering Mathematics - I', slug: 'engineering-math-1', description: 'Calculus, Linear Algebra, Matrix Diagonalization', icon: '📐' },
  { id: 'sub-eng-math2', name: 'Engineering Mathematics - II', slug: 'engineering-math-2', description: 'Differential Equations, Vector Calculus, Laplace Transforms', icon: '📐' },
  { id: 'sub-eng-phy', name: 'Engineering Physics', slug: 'engineering-physics', description: 'Quantum Mechanics, Lasers, Optical Fibers, Semiconductors', icon: '⚛️' },
  { id: 'sub-eng-chem', name: 'Engineering Chemistry', slug: 'engineering-chemistry', description: 'Electrochemistry, Battery Tech, Polymers, Water Tech', icon: '🧪' },
  { id: 'sub-eng-cps', name: 'Problem Solving through C (CPS)', slug: 'problem-solving-c', description: 'C Programming, Pointers, Structures, File Handling', icon: '💻' },
  { id: 'sub-eng-eee', name: 'Basic Electrical Engineering', slug: 'basic-electrical', description: 'DC/AC Circuits, Transformers, Single & 3-Phase Motors', icon: '⚡' },
  { id: 'sub-eng-ece', name: 'Basic Electronics Engineering', slug: 'basic-electronics', description: 'Diodes, BJTs, Op-Amps, Digital Logic, Number Systems', icon: '🔌' },
  { id: 'sub-eng-mech', name: 'Elements of Mechanical Engineering', slug: 'mechanical-basics', description: 'Thermodynamics, Turbines, Refrigeration, Lathe, Milling', icon: '⚙️' },
  { id: 'sub-eng-civ', name: 'Elements of Civil Engineering', slug: 'civil-basics', description: 'Statics, Coplanar Forces, Surveying, Friction', icon: '🏗️' },
  { id: 'sub-eng-eng', name: 'Technical English & Communication', slug: 'technical-english', description: 'Technical Writing, Business Correspondence, Presentation', icon: '📝' },
  { id: 'sub-eng-env', name: 'Environmental Studies & Ethics', slug: 'environmental-studies', description: 'Ecology, Pollution Control, Sustainable Engineering', icon: '🌱' },

  // Core Disciplines (ECE / EEE / MECH / CIVIL)
  { id: 'sub-ece-signals', name: 'Signals & Systems', slug: 'signals-systems', description: 'Continuous & Discrete Signals, Fourier Analysis, Z-Transform', icon: '📡' },
  { id: 'sub-ece-digital', name: 'Digital Electronics & Microcontrollers', slug: 'digital-electronics', description: 'Combinational Logic, Flip-Flops, 8051 & ARM Architecture', icon: '🔌' },
  { id: 'sub-eee-control', name: 'Control Systems', slug: 'control-systems', description: 'Transfer Functions, Root Locus, Nyquist & Bode Stability', icon: '🎛️' },
  { id: 'sub-ece-vlsi', name: 'VLSI Design & Embedded Systems', slug: 'vlsi-embedded-systems', description: 'CMOS Inverters, FPGA, Verilog HDL, Embedded C', icon: '🔬' },
  { id: 'sub-mech-thermo', name: 'Thermodynamics & Heat Transfer', slug: 'thermodynamics-heat-transfer', description: '1st & 2nd Laws, Rankine Cycle, Heat Exchangers', icon: '🔥' },
  { id: 'sub-civ-struct', name: 'Strength of Materials & Structures', slug: 'strength-of-materials', description: 'Stress, Strain, SFD/BMD, Torsion, Column Deflection', icon: '🏛️' },

  // General Academic
  { id: 'sub-gen-apt', name: 'Aptitude & Placement Prep', slug: 'aptitude-placement-prep', description: 'Quantitative Aptitude, Logical Reasoning, Coding Rounds', icon: '🎯' },
  { id: 'sub-gen-proj', name: 'Projects & Academic Doubts', slug: 'projects-academic-doubts', description: 'Capstone Projects, Mini Projects, General Academic Doubts', icon: '📚' },
];

export async function getSubjects(): Promise<Subject[]> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (error) {
      console.warn('[DoubtHub] Could not load subjects from database, falling back to defaults:', error.message);
      return DEFAULT_SUBJECTS;
    }

    if (!data || data.length === 0) {
      console.info('[DoubtHub] Subjects table is empty in Supabase, using default curated subjects.');
      return DEFAULT_SUBJECTS;
    }

    return data as Subject[];
  } catch (err) {
    console.warn('[DoubtHub] Unexpected error in getSubjects, using defaults:', err);
    return DEFAULT_SUBJECTS;
  }
}
