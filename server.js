const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'mock-data.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initial mock data
const initialMockData = {
  phases: [
    {
      id: 'phase1',
      name: 'Research & Development',
      subcomponents: [
        {
          id: 'sub1',
          title: 'Basic Research',
          step: 'Initial research phase',
          hint: 'Focus on fundamental research',
          frequencyPercent: 30,
          timePercent: 25
        },
        {
          id: 'sub2',
          title: 'Applied Research',
          step: 'Applied research phase',
          hint: 'Focus on practical applications',
          frequencyPercent: 40,
          timePercent: 35
        }
      ]
    },
    {
      id: 'phase2',
      name: 'Testing & Validation',
      subcomponents: [
        {
          id: 'sub3',
          title: 'Prototype Testing',
          step: 'Test phase',
          hint: 'Validate prototype functionality',
          frequencyPercent: 20,
          timePercent: 25
        },
        {
          id: 'sub4',
          title: 'Performance Analysis',
          step: 'Analysis phase',
          hint: 'Analyze performance metrics',
          frequencyPercent: 10,
          timePercent: 15
        }
      ]
    }
  ],
  roles: [
    {
      id: 'role1',
      name: 'Research Leader',
      description: 'Leads research activities and coordinates team efforts',
      responsibilities: [
        'Oversee research projects',
        'Coordinate team activities',
        'Review research findings'
      ]
    }
  ],
  researchActivities: [
    {
      id: 'clear-aligner',
      name: 'Clear Aligner',
      description: 'Clear aligner therapy development and optimization',
      category: 'Orthodontics',
      area: 'Treatment Devices',
      focus: 'Digital Treatment Planning',
      steps: ['Bone Evaluation', 'Digital Imaging', 'Treatment Planning', 'Surgical Preparation'],
      selectedSubcomponents: [
        {
          stepName: 'Bone Evaluation',
          subcomponentName: 'Bone Evaluation-Digital Imaging Modification (CBCT)',
          percentage: 75
        },
        {
          stepName: 'Digital Imaging',
          subcomponentName: 'Digital Imaging-3D Modeling',
          percentage: 60
        },
        {
          stepName: 'Treatment Planning',
          subcomponentName: 'Treatment Planning-Surgical Guide Design',
          percentage: 85
        }
      ]
    },
    {
      id: 'implant-surgery',
      name: 'Implant Surgery',
      description: 'Dental implant surgical procedures and techniques',
      category: 'Oral Surgery',
      area: 'Surgical Procedures',
      focus: 'Implant Placement',
      steps: ['Bone Evaluation', 'Surgical Preparation', 'Implant Placement', 'Follow-up'],
      selectedSubcomponents: [
        {
          stepName: 'Bone Evaluation',
          subcomponentName: 'Bone Evaluation-CT Scan Analysis',
          percentage: 90
        },
        {
          stepName: 'Surgical Preparation',
          subcomponentName: 'Surgical Preparation-Guide Design',
          percentage: 80
        }
      ]
    },
    {
      id: 'periodontal-therapy',
      name: 'Periodontal Therapy',
      description: 'Advanced periodontal treatment and maintenance',
      category: 'Periodontics',
      area: 'Therapeutic Procedures',
      focus: 'Tissue Regeneration',
      steps: ['Diagnosis', 'Treatment Planning', 'Surgical Intervention', 'Follow-up'],
      selectedSubcomponents: [
        {
          stepName: 'Diagnosis',
          subcomponentName: 'Diagnosis-Periodontal Assessment',
          percentage: 85
        },
        {
          stepName: 'Treatment Planning',
          subcomponentName: 'Treatment Planning-Regenerative Protocol',
          percentage: 70
        }
      ]
    }
  ]
};

// Load or initialize data
let mockData;
try {
  if (fs.existsSync(DATA_FILE)) {
    mockData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } else {
    mockData = initialMockData;
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2));
  }
} catch (error) {
  console.error('Error loading data:', error);
  mockData = initialMockData;
}

// Helper function to save data
const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// API Routes
app.get('/api/businesses/:businessId/years/:year/phases', (req, res) => {
  res.json(mockData.phases);
});

app.get('/api/businesses/:businessId/years/:year/phases/:phaseId/subcomponents', (req, res) => {
  const phase = mockData.phases.find(p => p.id === req.params.phaseId);
  if (phase) {
    res.json(phase.subcomponents);
  } else {
    res.status(404).json({ error: 'Phase not found' });
  }
});

app.put('/api/businesses/:businessId/years/:year/phases/:phaseId', (req, res) => {
  const phase = mockData.phases.find(p => p.id === req.params.phaseId);
  if (phase) {
    Object.assign(phase, req.body);
    saveData();
    res.json(phase);
  } else {
    res.status(404).json({ error: 'Phase not found' });
  }
});

app.put('/api/businesses/:businessId/years/:year/phases/:phaseId/subcomponents/:subcomponentId', (req, res) => {
  let phase = mockData.phases.find(p => p.id === req.params.phaseId);
  if (!phase) {
    // If phase does not exist, create it
    phase = {
      id: req.params.phaseId,
      name: req.params.phaseId,
      subcomponents: []
    };
    mockData.phases.push(phase);
  }
  let subcomponent = phase.subcomponents.find(s => s.id === req.params.subcomponentId);
  if (subcomponent) {
    Object.assign(subcomponent, req.body);
  } else {
    // If subcomponent does not exist, create it
    subcomponent = {
      id: req.params.subcomponentId,
      ...req.body
    };
    phase.subcomponents.push(subcomponent);
  }
  saveData();
  res.json(subcomponent);
});

app.delete('/api/businesses/:businessId/years/:year/phases/:phaseId/subcomponents/:subcomponentId', (req, res) => {
  const phase = mockData.phases.find(p => p.id === req.params.phaseId);
  if (phase) {
    const index = phase.subcomponents.findIndex(s => s.id === req.params.subcomponentId);
    if (index !== -1) {
      phase.subcomponents.splice(index, 1);
      saveData();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Subcomponent not found' });
    }
  } else {
    res.status(404).json({ error: 'Phase not found' });
  }
});

// Roles API endpoints
app.get('/api/businesses/:businessId/years/:year/roles', (req, res) => {
  res.json(mockData.roles);
});

app.post('/api/businesses/:businessId/years/:year/roles', (req, res) => {
  const newRole = {
    id: `role${mockData.roles.length + 1}`,
    ...req.body
  };
  mockData.roles.push(newRole);
  saveData();
  res.status(201).json(newRole);
});

app.put('/api/businesses/:businessId/years/:year/roles/:roleId', (req, res) => {
  const role = mockData.roles.find(r => r.id === req.params.roleId);
  if (role) {
    Object.assign(role, req.body);
    saveData();
    res.json(role);
  } else {
    res.status(404).json({ error: 'Role not found' });
  }
});

app.delete('/api/businesses/:businessId/years/:year/roles/:roleId', (req, res) => {
  const index = mockData.roles.findIndex(r => r.id === req.params.roleId);
  if (index !== -1) {
    mockData.roles.splice(index, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Role not found' });
  }
});

// Research Activities API endpoint
app.get('/api/research-activities', (req, res) => {
  res.json(mockData.researchActivities || []);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 