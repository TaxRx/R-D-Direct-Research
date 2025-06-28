import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Business } from '../types/Business';
import { ResearchActivity, ResearchStep, ResearchSubcomponent } from '../types/ReportQRA';

// Extend jsPDF with autoTable
(jsPDF as any).autoTable = autoTable;

interface PDFExportOptions {
  business: Business;
  year: number;
  activities: ResearchActivity[];
  logo?: string; // Base64 encoded logo
  researchLeaders: string[];
}

export const generateRDTaxCreditReport = async (options: PDFExportOptions): Promise<jsPDF> => {
  const { business, year, activities, logo, researchLeaders } = options;
  
  console.log('🔧 generateRDTaxCreditReport called with:', { business: business.businessName, year, activitiesCount: activities.length });
  console.log('🔧 Activities details:', activities.map(a => ({ id: a.id, name: a.name, stepsCount: a.steps.length })));
  console.log('🔧 First activity steps:', activities[0]?.steps?.map(s => ({ id: s.id, name: s.name, subcomponentsCount: s.subcomponents?.length || 0 })));
  
  // Validate input data
  if (!business || !business.businessName) {
    throw new Error('Invalid business data provided');
  }
  
  if (!activities || activities.length === 0) {
    throw new Error('No activities provided for PDF generation');
  }
  
  console.log('✅ Input validation passed');
  
  try {
    // Create PDF document
    const doc = new jsPDF('p', 'pt', 'a4');
    console.log('📄 PDF document created');
    
    // Test basic PDF functionality
    doc.setFontSize(12);
    doc.text('Test PDF Generation', 40, 40);
    console.log('✅ Basic PDF text added successfully');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = margin;
    
    // Helper function to add new page
    const addNewPage = () => {
      doc.addPage();
      currentY = margin;
    };
    
    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight: number) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        addNewPage();
        return true;
      }
      return false;
    };
    
    // Helper function to add title with styling
    const addTitle = (text: string, fontSize: number = 18, isBold: boolean = true) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(text, margin, currentY);
      currentY += fontSize + 10;
    };
    
    // Helper function to add subtitle
    const addSubtitle = (text: string, fontSize: number = 14) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin, currentY);
      currentY += fontSize + 8;
    };
    
    // Helper function to add body text
    const addBodyText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const textWidth = contentWidth;
      const lines = doc.splitTextToSize(text, textWidth);
      
      checkPageBreak(lines.length * fontSize + 5);
      
      doc.text(lines, margin, currentY);
      currentY += lines.length * fontSize + 5;
    };
    
    // Helper function to add section divider
    const addSectionDivider = () => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 20;
    };

    console.log('📝 Starting title page generation');
    
    // ===== TITLE PAGE =====
    addTitle('RESEARCH & DEVELOPMENT TAX CREDIT REPORT', 24, true);
    currentY += 20;
    
    // Add logo if provided
    if (logo) {
      try {
        const logoWidth = 100;
        const logoHeight = 60;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logo, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 30;
        console.log('🖼️ Logo added successfully');
      } catch (error) {
        console.warn('Failed to add logo:', error);
      }
    }
    
    addSubtitle('Business Information', 16);
    addBodyText(`Business Name: ${business.businessName}`, 12);
    if (business.dbaName) {
      addBodyText(`DBA: ${business.dbaName}`, 12);
    }
    addBodyText(`EIN: ${business.ein}`, 12);
    addBodyText(`Entity Type: ${business.entityType}`, 12);
    addBodyText(`State: ${business.entityState}`, 12);
    addBodyText(`Year: ${year}`, 12);
    
    currentY += 20;
    
    addSubtitle('Research Leadership Team', 16);
    researchLeaders.forEach(leader => {
      addBodyText(`• ${leader}`, 12);
    });
    
    currentY += 30;
    
    addBodyText(`Report Generated: ${new Date().toLocaleDateString()}`, 10);
    addBodyText(`Copyright © ${year} ${business.businessName}. All rights reserved.`, 10);
    
    console.log('📝 Title page completed');
    
    // ===== TABLE OF CONTENTS =====
    addNewPage();
    addTitle('TABLE OF CONTENTS', 20, true);
    currentY += 30;
    
    const tocItems = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Research Activities Overview', page: 4 }
    ];
    
    let tocPage = 4;
    activities.forEach((activity, index) => {
      tocItems.push({ title: `${index + 1}. ${activity.name}`, page: tocPage });
      tocPage += Math.ceil(activity.steps.length / 2) + 2; // Estimate pages needed
    });
    
    tocItems.forEach(item => {
      const dots = '.'.repeat(50 - item.title.length);
      addBodyText(`${item.title} ${dots} ${item.page}`, 12);
    });
    
    console.log('📝 Table of contents completed');
    
    // ===== EXECUTIVE SUMMARY =====
    addNewPage();
    addTitle('EXECUTIVE SUMMARY', 20, true);
    currentY += 20;
    
    addBodyText(
      `This report documents the qualified research activities conducted by ${business.businessName} during ${year}. ` +
      `The research activities outlined in this report meet the requirements for the Research & Development Tax Credit ` +
      `under Section 41 of the Internal Revenue Code.`,
      12
    );
    
    currentY += 15;
    
    addBodyText(
      `The research activities were conducted to develop new or improved products, processes, or software, ` +
      `and involved a process of experimentation to eliminate uncertainty. The activities were technological in nature ` +
      `and were intended to be useful in the development of a new or improved business component.`,
      12
    );
    
    currentY += 15;
    
    addBodyText(
      `Total Research Activities: ${activities.length}`,
      12
    );
    
    const totalSteps = activities.reduce((sum, activity) => sum + activity.steps.length, 0);
    const totalSubcomponents = activities.reduce((sum, activity) => 
      sum + activity.steps.reduce((stepSum: number, step: ResearchStep) => stepSum + step.subcomponents.length, 0), 0
    );
    
    addBodyText(`Total Research Steps: ${totalSteps}`, 12);
    addBodyText(`Total Subcomponents: ${totalSubcomponents}`, 12);
    
    console.log('📝 Executive summary completed');
    
    // ===== RESEARCH ACTIVITIES OVERVIEW =====
    addNewPage();
    addTitle('RESEARCH ACTIVITIES OVERVIEW', 20, true);
    currentY += 20;
    
    addBodyText(
      `The following research activities were conducted during ${year}. Each activity represents a distinct ` +
      `research project with specific goals, hypotheses, and experimental processes.`,
      12
    );
    
    currentY += 20;
    
    // Create overview table
    const overviewData = activities.map((activity, index) => [
      `${index + 1}`,
      activity.name,
      activity.steps.length.toString(),
      activity.steps.reduce((sum: number, step: ResearchStep) => sum + step.subcomponents.length, 0).toString(),
      'N/A' // No description field in ResearchActivity
    ]);
    
    console.log('📊 Creating overview table with data:', overviewData);
    
    try {
      (doc as any).autoTable({
        head: [['#', 'Activity Name', 'Steps', 'Subcomponents', 'Description']],
        body: overviewData,
        startY: currentY,
        margin: { left: margin },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      console.log('📊 Overview table completed');
    } catch (tableError) {
      console.error('❌ Error creating overview table:', tableError);
      // Fallback: just add text
      activities.forEach((activity, index) => {
        addBodyText(`${index + 1}. ${activity.name} - ${activity.steps.length} steps, ${activity.steps.reduce((sum: number, step: ResearchStep) => sum + step.subcomponents.length, 0)} subcomponents`, 12);
      });
    }
    
    console.log('📝 Research activities overview completed');
    
    // ===== DETAILED ACTIVITY SECTIONS =====
    activities.forEach((activity, activityIndex) => {
      console.log(`📝 Processing activity ${activityIndex + 1}: ${activity.name}`);
      addNewPage();
      addTitle(`${activityIndex + 1}. ${activity.name}`, 18, true);
      currentY += 20;
      
      // Activity description (if available)
      if (activity.subcomponentCount !== undefined) {
        addBodyText(`This research activity involves ${activity.subcomponentCount} subcomponents across ${activity.steps.length} research steps.`, 12);
      }
      
      currentY += 15;
      
      // Research Steps Overview
      addSubtitle('Research Steps', 14);
      addBodyText(`The research process for ${activity.name} consists of the following steps:`, 12);
      
      currentY += 15;
      
      activity.steps.forEach((step, stepIndex) => {
        // Step Header
        addBodyText(`${String.fromCharCode(65 + stepIndex)}. ${step.name}`, 12, true);
        currentY += 8;
        
        if (step.subcomponents.length > 0) {
          addBodyText(`This step includes ${step.subcomponents.length} subcomponents:`, 11);
          currentY += 5;
          
          // Subcomponents for this step
          step.subcomponents.forEach((subcomponent, subIndex) => {
            const subcomponentNumber = `${String.fromCharCode(65 + stepIndex)}.${subIndex + 1}`;
            
            addBodyText(`${subcomponentNumber} ${subcomponent.name}`, 11, true);
            currentY += 5;
            
            // Add subcomponent details if available
            if (subcomponent.frequencyPercentage > 0) {
              addBodyText(`Frequency: ${subcomponent.frequencyPercentage.toFixed(1)}%`, 10);
              currentY += 3;
            }
          });
        }
        
        currentY += 10;
      });
      
      // Add section divider
      addSectionDivider();
    });
    
    console.log('📝 Detailed activity sections completed');
    
    // ===== DETAILED SUBCOMPONENT SECTIONS =====
    activities.forEach((activity, activityIndex) => {
      console.log(`📝 Processing subcomponents for activity ${activityIndex + 1}: ${activity.name}`);
      addNewPage();
      addTitle(`${activityIndex + 1}. ${activity.name} - Detailed Subcomponents`, 16, true);
      currentY += 20;
      
      activity.steps.forEach((step, stepIndex) => {
        step.subcomponents.forEach((subcomponent, subIndex) => {
          const subcomponentNumber = `${activityIndex + 1}.${stepIndex + 1}.${subIndex + 1}`;
          
          addBodyText(`${subcomponentNumber} ${subcomponent.name}`, 11, true);
          currentY += 5;
          
          // Add all available technical data
          if (subcomponent.frequencyPercentage > 0) {
            addBodyText(`Frequency: ${subcomponent.frequencyPercentage.toFixed(1)}%`, 10);
            currentY += 3;
          }
          
          // Add placeholder for technical details
          addBodyText(`Technical Description: [AI-generated content will be included here]`, 10);
          currentY += 3;
          
          addBodyText(`Research Hypothesis: [AI-generated content will be included here]`, 10);
          currentY += 3;
          
          addBodyText(`Uncertainties Addressed: [AI-generated content will be included here]`, 10);
          currentY += 3;
          
          addBodyText(`Alternatives Considered: [AI-generated content will be included here]`, 10);
          currentY += 3;
          
          addBodyText(`Developmental Process: [AI-generated content will be included here]`, 10);
          currentY += 10;
        });
      });
      
      // Add section divider
      addSectionDivider();
    });
    
    console.log('✅ PDF generation completed successfully');
    return doc;
  } catch (error) {
    console.error('❌ Error in generateRDTaxCreditReport:', error);
    throw error;
  }
};

