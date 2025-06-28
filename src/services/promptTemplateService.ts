// Prompt template service for managing AI generation prompts
// This will be moved to Supabase later

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: 'research_activity' | 'subcomponent';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default Research Activity prompt template
const DEFAULT_RESEARCH_ACTIVITY_PROMPT = `Generate a structured internal training summary for the following Research Activity. There are no detailed user-provided entries for this activity, so infer content conservatively based on the activity title, associated process steps and subcomponents, and general best practices.

The goal is to educate staff on the purpose and expected approach of this Research Activity using clear, professional language. Avoid speculative or overly specific claims unless clearly justified by the activity title or related data. The final result should resemble an internal training manual section and use bullet points for clarity.

Inputs:

Research Activity Title: {{insert title}}

Step Names & Subcomponents (if available): {{insert or summarize available process structure}}

Optional Notes or Tags: {{insert freeform internal notes, if any}}

Output Format:

📘 Research Activity: {{Title}}

🔍 General Purpose

[Provide a conservative, high-level description of what this research activity likely addresses based on its title]

[Frame the activity as part of an evidence-based improvement or development process]

🎯 Anticipated Objectives

[List broad goals such as improving outcomes, enhancing efficiency, solving a defined challenge, or testing a process innovation]

[Use general language applicable to internal audiences across roles]

🧪 Typical Hypotheses & Rationale

[Suggest plausible, standard hypotheses that might be tested through this type of activity]

[Reference common decision-making rationales, such as comparative performance, reliability, or adaptability]

❓ Common Technical Uncertainties

[List potential uncertainties typically encountered in this category (e.g., outcome variability, implementation impact, material performance)]

🔁 Alternatives Commonly Evaluated

[Describe standard competing solutions or design choices that teams may weigh]

[Keep the tone neutral and leave space for team-specific decisions]

🔧 Developmental Process (Summary of Steps & Subcomponents)

[Summarize the structure of the activity using steps and subcomponents]

[Include conservative estimates of timeframes and resource requirements]

📊 Expected Outcomes & Success Metrics

[Outline typical deliverables and how success might be measured]

[Focus on process improvements, knowledge gains, or capability development]

💡 Key Considerations & Best Practices

[Highlight important factors teams should consider when undertaking this activity]

[Include risk mitigation strategies and quality assurance approaches]`;

// Default Subcomponent prompt template
const DEFAULT_SUBCOMPONENT_PROMPT = `Generate a detailed technical summary for the following Research Subcomponent. This should provide comprehensive information about the specific subcomponent's role, methodology, and expected outcomes within the broader research activity.

Inputs:

Subcomponent Name: {{insert subcomponent name}}
Research Activity: {{insert parent activity name}}
Step Name: {{insert parent step name}}
User Notes: {{insert any user-provided notes}}
Research API Data: {{insert available research data}}

Output Format:

🔬 Subcomponent: {{Name}}

📋 Technical Overview

[Provide a detailed technical description of what this subcomponent involves]

[Include specific methodologies, techniques, or processes used]

🎯 Specific Objectives

[Detail the precise goals and outcomes expected from this subcomponent]

[Explain how it contributes to the broader research activity]

🧪 Methodology & Approach

[Describe the specific methods, tools, and procedures used]

[Include any specialized equipment, software, or techniques]

📊 Data Collection & Analysis

[Outline what data is collected and how it's analyzed]

[Include any statistical methods, validation procedures, or quality controls]

🔍 Key Findings & Insights

[Summarize typical findings or insights from this subcomponent]

[Include any patterns, trends, or discoveries commonly associated]

⚠️ Technical Challenges & Solutions

[Identify potential technical challenges and their solutions]

[Include troubleshooting approaches and best practices]

📈 Success Metrics & Validation

[Define how success is measured for this subcomponent]

[Include validation methods and quality assurance procedures]

💡 Implementation Guidelines

[Provide practical guidance for implementing this subcomponent]

[Include timing, resource requirements, and coordination needs]`;

// Local storage keys
const PROMPT_TEMPLATES_KEY = 'prompt_templates';
const USER_PROMPTS_KEY = 'user_prompts';

// Initialize default templates
const initializeDefaultTemplates = (): PromptTemplate[] => {
  const defaultTemplates: PromptTemplate[] = [
    {
      id: 'research_activity_default',
      name: 'Research Activity Default',
      description: 'Default template for generating research activity summaries',
      template: DEFAULT_RESEARCH_ACTIVITY_PROMPT,
      category: 'research_activity',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'subcomponent_default',
      name: 'Subcomponent Default',
      description: 'Default template for generating subcomponent summaries',
      template: DEFAULT_SUBCOMPONENT_PROMPT,
      category: 'subcomponent',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save to localStorage if not already present
  const existing = localStorage.getItem(PROMPT_TEMPLATES_KEY);
  if (!existing) {
    localStorage.setItem(PROMPT_TEMPLATES_KEY, JSON.stringify(defaultTemplates));
  }

  return defaultTemplates;
};

// Get all prompt templates
export const getPromptTemplates = (): PromptTemplate[] => {
  const stored = localStorage.getItem(PROMPT_TEMPLATES_KEY);
  if (!stored) {
    return initializeDefaultTemplates();
  }
  
  try {
    const templates = JSON.parse(stored);
    return templates;
  } catch (error) {
    console.error('Error parsing prompt templates:', error);
    return initializeDefaultTemplates();
  }
};

// Get templates by category
export const getPromptTemplatesByCategory = (category: 'research_activity' | 'subcomponent'): PromptTemplate[] => {
  const templates = getPromptTemplates();
  return templates.filter(template => template.category === category);
};

// Get default template for category
export const getDefaultPromptTemplate = (category: 'research_activity' | 'subcomponent'): PromptTemplate | null => {
  const templates = getPromptTemplatesByCategory(category);
  return templates.find(template => template.isDefault) || null;
};

// Save user prompt for specific activity/subcomponent
export const saveUserPrompt = (
  businessId: string,
  year: number,
  activityId: string,
  prompt: string,
  subcomponentId?: string
): void => {
  const key = subcomponentId 
    ? `${USER_PROMPTS_KEY}_${businessId}_${year}_${activityId}_${subcomponentId}`
    : `${USER_PROMPTS_KEY}_${businessId}_${year}_${activityId}`;
  
  localStorage.setItem(key, prompt);
};

// Load user prompt for specific activity/subcomponent
export const loadUserPrompt = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId?: string
): string | null => {
  const key = subcomponentId 
    ? `${USER_PROMPTS_KEY}_${businessId}_${year}_${activityId}_${subcomponentId}`
    : `${USER_PROMPTS_KEY}_${businessId}_${year}_${activityId}`;
  
  return localStorage.getItem(key);
};

// Get prompt for activity/subcomponent (user prompt or default template)
export const getPromptForActivity = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId?: string
): string => {
  // Try to load user prompt first
  const userPrompt = loadUserPrompt(businessId, year, activityId, subcomponentId);
  if (userPrompt) {
    return userPrompt;
  }

  // Fall back to default template
  const category = subcomponentId ? 'subcomponent' : 'research_activity';
  const defaultTemplate = getDefaultPromptTemplate(category);
  return defaultTemplate?.template || '';
};

// Replace template variables with actual data
export const processPromptTemplate = (
  template: string,
  data: Record<string, any>
): string => {
  let processed = template;
  
  // Replace {{variable}} placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processed = processed.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  return processed;
}; 