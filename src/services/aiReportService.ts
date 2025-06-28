interface BusinessInfo {
  name: string;
  dbaName: string;
  ein: string;
  entityType: string;
  entityState: string;
  startYear: number | null;
  owners: {
    name: string;
    ownershipPercentage: number;
    isResearchLeader: boolean;
  }[];
}

interface SubcomponentData {
  stepName: string;
  subcomponentName: string;
  subcomponentId: string;
  userNotes: string;
  userModifications: Record<string, any>;
}

interface AIReportRequest {
  activityName: string;
  businessInfo: BusinessInfo;
  subcomponentData: SubcomponentData[];
  year: number;
}

// New interface for individual subcomponent AI generation
interface SubcomponentAIRequest {
  subcomponentName: string;
  stepName: string;
  activityName: string;
  subcomponentId: string;
  businessInfo: BusinessInfo;
  researchApiData: any;
  userNotes: string;
  userModifications: Record<string, any>;
  year: number;
}

// New interface for bulk AI generation
interface BulkAIRequest {
  activities: {
    activityName: string;
    activityId: string;
    subcomponents: SubcomponentData[];
  }[];
  businessInfo: BusinessInfo;
  year: number;
}

export interface AIReportContent {
  title: string;
  executiveSummary: string;
  researchDescription: string;
  methodology: string;
  findings: string;
  conclusions: string;
  recommendations: string;
}

// New interface for subcomponent AI content
export interface SubcomponentAIContent {
  subcomponentName: string;
  stepName: string;
  activityName: string;
  subcomponentId: string;
  content: string;
  generatedAt: string;
}

// Mock AI service - in a real implementation, this would call an actual AI API
export const generateAIReportContent = async (request: AIReportRequest): Promise<AIReportContent> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { activityName, businessInfo, subcomponentData, year } = request;

  // Create a comprehensive prompt for AI
  const prompt = createAIPrompt(request);
  
  // For now, we'll generate structured content based on the data
  // In a real implementation, this would be sent to an AI service like OpenAI
  const content = generateStructuredContent(request);

  return content;
};

// New function for generating AI content for individual subcomponents
export const generateSubcomponentAIContent = async (request: SubcomponentAIRequest): Promise<SubcomponentAIContent> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { subcomponentName, stepName, activityName, businessInfo, researchApiData, userNotes, userModifications, year } = request;

  // Create a focused prompt for the subcomponent
  const prompt = createSubcomponentAIPrompt(request);
  
  // Generate content for the subcomponent
  const content = generateSubcomponentContent(request);

  return {
    subcomponentName,
    stepName,
    activityName,
    subcomponentId: request.subcomponentId,
    content,
    generatedAt: new Date().toISOString()
  };
};

// New function for bulk AI generation for all activities and subcomponents
export const generateBulkAIContent = async (request: BulkAIRequest): Promise<{
  activities: { activityId: string; content: AIReportContent }[];
  subcomponents: SubcomponentAIContent[];
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 5000));

  const { activities, businessInfo, year } = request;

  const results = {
    activities: [] as { activityId: string; content: AIReportContent }[],
    subcomponents: [] as SubcomponentAIContent[]
  };

  // Generate content for each activity
  for (const activity of activities) {
    const activityContent = await generateAIReportContent({
      activityName: activity.activityName,
      businessInfo,
      subcomponentData: activity.subcomponents,
      year
    });

    results.activities.push({
      activityId: activity.activityId,
      content: activityContent
    });

    // Generate content for each subcomponent in this activity
    for (const subcomponent of activity.subcomponents) {
      const subcomponentContent = await generateSubcomponentAIContent({
        subcomponentName: subcomponent.subcomponentName,
        stepName: subcomponent.stepName,
        activityName: activity.activityName,
        subcomponentId: subcomponent.subcomponentId,
        businessInfo,
        researchApiData: {},
        userNotes: subcomponent.userNotes,
        userModifications: subcomponent.userModifications,
        year
      });

      // The subcomponentContent already includes the subcomponentId
      results.subcomponents.push(subcomponentContent);
    }
  }

  return results;
};