// Export function for Research Design PDF
export const exportResearchDesignPDF = async (options: PDFExportOptions): Promise<void> => {
  const doc = await generateRDTaxCreditReport(options);
  doc.save(`research-design-${options.business.businessName}-${options.year}.pdf`);
};

// Export function for R&D Tax Credit Report
export const exportRDTaxCreditReport = async (options: PDFExportOptions): Promise<void> => {
  const doc = await generateRDTaxCreditReport(options);
  doc.save(`rd-tax-credit-report-${options.business.businessName}-${options.year}.pdf`);
};

// Generate PDF preview (returns base64 string)
export const generatePDFPreview = async (options: PDFExportOptions): Promise<string> => {
  console.log('🔧 Starting PDF preview generation with options:', options);
  
  try {
    // Test basic PDF generation first
    console.log('🧪 Testing basic PDF generation...');
    const testDoc = new jsPDF('p', 'pt', 'a4');
    testDoc.setFontSize(12);
    testDoc.text('Test PDF Generation', 40, 40);
    const testDataUri = testDoc.output('datauristring');
    console.log('✅ Basic PDF test successful, data URI length:', testDataUri.length);
    
    // Now generate the full report
    console.log('📄 Generating full PDF report...');
    const doc = await generateRDTaxCreditReport(options);
    console.log('✅ Full PDF report generated successfully');
    
    const dataUri = doc.output('datauristring');
    console.log('✅ PDF data URI generated, length:', dataUri.length);
    
    return dataUri;
  } catch (error) {
    console.error('❌ Error in generatePDFPreview:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error('❌ Non-Error thrown:', error);
    }
    throw error;
  }
}; 