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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      if (browser) await browser.close();
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
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
      line-height: 1.6;
      color: #000;
      font-size: 12pt;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border: none; /* Removed border */
    }
    
    .header-table td {
      border: none; /* Removed border */
      padding: 6px 8px; /* Slightly reduced padding for tighter vertical rhythm if needed, or keep generous */
      font-size: 11pt;
      vertical-align: top;
    }
    
    .header-label {
      font-weight: bold;
      width: 25%; /* Adjusted width */
      color: #333;
    }

    .header-value {
      width: 25%;
      border-bottom: 1px solid #eee !important;
      font-weight: 700; /* Bold */
      color: #000000;   /* Dark Black */
    }
    
    .title {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 25px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-heading {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 12px;
      text-decoration: none; /* Removed underline per "modern" request, or keep? specific request was header table. Let's keep typical section styles but clean up */
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      color: #222;
    }
    
    .section-content {
      margin-left: 10px; /* Reduced indent for cleaner look */
      text-align: justify;
    }
    
    .code-block {
      background-color: #f8f9fa;
      border: 1px solid #eee;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      white-space: pre-wrap;
      margin: 10px 0;
      line-height: 1.4;
      border-radius: 4px;
    }
    
    .objective-list, .outcome-list {
      margin-left: 30px;
    }
    
    .objective-list li, .outcome-list li {
      margin-bottom: 8px;
    }
    
    .image-container {
      text-align: center;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .image-container img {
      max-width: 90%;
      height: auto;
      border: 1px solid #eee;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Softer shadow */
    }
    
    .image-caption {
      font-style: italic;
      font-size: 10pt;
      margin-top: 8px;
      color: #555;
    }

    /* Enhanced Formatting for AI Content */
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 5px;
    }
    b, strong {
      font-weight: bold;
    }
    p {
      margin-bottom: 10px;
    }
    
    /* Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 11pt;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    
    /* Remove borders from the header table specifically again to be safe if generic table style overrides */
    .header-table, .header-table td {
        border: none !important;
    }

    /* Header Image Styling */
    .header-image-container {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header-image-container img {
      max-width: 100%;
      height: auto;
      max-height: 120px; /* Limit height to prevent taking up too much space */
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Header Image (University/College Logo) -->
  ${worksheet.headerImageUrl ? `
  <div class="header-image-container">
    <img src="${worksheet.headerImageUrl}" alt="University Header" />
  </div>` : ''}

  <!-- Header Table -->
  <table class="header-table">
    <tr>
      <td class="header-label">Experiment No:</td>
      <td class="header-value">${this.cleanValue(worksheet.experimentNumber)}</td>
      <td class="header-label">Date:</td>
      <td class="header-value">${worksheet.dateOfPerformance ? new Date(worksheet.dateOfPerformance).toLocaleDateString('en-IN') : ''}</td>
    </tr>
    <tr>
      <td class="header-label">Student Name:</td>
      <td class="header-value">${this.cleanValue(user.name)}</td>
      <td class="header-label">UID:</td>
      <td class="header-value">${this.cleanValue(user.uid)}</td>
    </tr>
    <tr>
      <td class="header-label">Branch:</td>
      <td class="header-value">${this.cleanValue(user.branch || user.course)}</td>
      <td class="header-label">Section/Group:</td>
      <td class="header-value">${this.cleanValue(user.section)}</td>
    </tr>
    <tr>
      <td class="header-label">Semester:</td>
      <td class="header-value">${this.cleanValue(user.semester)}</td>
      <td class="header-label">Subject:</td>
      <td class="header-value">${this.cleanValue(user.defaultSubject)}</td>
    </tr>
  </table>

  <!-- Title (Only show if no structured, formatted question title exists) -->
  ${!worksheet.content.questionTitle ? `<div class="title">${worksheet.topic}</div>` : ''}

  ${this.renderSection('Main Question', worksheet.content.questionTitle, images, 'mainQuestion')}
  ${this.renderSection('Aim / Overview of the Practical', worksheet.content.aim, images, 'aim')}
  ${this.renderSection('Problem Statement', worksheet.content.problemStatement, images, 'problemStatement')}
  ${this.renderSection('Dataset', worksheet.content.dataset, images, 'dataset')}
  ${this.renderObjectives(worksheet.content.objective)}
  ${this.renderCode(worksheet.content.code, images)}
  ${this.renderOutput(worksheet.content.output, images)}
  ${this.renderLearningOutcomes(worksheet.content.learningOutcome)}

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
