import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, Header, Footer, BorderStyle, LevelFormat } from 'docx';
import axios from 'axios';

class DocxGeneratorService {
    /**
     * Generate DOCX from worksheet content
     * @param {Object} worksheet - Worksheet document
     * @param {Object} user - User document
     * @returns {Promise<Buffer>} - DOCX buffer
     */
    async generateWorksheetDocx(worksheet, user) {
        try {
            // 1. Fetch header image if it exists
            let headerImageData = null;
            if (worksheet.headerImageUrl) {
                try {
                    const response = await axios.get(worksheet.headerImageUrl, { responseType: 'arraybuffer' });
                    headerImageData = response.data;
                } catch (imgError) {
                    console.error('⚠️ Failed to fetch header image for DOCX:', imgError.message);
                }
            }

            // 2. Prepare content
            const dateOfPerf = worksheet.dateOfPerformance
                ? new Date(worksheet.dateOfPerformance).toLocaleDateString('en-IN')
                : '';

            // Define sections
            const children = [];

            // ========================================
            // WORKSHEET HEADING
            // ========================================
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 200 },
                children: [
                    new TextRun({
                        text: `Worksheet No - ${worksheet.experimentNumber || 'N/A'}`,
                        bold: true,
                        size: 32,
                    }),
                ],
            }));

            // ========================================
            // STUDENT DETAILS TABLE
            // ========================================
            const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

            children.push(new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: [4680, 4680],
                borders: {
                    top: noBorder,
                    bottom: noBorder,
                    left: noBorder,
                    right: noBorder,
                    insideHorizontal: noBorder,
                    insideVertical: noBorder,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 4680, type: WidthType.DXA },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: {
                                    top: noBorder,
                                    bottom: noBorder,
                                    left: noBorder,
                                    right: noBorder,
                                },
                                children: [
                                    this.createDetailPara('STUDENT NAME:', user.name),
                                    this.createDetailPara('BRANCH:', user.branch || user.course),
                                    this.createDetailPara('SEMESTER:', user.semester),
                                    this.createDetailPara('SUBJECT NAME:', worksheet.subject || ''),
                                ],
                            }),
                            new TableCell({
                                width: { size: 4680, type: WidthType.DXA },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: {
                                    top: noBorder,
                                    bottom: noBorder,
                                    left: noBorder,
                                    right: noBorder,
                                },
                                children: [
                                    this.createDetailPara('UID:', user.uid),
                                    this.createDetailPara('SECTION/GROUP:', user.section),
                                    this.createDetailPara('DATE OF PERFORMANCE:', dateOfPerf),
                                    this.createDetailPara('SUBJECT CODE:', ''),
                                ],
                            }),
                        ],
                    }),
                ],
            }));

            // Spacing after table
            children.push(new Paragraph({ spacing: { after: 200 } }));

            // ========================================
            // TOPIC (if no question title)
            // ========================================
            if (!worksheet.content.questionTitle) {
                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: worksheet.topic || '',
                            bold: true,
                            size: 28,
                        }),
                    ],
                }));
            }

            // ========================================
            // MAIN SECTIONS
            // ========================================
            await this.addSection(children, 'MAIN QUESTION', worksheet.content.questionTitle, worksheet.images, 'mainQuestion');
            await this.addSection(children, 'AIM', worksheet.content.aim, worksheet.images, 'aim');
            await this.addSection(children, 'PROBLEM STATEMENT', worksheet.content.problemStatement, worksheet.images, 'problemStatement');
            await this.addSection(children, 'DATASET DESCRIPTION', worksheet.content.dataset, worksheet.images, 'dataset');

            // ========================================
            // OBJECTIVE (with HTML parsing)
            // ========================================
            if (worksheet.content.objective && worksheet.content.objective.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'OBJECTIVE', bold: true, size: 24 })],
                    spacing: { before: 200, after: 150 },
                }));

                worksheet.content.objective.forEach(obj => {
                    const textRuns = this.parseInlineHTML(obj);
                    children.push(new Paragraph({
                        numbering: { reference: 'my-bullets', level: 0 },
                        spacing: { before: 50, after: 50 },
                        indent: { left: 360, right: 0 },
                        children: textRuns.length > 0 ? textRuns : [new TextRun({ text: obj, size: 20 })],
                    }));
                });
            }

            // ========================================
            // CODE / IMPLEMENTATION
            // ========================================
            if (worksheet.content.code) {
                const code = worksheet.content.code;
                const source = typeof code === 'string' ? code : (code.source || '');
                const lang = code.language ? ` (${code.language})` : '';

                children.push(new Paragraph({
                    children: [new TextRun({ text: `CODE / IMPLEMENTATION${lang}`, bold: true, size: 24 })],
                    spacing: { before: 200, after: 150 },
                }));

                if (source) {
                    children.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: source,
                                font: 'Courier New',
                                size: 18,
                            }),
                        ],
                        shading: { type: 'solid', fill: 'F5F5F5' },
                        spacing: { before: 100, after: 100 },
                    }));
                }

                await this.addImages(children, worksheet.images, 'code');

                if (typeof code === 'object' && code.explanation) {
                    await this.addHtmlContent(children, code.explanation, { before: 150, after: 100 });
                }
            }

            // ========================================
            // OUTPUT
            // ========================================
            await this.addSection(children, 'OUTPUT', worksheet.content.output, worksheet.images, 'output');

            // ========================================
            // LEARNING OUTCOMES (with HTML parsing)
            // ========================================
            if (worksheet.content.learningOutcome && worksheet.content.learningOutcome.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'LEARNING OUTCOME', bold: true, size: 24 })],
                    spacing: { before: 200, after: 150 },
                }));

                worksheet.content.learningOutcome.forEach(outcome => {
                    const textRuns = this.parseInlineHTML(outcome);
                    children.push(new Paragraph({
                        numbering: { reference: 'my-bullets', level: 0 },
                        spacing: { before: 50, after: 50 },
                        indent: { left: 360, right: 0 },
                        children: textRuns.length > 0 ? textRuns : [new TextRun({ text: outcome, size: 20 })],
                    }));
                });
            }

            // ========================================
            // DOCUMENT GENERATION
            // ========================================
            const doc = new Document({
                numbering: {
                    config: [
                        {
                            reference: 'my-bullets',
                            levels: [{
                                level: 0,
                                format: LevelFormat.BULLET,
                                text: '•',
                                alignment: AlignmentType.LEFT,
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 360 }
                                    }
                                }
                            }]
                        },
                        {
                            reference: 'my-numbers',
                            levels: [{
                                level: 0,
                                format: LevelFormat.DECIMAL,
                                text: '%1.',
                                alignment: AlignmentType.LEFT,
                                style: {
                                    paragraph: {
                                        indent: { left: 720, hanging: 360 }
                                    }
                                }
                            }]
                        }
                    ]
                },
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: headerImageData ? 1134 : 1134,
                                right: 1440,
                                bottom: 1134,
                                left: 1440,
                            }
                        }
                    },
                    headers: {
                        default: new Header({
                            children: headerImageData ? [
                                new Paragraph({
                                    spacing: { after: 0 },
                                    children: [
                                        new ImageRun({
                                            data: headerImageData,
                                            transformation: {
                                                width: 595,
                                                height: 80,
                                            },
                                        }),
                                    ],
                                }),
                            ] : [],
                        }),
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: '',
                                            size: 16,
                                            color: '666666',
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    },
                    children: children,
                }],
            });

            return await Packer.toBuffer(doc);
        } catch (error) {
            console.error('❌ DOCX generation error:', error);
            throw new Error('Failed to generate DOCX: ' + error.message);
        }
    }

    /**
     * Create a detail paragraph for student info table
     */
    createDetailPara(label, value) {
        return new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [
                new TextRun({ text: label, bold: true, size: 20 }),
                new TextRun({ text: ` ${value || ''}`, size: 20 }),
            ],
        });
    }

    /**
     * Add a section with heading, content, and images
     */
    async addSection(children, heading, content, images, sectionKey) {
        if (!content && !this.hasImages(images, sectionKey)) return;

        children.push(new Paragraph({
            children: [new TextRun({ text: heading, bold: true, size: 24 })],
            spacing: { before: 200, after: 150 },
        }));

        if (content) {
            await this.addHtmlContent(children, content, { before: 50, after: 100 });
        }

        await this.addImages(children, images, sectionKey);
    }

    /**
     * Parse HTML content and add formatted paragraphs to children
     * Supports: <p>, <b>, <strong>, <i>, <em>, <u>, <code>, <ul>, <ol>, <li>
     */
    async addHtmlContent(children, htmlContent, spacing = {}) {
        if (!htmlContent) return;

        // Clean up outer wrappers
        let cleaned = htmlContent
            .replace(/^<div[^>]*>/i, '')
            .replace(/<\/div>$/i, '')
            .trim();

        // ========================================
        // HANDLE UNORDERED LISTS (bullets)
        // ========================================
        const ulMatches = cleaned.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi);
        if (ulMatches) {
            ulMatches.forEach(ulBlock => {
                const items = ulBlock.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
                if (items) {
                    items.forEach(item => {
                        const itemContent = item.replace(/<\/?li[^>]*>/gi, '').trim();
                        const textRuns = this.parseInlineHTML(itemContent);

                        if (textRuns.length > 0) {
                            children.push(new Paragraph({
                                numbering: { reference: 'my-bullets', level: 0 },
                                spacing: { before: 50, after: 50 },
                                indent: { left: 360, right: 0 },
                                children: textRuns,
                            }));
                        }
                    });
                }
            });
            cleaned = cleaned.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, '');
        }

        // ========================================
        // HANDLE ORDERED LISTS (numbers)
        // ========================================
        const olMatches = cleaned.match(/<ol[^>]*>[\s\S]*?<\/ol>/gi);
        if (olMatches) {
            olMatches.forEach(olBlock => {
                const items = olBlock.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
                if (items) {
                    items.forEach(item => {
                        const itemContent = item.replace(/<\/?li[^>]*>/gi, '').trim();
                        const textRuns = this.parseInlineHTML(itemContent);

                        if (textRuns.length > 0) {
                            children.push(new Paragraph({
                                numbering: { reference: 'my-numbers', level: 0 },
                                spacing: { before: 50, after: 50 },
                                indent: { left: 360, right: 0 },
                                children: textRuns,
                            }));
                        }
                    });
                }
            });
            cleaned = cleaned.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');
        }

        // ========================================
        // HANDLE REGULAR PARAGRAPHS
        // ========================================
        const paragraphs = cleaned
            .split(/<\/?p[^>]*>/gi)
            .filter(p => p.trim() && !p.match(/^<\/?[a-z]/i));

        paragraphs.forEach(para => {
            const trimmed = para.trim();
            if (!trimmed) return;

            const textRuns = this.parseInlineHTML(trimmed);
            if (textRuns.length > 0) {
                children.push(new Paragraph({
                    alignment: AlignmentType.JUSTIFY,
                    spacing: spacing,
                    children: textRuns,
                }));
            }
        });
    }

    /**
     * Parse inline HTML tags and return TextRun array
     * Supports: <b>, <strong>, <i>, <em>, <u>, <code>, and nested combinations
     */
    parseInlineHTML(html) {
        if (!html || typeof html !== 'string') return [];

        // Step 1: Normalize and clean
        let cleaned = html.replace(/\>\>/g, '').trim();

        // Step 2: Convert HTML tags to internal markers
        cleaned = cleaned.replace(/<b>(.*?)<\/b>/gi, '§BOLD§$1§/BOLD§');
        cleaned = cleaned.replace(/<strong>(.*?)<\/strong>/gi, '§BOLD§$1§/BOLD§');
        cleaned = cleaned.replace(/<i>(.*?)<\/i>/gi, '§ITALIC§$1§/ITALIC§');
        cleaned = cleaned.replace(/<em>(.*?)<\/em>/gi, '§ITALIC§$1§/ITALIC§');
        cleaned = cleaned.replace(/<u>(.*?)<\/u>/gi, '§UNDERLINE§$1§/UNDERLINE§');
        cleaned = cleaned.replace(/<code>(.*?)<\/code>/gi, '§CODE§$1§/CODE§');

        // Step 3: Remove ALL remaining HTML tags
        cleaned = cleaned.replace(/<[^>]+>/g, '');

        // Step 4: Decode HTML entities
        cleaned = this.decodeHtmlEntities(cleaned);

        // Step 5: Parse markers and create text runs
        const segments = cleaned.split(/(§BOLD§|§\/BOLD§|§ITALIC§|§\/ITALIC§|§UNDERLINE§|§\/UNDERLINE§|§CODE§|§\/CODE§)/);
        const textRuns = [];

        let currentBold = false;
        let currentItalic = false;
        let currentUnderline = false;
        let currentCode = false;

        for (const segment of segments) {
            if (segment === '§BOLD§') {
                currentBold = true;
            } else if (segment === '§/BOLD§') {
                currentBold = false;
            } else if (segment === '§ITALIC§') {
                currentItalic = true;
            } else if (segment === '§/ITALIC§') {
                currentItalic = false;
            } else if (segment === '§UNDERLINE§') {
                currentUnderline = true;
            } else if (segment === '§/UNDERLINE§') {
                currentUnderline = false;
            } else if (segment === '§CODE§') {
                currentCode = true;
            } else if (segment === '§/CODE§') {
                currentCode = false;
            } else if (segment && segment.trim()) {
                const runOptions = {
                    text: segment,
                    size: 20,
                };

                if (currentBold) runOptions.bold = true;
                if (currentItalic) runOptions.italics = true;
                if (currentUnderline) runOptions.underline = {};
                if (currentCode) {
                    runOptions.font = 'Courier New';
                    runOptions.shading = { type: 'solid', fill: 'F5F5F5' };
                }

                textRuns.push(new TextRun(runOptions));
            }
        }

        // Fallback: if no runs created, return plain text
        if (textRuns.length === 0 && html.trim()) {
            const plainText = html.replace(/<[^>]*>/g, '').replace(/\>\>/g, '').trim();
            if (plainText) {
                textRuns.push(new TextRun({ text: plainText, size: 20 }));
            }
        }

        return textRuns;
    }

    /**
     * Decode common HTML entities
     */
    decodeHtmlEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'",
            '&nbsp;': ' ',
            '&mdash;': '—',
            '&ndash;': '–',
            '&hellip;': '...',
            '&rsquo;': '\u2019',  // Right single quote
            '&lsquo;': '\u2018',  // Left single quote
            '&rdquo;': '\u201D',  // Right double quote
            '&ldquo;': '\u201C',  // Left double quote
        };

        let decoded = text;
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }

        return decoded;
    }

    /**
     * Check if images exist for a section
     */
    hasImages(images, sectionKey) {
        if (!images || !sectionKey) return false;
        const normalizedSection = sectionKey.toLowerCase();
        return images.some(img =>
            (img.section && img.section.toLowerCase() === normalizedSection) ||
            (normalizedSection === 'output' && img.section && img.section.toLowerCase() === 'result')
        );
    }

    /**
     * Add images for a section
     */
    async addImages(children, images, sectionKey) {
        if (!images || !sectionKey) return;

        const normalizedSection = sectionKey.toLowerCase();
        const sectionImages = images.filter(img =>
            (img.section && img.section.toLowerCase() === normalizedSection) ||
            (normalizedSection === 'output' && img.section && img.section.toLowerCase() === 'result')
        );

        for (const img of sectionImages) {
            try {
                const response = await axios.get(img.url, { responseType: 'arraybuffer' });

                // Add image
                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 150, after: 100 },
                    children: [
                        new ImageRun({
                            data: response.data,
                            transformation: {
                                width: 400,
                                height: 300,
                            },
                        }),
                    ],
                }));

                // Add caption
                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 150 },
                    children: [
                        new TextRun({
                            text: img.caption || 'Figure',
                            italics: true,
                            size: 18,
                            color: '666666'
                        }),
                    ],
                }));
            } catch (err) {
                console.error(`⚠️ Failed to add image to DOCX: ${err.message}`);
            }
        }
    }
}

export default new DocxGeneratorService();