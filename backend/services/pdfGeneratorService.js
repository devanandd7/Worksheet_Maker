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
      margin-bottom: 20px;
      border: 2px solid #000;
    }
    
    .header-table td {
      border: 1px solid #000;
      padding: 8px;
      font-size: 11pt;
    }
    
    .header-label {
      font-weight: bold;
      width: 30%;
    }
    
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 20px;
      text-decoration: underline;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-heading {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 10px;
      text-decoration: underline;
    }
    
    .section-content {
      margin-left: 20px;
      text-align: justify;
    }
    
    .code-block {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      white-space: pre-wrap;
      margin: 10px 0;
      line-height: 1.4;
    }
    
    .objective-list, .outcome-list {
      margin-left: 40px;
    }
    
    .objective-list li, .outcome-list li {
      margin-bottom: 8px;
    }
    
    .image-container {
      text-align: center;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    .image-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #ccc;
    }
    
    .image-caption {
      font-style: italic;
      font-size: 10pt;
      margin-top: 5px;
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
  <!-- Header Table -->
  <table class="header-table">
    <tr>
      <td class="header-label">Experiment No:</td>
      <td>${worksheet.experimentNumber || 'N/A'}</td>
      <td class="header-label">Date of Performance:</td>
      <td>${new Date(worksheet.dateOfPerformance).toLocaleDateString('en-IN')}</td>
    </tr>
    <tr>
      <td class="header-label">Student Name:</td>
      <td>${user.name}</td>
      <td class="header-label">UID:</td>
      <td>${user.uid || 'N/A'}</td>
    </tr>
    <tr>
      <td class="header-label">Branch:</td>
      <td>${user.branch || user.course}</td>
      <td class="header-label">Section/Group:</td>
      <td>${user.section || 'N/A'}</td>
    </tr>
    <tr>
      <td class="header-label">Semester:</td>
      <td>${user.semester}</td>
      <td class="header-label">Subject Name:</td>
      <td>${user.defaultSubject || 'N/A'}</td>
    </tr>
  </table>

  <!-- Title -->
  <div class="title">${worksheet.topic}</div>

  ${this.renderSection('Aim / Overview of the Practical', worksheet.content.aim)}
  ${this.renderSection('Problem Statement', worksheet.content.problemStatement)}
  ${this.renderSection('Dataset', worksheet.content.dataset)}
  ${this.renderObjectives(worksheet.content.objective)}
  ${this.renderCode(worksheet.content.code)}
  ${this.renderOutput(worksheet.content.output, worksheet.images)}
  ${this.renderLearningOutcomes(worksheet.content.learningOutcome)}

</body>
</html>
    `.trim();
  }

  renderSection(heading, content) {
    if (!content) return '';
    return `
  <div class="section">
    <div class="section-heading">${heading}</div>
    <div class="section-content">${content}</div>
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

  renderCode(code) {
    if (!code) return '';
    return `
  <div class="section">
    <div class="section-heading">Code / Implementation</div>
    <pre class="code-block">${this.escapeHtml(code)}</pre>
  </div>`;
  }

  renderOutput(output, images) {
    let html = `
  <div class="section">
    <div class="section-heading">Output</div>
    <div class="section-content">${output || 'No output description provided'}</div>`;

    // Add images if present in Output section
    const outputImages = images?.filter(img => img.section === 'Output') || [];
    if (outputImages.length > 0) {
      outputImages.forEach(img => {
        html += `
    <div class="image-container">
      <img src="${img.url}" alt="${img.caption || 'Output image'}" />
      <div class="image-caption">${img.caption || 'Output Screenshot'}</div>
    </div>`;
      });
    }

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

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export default new PDFGeneratorService();
