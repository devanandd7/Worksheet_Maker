import puppeteer from 'puppeteer';

class PDFGeneratorService {
  /**
   * Generate PDF from worksheet content
   * @param {Object} worksheet - Worksheet document
   * @param {Object} user - User document
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateWorksheetPDF(worksheet, user) {
    let browser;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generateHTML(worksheet, user);

      // Set content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      // Always cleanup browser
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }

  /**
   * Generate HTML template for worksheet
   * @param {Object} worksheet - Worksheet data
   * @param {Object} user - User data
   * @returns {String} - HTML content
   */
  generateHTML(worksheet, user) {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const images = worksheet.images || [];

    // Format date of performance
    const dateOfPerf = worksheet.dateOfPerformance
      ? new Date(worksheet.dateOfPerformance).toLocaleDateString('en-IN')
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Worksheet - ${worksheet.topic}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.5;
      color: #000;
      font-size: 11pt;
    }

    /* Header Image Styling */
    .header-image-container {
    width: 100%;
      text-align: center;
      margin:0px;
      
    }
    .header-image-container img {
      max-width: 100%;
      height: auto;
      max-height: 100px;
    }

    /* Worksheet Heading */
    .worksheet-heading {
      text-align: center;
      font-weight: bold;
      font-size: 16pt;
  
      margin-bottom: 25px;
      margin-top: 10px;
    }
    