const createSubcomponentAIPrompt = (request: SubcomponentAIRequest): string => {
  const { subcomponentName, stepName, activityName, businessInfo, researchApiData, userNotes, userModifications, year } = request;

  const businessDescription = `
Business: ${businessInfo.name}
DBA: ${businessInfo.dbaName || 'N/A'}
EIN: ${businessInfo.ein}
Entity Type: ${businessInfo.entityType}
State: ${businessInfo.entityState}
Start Year: ${businessInfo.startYear}
Owners: ${businessInfo.owners.map(o => `${o.name} (${o.ownershipPercentage}%)${o.isResearchLeader ? ' - Research Leader' : ''}`).join(', ')}
  `.trim();

  const researchDataDescription = researchApiData ? `
Research API Data:
- General Description: ${researchApiData.generalDescription || 'Not available'}
- Goal: ${researchApiData.goal || 'Not available'}
- Hypothesis: ${researchApiData.hypothesis || 'Not available'}
- Uncertainties: ${researchApiData.uncertainties || 'Not available'}
- Alternatives: ${researchApiData.alternatives || 'Not available'}
- Developmental Process: ${researchApiData.developmentalProcess || 'Not available'}
  `.trim() : 'No Research API data available';

  return `
Please generate a detailed technical description for the following subcomponent within a Research & Development project:

SUBCOMPONENT: ${subcomponentName}
STEP/PHASE: ${stepName}
RESEARCH ACTIVITY: ${activityName}
YEAR: ${year}

BUSINESS INFORMATION:
${businessDescription}

RESEARCH DATA:
${researchDataDescription}

USER NOTES: ${userNotes || 'None provided'}

USER MODIFICATIONS: ${Object.entries(userModifications).map(([key, value]) => `${key}: ${value}`).join(', ') || 'None'}

Please create a comprehensive technical description that includes:
1. Purpose and Role: What this subcomponent does and why it's important
2. Technical Approach: How the subcomponent was developed or implemented
3. Challenges and Solutions: Technical difficulties encountered and how they were resolved
4. Integration: How this subcomponent fits into the broader research activity
5. Outcomes: Results and benefits achieved through this subcomponent

The description should be:
- Technical and detailed
- Professional in tone
- Suitable for R&D tax credit documentation
- Focused on the specific subcomponent
- Approximately 200-300 words
  `.trim();
};

const generateSubcomponentContent = (request: SubcomponentAIRequest): string => {
  const { subcomponentName, stepName, activityName, businessInfo, researchApiData, userNotes, userModifications, year } = request;

  const researchLeader = businessInfo.owners.find(o => o.isResearchLeader);

  return `
Purpose and Role:
The ${subcomponentName} represents a critical component within the ${stepName} phase of our ${activityName} research initiative. This subcomponent was specifically designed to address technical challenges related to ${researchApiData?.goal || 'process optimization'} and serves as a foundational element in our overall research methodology.

Technical Approach:
The development of ${subcomponentName} involved systematic investigation and iterative refinement. Our research team, led by ${researchLeader?.name || 'qualified personnel'}, employed ${researchApiData?.developmentalProcess || 'established engineering principles'} to create a solution that could effectively address the identified technical uncertainties. The approach included ${researchApiData?.alternatives ? 'evaluation of multiple alternatives' : 'comprehensive analysis'} and rigorous testing protocols.

Challenges and Solutions:
During the development process, we encountered several technical challenges, including ${researchApiData?.uncertainties || 'complex integration requirements'}. These challenges were resolved through ${researchApiData?.hypothesis ? 'hypothesis-driven experimentation' : 'systematic problem-solving approaches'}, resulting in a robust and reliable solution. The iterative nature of the development process allowed us to refine the subcomponent based on real-world testing and feedback.

Integration:
${subcomponentName} is designed to seamlessly integrate with the broader ${activityName} research framework. It interfaces with other components within the ${stepName} phase and provides essential functionality that supports the overall research objectives. The subcomponent's modular design ensures compatibility with existing systems while maintaining the flexibility required for future enhancements.

Outcomes:
The implementation of ${subcomponentName} has yielded significant benefits, including ${userNotes ? 'improved efficiency and enhanced capabilities as noted in our research documentation' : 'measurable improvements in process efficiency and technical capabilities'}. The subcomponent has proven to be a valuable asset in our research and development efforts, contributing to the overall success of the ${activityName} project and supporting our company's commitment to technological innovation.
  `.trim();
};

const createAIPrompt = (request: AIReportRequest): string => {
  const { activityName, businessInfo, subcomponentData, year } = request;

  const businessDescription = `
Business: ${businessInfo.name}
DBA: ${businessInfo.dbaName || 'N/A'}
EIN: ${businessInfo.ein}
Entity Type: ${businessInfo.entityType}
State: ${businessInfo.entityState}
Start Year: ${businessInfo.startYear}
Owners: ${businessInfo.owners.map(o => `${o.name} (${o.ownershipPercentage}%)${o.isResearchLeader ? ' - Research Leader' : ''}`).join(', ')}
  `.trim();

  const subcomponentDescription = subcomponentData.map((data, index) => `
Step ${index + 1}: ${data.stepName}
  Subcomponent: ${data.subcomponentName}
  User Notes: ${data.userNotes || 'None provided'}
  User Modifications: ${Object.entries(data.userModifications).map(([key, value]) => `${key}: ${value}`).join(', ') || 'None'}
  `).join('\n');

  return `
Please generate a comprehensive Research & Development Tax Credit report for the following:

RESEARCH ACTIVITY: ${activityName}
YEAR: ${year}

BUSINESS INFORMATION:
${businessDescription}

RESEARCH COMPONENTS:
${subcomponentDescription}

Please create a professional, IRS-compliant report with the following sections:
1. Executive Summary
2. Research Activity Description  
3. Research Methodology
4. Research Steps and Subcomponents
5. Findings and Results
6. Conclusions
7. Recommendations

The report should be:
- Professional and scientific in tone
- Compliant with IRS R&D tax credit requirements
- Comprehensive yet concise
- Focused on the technical aspects of the research
- Suitable for tax documentation purposes
  `.trim();
};

const generateStructuredContent = (request: AIReportRequest): AIReportContent => {
  const { activityName, businessInfo, subcomponentData, year } = request;

  const researchLeader = businessInfo.owners.find(o => o.isResearchLeader);
  const totalSteps = new Set(subcomponentData.map(d => d.stepName)).size;
  const totalSubcomponents = subcomponentData.length;

  return {
    title: `${activityName} Research & Development Report`,
    executiveSummary: `This report documents the research and development activities conducted by ${businessInfo.name} during ${year} in the area of ${activityName}. The research involved ${totalSteps} distinct phases with ${totalSubcomponents} technical subcomponents, representing a comprehensive effort to advance the company's technological capabilities and competitive position in the market. The research activities were conducted under the leadership of ${researchLeader?.name || 'qualified personnel'} and involved systematic investigation to resolve technical uncertainties and develop new or improved products, processes, or services.`,
    
    researchDescription: `The research activity "${activityName}" represents a systematic investigation undertaken by ${businessInfo.name} to advance the company's technological capabilities and address specific technical challenges in our industry. This research was conducted with the goal of developing new or improved products, processes, or services that would enhance our competitive position and provide measurable economic benefits. The research involved the application of scientific principles and engineering methodologies to resolve technical uncertainties that could not be resolved through routine engineering or standard practices.`,
    
    methodology: `The research methodology employed a systematic, iterative approach following established scientific and engineering principles. The research was conducted in ${totalSteps} distinct phases, each focusing on specific technical objectives and building upon previous findings. Each phase involved detailed planning, execution, data collection, analysis, and validation. The research team utilized both theoretical analysis and practical experimentation to validate hypotheses and develop solutions. Technical documentation was maintained throughout the process to ensure traceability and reproducibility of results.`,
    
    findings: `The research activities yielded significant findings across multiple technical areas. Key discoveries included improved understanding of ${subcomponentData.slice(0, 3).map(d => d.subcomponentName).join(', ')}, and the development of new methodologies for ${subcomponentData.slice(3, 6).map(d => d.subcomponentName).join(', ')}. The research also identified several technical challenges and their potential solutions, providing a foundation for future development efforts. These findings represent valuable intellectual property and technical knowledge that will benefit the company's ongoing research and development initiatives.`,
    
    conclusions: `The research activities conducted in ${year} successfully advanced ${businessInfo.name}'s technical capabilities in the area of ${activityName}. The systematic approach to research and development resulted in measurable progress toward resolving technical uncertainties and developing new or improved solutions. The research activities were conducted in accordance with established scientific and engineering principles, and the results provide a solid foundation for future development efforts. The investment in these research activities demonstrates the company's commitment to innovation and technological advancement.`,
    
    recommendations: `Based on the research findings, we recommend continued investment in research and development activities related to ${activityName}. Specific recommendations include: (1) Expanding research efforts in areas where significant technical progress was made, (2) Applying the developed methodologies to related technical challenges, (3) Documenting and protecting the intellectual property developed through this research, and (4) Integrating the research findings into the company's product development and process improvement initiatives. These recommendations will help maximize the return on investment in research and development while maintaining the company's competitive position in the market.`
  };
};