    /* Header Table (Student Details) */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      border: none;
   
    }
    
    .header-table td {
      border: none;
      padding: 9px 2px; /* Added horizontal padding for spacing */
      vertical-align: top;
      width: 60%; /* Two equal columns */
     
    
    }

    .detail-row {
      margin-bottom: 8px; /* Increased row spacing slightly */
    }

    .header-label {
      font-weight: bold;
      font-size: 15px; /* Explicitly set to 15px as requested */
      text-transform: uppercase; /* Make labels CAPITAL */
      margin-right: 8px; 
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-heading {
      font-weight: bold;
      font-size: 12pt;
      margin-bottom: 10px;
      text-transform: uppercase;
      /* border-bottom: 1px solid #000; Optional: keep clean */
    }
    
    .section-content {
      text-align: justify;
    }
    
    .code-block {
      background-color: #f8f9fa;
      border: 1px solid #eee;
      padding: 10px;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      white-space: pre-wrap;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .objective-list, .outcome-list {
      margin-left: 20px;
    }
    
    .image-container {
      text-align: center;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    .image-container img {
      max-width: 100%;
      max-height: 350px;
      object-fit: contain;
      border: 1px solid #eee;
    }
    .image-caption {
      font-style: italic;
      font-size: 9pt;
      margin-top: 5px;
    }

    /* Standard Elements */
    b, strong { font-weight: bold; }
    p { margin-bottom: 8px; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Header Image -->
  ${worksheet.headerImageUrl ? `
  <div class="header-image-container">
    <img src="${worksheet.headerImageUrl}" alt="University Header" />
  </div>` : ''}

  <!-- Worksheet Heading -->
  <div class="worksheet-heading">
    Worksheet No - ${this.cleanValue(worksheet.experimentNumber) || ''}
  </div>

  <!-- Student Details Table (2 Columns) -->
  <table class="header-table">
    <tr>
      <!-- Left Column -->
      <td>
        <div class="detail-row">
          <span class="header-label">Student Name:</span> ${this.cleanValue(user.name)}
        </div>
        <div class="detail-row">
          <span class="header-label">Branch:</span> ${this.cleanValue(user.branch || user.course)}
        </div>
        <div class="detail-row">
          <span class="header-label">Semester:</span> ${this.cleanValue(user.semester)}
        </div>
        <div class="detail-row">
          <span class="header-label">Subject Name:</span> ${this.cleanValue(worksheet.subject || user.defaultSubject)}
        </div>
      </td>
      
      <!-- Right Column -->
      <td ">
        <div class="detail-row">
          <span class="header-label">UID:</span> ${this.cleanValue(user.uid)}
        </div>
        <div class="detail-row">
          <span class="header-label">Section/Group:</span> ${this.cleanValue(user.section)}
        </div>
        <div class="detail-row">
          <span class="header-label">Date of Performance:</span> ${dateOfPerf}
        </div>
        <div class="detail-row">
          <span class="header-label">Subject Code:</span> 
          <!-- Subject Code Placeholder -->
        </div>
      </td>
    </tr>
  </table>

  <!-- Title (if needed, otherwise relying on Worksheet No) -->
  <!-- Check if main question title exists to decide structure -->
  ${!worksheet.content.questionTitle ? `<div style="text-align: center; font-weight: bold; margin-bottom: 20px; font-size: 14pt;">${worksheet.topic}</div>` : ''}

  ${this.renderSection('Main Question', worksheet.content.questionTitle, images, 'mainQuestion')}
  ${this.renderSection('Aim', worksheet.content.aim, images, 'aim')}
  ${this.renderSection('Problem Statement', worksheet.content.problemStatement, images, 'problemStatement')}
  ${this.renderSection('Dataset Description', worksheet.content.dataset, images, 'dataset')}
  ${this.renderObjectives(worksheet.content.objective)}
  ${this.renderCode(worksheet.content.code, images)}
  ${this.renderOutput(worksheet.content.output, images)}
  ${this.renderLearningOutcomes(worksheet.content.learningOutcome)}
  ${this.renderSection('Conclusion', worksheet.content.conclusion, images, 'conclusion')}
  
  ${this.renderAdditionalImages(images, worksheet.content)}

</body>
</html>
    `.trim();
  }

  // Helper to render images for a specific section
  renderImagesForSection(images, sectionName) {
    if (!images || !sectionName) return '';

    // Normalize section name for comparison (case-insensitive)
    const normalizedSection = sectionName.toLowerCase();

    const sectionImages = images.filter(img =>
      (img.section && img.section.toLowerCase() === normalizedSection) ||
      // Fallback for 'output' if mapped to 'result' or vice versa
      (normalizedSection === 'output' && img.section.toLowerCase() === 'result') ||
      (normalizedSection === 'aim' && img.section.toLowerCase() === 'overview')
    );

    if (sectionImages.length === 0) return '';

    return sectionImages.map(img => `
    <div class="image-container">
      <img src="${img.url}" alt="${img.caption || 'Section Image'}" />
      <div class="image-caption">${img.caption || `Figure: ${sectionName} Image`}</div>
    </div>`).join('');
  }

  renderAdditionalImages(images, content) {
    if (!images || images.length === 0) return '';

    // Define standard sections that might have images
    const standardSections = ['mainQuestion', 'aim', 'problemStatement', 'dataset', 'code', 'output', 'overview', 'result'];

    // Normalize image sections
    const unassignedImages = images.filter(img => {
      if (!img.section) return true;
      const section = img.section.toLowerCase();
      // Check if this section is one of the standard ones we already rendered
      // Note: 'overview' maps to 'aim', 'result' maps to 'output'
      return !standardSections.includes(section);
    });

    if (unassignedImages.length === 0) return '';

    return `
  <div class="section">
    <div class="section-heading">Additional Resources</div>
    ${unassignedImages.map(img => `
    <div class="image-container">
      <img src="${img.url}" alt="${img.caption || 'Additional Image'}" />
      <div class="image-caption">${img.caption || 'Figure: Additional Resource'}</div>
    </div>`).join('')}
  </div>`;
  }

  renderSection(heading, content, images = [], sectionKey = '') {
    if (!content) return '';
    return `
  <div class="section">
    <div class="section-heading">${heading}</div>
    <div class="section-content">${content}</div>
    ${this.renderImagesForSection(images, sectionKey)}
  </div>`;
  }

  renderObjectives(objectives) {
    if (!objectives || objectives.length === 0) return '';
    return `
  <div class="section">
    <div class="section-heading">Objective</div>
    <ul class="objective-list">
      ${objectives.map(obj => `<li>${obj}</li>`).join('\n      ')}
    </ul>
  </div>`;
  }

  renderCode(code, images = []) {
    if (!code) return '';

    let codeSource = code;
    let codeExplanation = '';
    let languageLabel = '';

    // Handle code object structure
    if (typeof code === 'object') {
      codeSource = code.source || '';
      codeExplanation = code.explanation || '';
      languageLabel = code.language ? ` (${code.language})` : '';
    }

    if (!codeSource && !codeExplanation) return '';

    let html = `
  <div class="section">
    <div class="section-heading">Code / Implementation${this.escapeHtml(languageLabel)}</div>`;

    if (codeSource) {
      html += `
    <pre class="code-block">${this.escapeHtml(codeSource)}</pre>`;
    }

    // Render images assigned to 'code' section
    html += this.renderImagesForSection(images, 'code');

    if (codeExplanation) {
      html += `
    <div class="section-content" style="margin-top: 10px; font-style: italic;">
      <b>Explanation:</b><br/>
      ${codeExplanation}
    </div>`;
    }

    html += `
  </div>`;
    return html;
  }

  renderOutput(output, images = []) {
    let html = `
  <div class="section">
    <div class="section-heading">Output</div>
    <div class="section-content">${output || 'No output description provided'}</div>`;

    // Render images assigned to 'output' section
    html += this.renderImagesForSection(images, 'output');

    html += `
  </div>`;
    return html;
  }

  renderLearningOutcomes(outcomes) {
    if (!outcomes || outcomes.length === 0) return '';
    return `
  <div class="section">
    <div class="section-heading">Learning Outcome</div>
    <ul class="outcome-list">
      ${outcomes.map(outcome => `<li>${outcome}</li>`).join('\n      ')}
    </ul>
  </div>`;
  }

  cleanValue(val) {
    if (!val) return '';
    const strVal = String(val).trim();
    if (strVal.toUpperCase() === 'N/A' || strVal.toUpperCase() === 'NA') return '';
    return strVal;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }
}

export default new PDFGeneratorService();