// Function to validate AI content before saving
export const validateAIReportContent = (content: AIReportContent): boolean => {
  const requiredFields = ['title', 'executiveSummary', 'researchDescription', 'methodology', 'findings', 'conclusions', 'recommendations'];
  
  for (const field of requiredFields) {
    if (!content[field as keyof AIReportContent] || typeof content[field as keyof AIReportContent] !== 'string') {
      return false;
    }
  }
  
  return true;
};

// Function to save AI content to localStorage
export const saveAIReportContent = (
  businessId: string,
  year: number,
  activityId: string,
  content: AIReportContent
): void => {
  if (!validateAIReportContent(content)) {
    throw new Error('Invalid AI report content');
  }
  
  const key = `ai_report_${businessId}_${year}_${activityId}`;
  localStorage.setItem(key, JSON.stringify({
    ...content,
    generatedAt: new Date().toISOString(),
    version: '1.0'
  }));
};

// Function to load AI content from localStorage
export const loadAIReportContent = (
  businessId: string,
  year: number,
  activityId: string
): AIReportContent | null => {
  const key = `ai_report_${businessId}_${year}_${activityId}`;
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (validateAIReportContent(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error('Error parsing AI report content:', error);
    }
  }
  
  return null;
};

// Function to save subcomponent AI content to localStorage
export const saveSubcomponentAIContent = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId: string,
  content: SubcomponentAIContent
): void => {
  const key = `ai_subcomponent_${businessId}_${year}_${activityId}_${subcomponentId}`;
  localStorage.setItem(key, JSON.stringify({
    ...content,
    version: '1.0'
  }));
};

// Function to load subcomponent AI content from localStorage
export const loadSubcomponentAIContent = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId: string
): SubcomponentAIContent | null => {
  const key = `ai_subcomponent_${businessId}_${year}_${activityId}_${subcomponentId}`;
  const data = localStorage.getItem(key);
  
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Error parsing subcomponent AI content:', error);
    }
  }
  
  return null;
};

// Function to save bulk AI content to localStorage
export const saveBulkAIContent = (
  businessId: string,
  year: number,
  activities: { activityId: string; content: AIReportContent }[],
  subcomponents: SubcomponentAIContent[]
): void => {
  console.log('💾 Saving bulk AI content:', { businessId, year, activitiesCount: activities.length, subcomponentsCount: subcomponents.length });
  
  // Create a mapping from activity name to activity ID
  const activityNameToIdMap = new Map<string, string>();
  activities.forEach(({ activityId, content }) => {
    // Extract activity name from the content title
    const activityName = content.title.replace(' Research & Development Report', '');
    activityNameToIdMap.set(activityName, activityId);
    console.log('💾 Saving activity content for:', activityId, 'with name:', activityName);
    saveAIReportContent(businessId, year, activityId, content);
  });

  // Save subcomponent content
  subcomponents.forEach((subcomponent) => {
    console.log('💾 Processing subcomponent:', subcomponent.subcomponentName, 'in activity:', subcomponent.activityName);
    
    // Find the activityId using the activity name
    const activityId = activityNameToIdMap.get(subcomponent.activityName);
    
    if (activityId) {
      console.log('✅ Found matching activity ID for subcomponent:', subcomponent.subcomponentName, '->', activityId);
      saveSubcomponentAIContent(businessId, year, activityId, subcomponent.subcomponentId, subcomponent);
    } else {
      console.warn('⚠️ Could not find matching activity ID for subcomponent:', subcomponent.subcomponentName, 'in activity:', subcomponent.activityName);
      console.log('Available activity names:', Array.from(activityNameToIdMap.keys()));
      // Try to save with the activity name as the ID as a fallback
      saveSubcomponentAIContent(businessId, year, subcomponent.activityName, subcomponent.subcomponentId, subcomponent);
    }
  });
  
  console.log('✅ Bulk AI content save completed');
}; 