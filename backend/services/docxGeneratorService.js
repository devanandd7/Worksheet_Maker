import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, Header, Footer, BorderStyle, LevelFormat, VerticalAlign } from 'docx';
import axios from 'axios';

class DocxGeneratorService {
    async generateWorksheetDocx(worksheet, user) {
        try {
            let headerImageData = null;
            if (worksheet.headerImageUrl) {
                try {
                    const response = await axios.get(worksheet.headerImageUrl, { responseType: 'arraybuffer' });
                    headerImageData = response.data;
                } catch (imgError) {
                    console.error('⚠️ Failed to fetch header image for DOCX:', imgError.message);
                }
            }

            const dateOfPerf = worksheet.dateOfPerformance
                ? new Date(worksheet.dateOfPerformance).toLocaleDateString('en-IN')
                : '';

            const children = [];

            // WORKSHEET HEADING
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 200 },
                children: [
                    new TextRun({
                        text: `Worksheet No - ${worksheet.experimentNumber || ''}`,
                        bold: true,
                        size: 32,
                    }),
                ],
            }));

            // STUDENT DETAILS TABLE
            const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
                    insideHorizontal: noBorder, insideVertical: noBorder,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                                children: [
                                    this.createDetailPara('STUDENT NAME:', user.name),
                                    this.createDetailPara('BRANCH:', user.branch || user.course),
                                    this.createDetailPara('SEMESTER:', user.semester),
                                    this.createDetailPara('SUBJECT NAME:', worksheet.subject || ''),
                                ],
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
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

            children.push(new Paragraph({ spacing: { after: 200 } }));

            // MAIN QUESTION TITLE
            let mainQContent = worksheet.content.questionTitle || worksheet.content.mainQuestionTitle || worksheet.topic || '';
            const mainQText = mainQContent.replace(/<[^>]*>/g, '').replace(/^Experiment:\s*/i, '').trim();

            if (mainQText) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'MAIN QUESTION', bold: true, size: 24 })],
                    spacing: { before: 200, after: 150 },
                }));

                children.push(new Paragraph({
                    children: [new TextRun({ text: mainQText, bold: true, size: 22 })],
                    spacing: { before: 50, after: 150 },
                }));
            }

            // MULTI-PART QUESTION BREAKDOWN
            if (worksheet.content.questionParts && worksheet.content.questionParts.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'Question Parts:', bold: true, size: 20, underline: {} })],
                    spacing: { before: 100, after: 100 },
                }));

                worksheet.content.questionParts.forEach(part => {
                    children.push(new Paragraph({
                        children: [
                            new TextRun({ text: `${part.part}. `, bold: true, size: 20 }),
                            new TextRun({ text: part.title || part.description, bold: true, size: 20 })
                        ],
                        spacing: { before: 80, after: 50 },
                        indent: { left: 360 }
                    }));

                    if (part.title && part.description && part.title !== part.description) {
                        children.push(new Paragraph({
                            children: [new TextRun({ text: part.description, size: 20 })],
                            spacing: { after: 80 },
                            indent: { left: 720 }
                        }));
                    }
                });

                children.push(new Paragraph({ spacing: { after: 200 } }));
            }

            await this.addSection(children, 'AIM', worksheet.content.aim, worksheet.images, 'aim');
            await this.addSection(children, 'PROBLEM STATEMENT', worksheet.content.problemStatement, worksheet.images, 'problemStatement');
            await this.addSection(children, 'DATASET DESCRIPTION', worksheet.content.dataset, worksheet.images, 'dataset');

            if (worksheet.content.algorithm) {
                await this.addSection(children, 'ALGORITHM', worksheet.content.algorithm, worksheet.images, 'algorithm');
            }

            // OBJECTIVE (bullet points)
            if (worksheet.content.objective && worksheet.content.objective.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'OBJECTIVE', bold: true, size: 24 })],
                    spacing: { before: 300, after: 150 },
                    border: { bottom: { color: "333333", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                }));

                worksheet.content.objective.forEach(obj => {
                    const textRuns = this.parseInlineHTML(obj);
                    children.push(new Paragraph({
                        numbering: { reference: 'my-bullets', level: 0 },
                        spacing: { before: 80, after: 80 },
                        indent: { left: 720, hanging: 360 },
                        children: textRuns.length > 0 ? textRuns : [new TextRun({ text: obj, size: 20 })],
                    }));
                });

                children.push(new Paragraph({ spacing: { after: 200 } }));
            }

            // CODE SECTION (if present)
            if (worksheet.content.code) {
                const code = worksheet.content.code;
                const source = typeof code === 'string' ? code : (code.source || '');
                const lang = code.language ? ` (${code.language.toUpperCase()})` : '';

                children.push(new Paragraph({
                    children: [new TextRun({ text: `CODE / IMPLEMENTATION${lang}`, bold: true, size: 24 })],
                    spacing: { before: 300, after: 150 },
                    border: { bottom: { color: "333333", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                }));

                if (source) {
                    const codeLines = source.split(/\r?\n/);
                    const codeRuns = [];
                    codeLines.forEach((line, index) => {
                        codeRuns.push(new TextRun({
                            text: line,
                            font: 'Courier New',
                            size: 18,
                            break: index > 0 ? 1 : 0
                        }));
                    });

                    children.push(new Paragraph({
                        children: codeRuns,
                        shading: { type: 'solid', fill: 'F5F5F5' },
                        spacing: { before: 100, after: 100 },
                        indent: { left: 360, right: 360 }
                    }));
                }

                await this.addImages(children, worksheet.images, 'code');

                if (typeof code === 'object' && code.explanation) {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: 'Code Explanation:', bold: true, size: 20 })],
                        spacing: { before: 150, after: 100 },
                    }));
                    await this.addHtmlContent(children, code.explanation, { before: 50, after: 100 });
                }

                children.push(new Paragraph({ spacing: { after: 200 } }));
            }

            await this.addSection(children, 'OUTPUT', worksheet.content.output, worksheet.images, 'output');

            if (worksheet.content.observation) {
                await this.addSection(children, 'OBSERVATION', worksheet.content.observation, worksheet.images, 'observation');
            }

            if (worksheet.content.additionalNotes) {
                await this.addSection(children, 'ADDITIONAL NOTES', worksheet.content.additionalNotes, worksheet.images, null);
            }

            // LEARNING OUTCOMES (bullet points)
            if (worksheet.content.learningOutcome && worksheet.content.learningOutcome.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'LEARNING OUTCOME', bold: true, size: 24 })],
                    spacing: { before: 300, after: 150 },
                    border: { bottom: { color: "333333", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                }));

                worksheet.content.learningOutcome.forEach(outcome => {
                    const textRuns = this.parseInlineHTML(outcome);
                    children.push(new Paragraph({
                        numbering: { reference: 'my-bullets', level: 0 },
                        spacing: { before: 80, after: 80 },
                        indent: { left: 720, hanging: 360 },
                        children: textRuns.length > 0 ? textRuns : [new TextRun({ text: outcome, size: 20 })],
                    }));
                });
            }

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
                                style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                            }]
                        },
                        {
                            reference: 'my-numbers',
                            levels: [{
                                level: 0,
                                format: LevelFormat.DECIMAL,
                                text: '%1.',
                                alignment: AlignmentType.LEFT,
                                style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                            }]
                        }
                    ]
                },
                sections: [{
                    properties: {
                        page: {
                            margin: { top: headerImageData ? 1134 : 1134, right: 1440, bottom: 1134, left: 1440 }
                        }
                    },
                    headers: {
                        default: new Header({
                            children: headerImageData ? [
                                new Paragraph({
                                    spacing: { after: 0 },
                                    alignment: AlignmentType.CENTER,
                                    children: [new ImageRun({ data: headerImageData, transformation: { width: 595, height: 80 } })],
                                }),
                            ] : [],
                        }),
                    },
                    footers: {
                        default: new Footer({
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '', size: 16, color: '666666' })], })],
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

    createDetailPara(label, value) {
        return new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [
                new TextRun({ text: label, bold: true, size: 20 }),
                new TextRun({ text: ` ${value || ''}`, size: 20 }),
            ],
        });
    }

    async addSection(children, heading, content, images, sectionKey) {
        if (!content && !this.hasImages(images, sectionKey)) return;

        children.push(new Paragraph({
            children: [new TextRun({ text: heading, bold: true, size: 24 })],
            spacing: { before: 300, after: 150 },
            border: { bottom: { color: "333333", space: 1, style: BorderStyle.SINGLE, size: 6 } }
        }));

        if (content) {
            await this.addHtmlContent(children, content, { before: 50, after: 100 });
        }

        if (sectionKey) {
            await this.addImages(children, images, sectionKey);
        }

        children.push(new Paragraph({ spacing: { after: 200 } }));
    }

    async addHtmlContent(children, htmlContent, spacing = {}) {
        if (!htmlContent) return;

        let cleaned = htmlContent.replace(/^<div[^>]*>/i, '').replace(/<\/div>$/i, '').trim();
        const parts = cleaned.split(/(<table[^>]*>[\s\S]*?<\/table>)/gi);

        for (const part of parts) {
            if (part.match(/^<table/i)) {
                this.addTable(children, part);
            } else {
                this.processRegularContent(children, part, spacing);
            }
        }
    }

    processRegularContent(children, content, spacing) {
        let cleaned = content;

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
                                spacing: { before: 80, after: 80 },
                                indent: { left: 720, hanging: 360 },
                                children: textRuns,
                            }));
                        }
                    });
                }
            });
            cleaned = cleaned.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, '');
        }

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
                                spacing: { before: 80, after: 80 },
                                indent: { left: 720, hanging: 360 },
                                children: textRuns,
                            }));
                        }
                    });
                }
            });
            cleaned = cleaned.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');
        }

        const paragraphs = cleaned
            .split(/<\/?p[^>]*>|<br\s*\/?>|\n/gi)
            .map(p => p.trim())
            .filter(p => p && !p.match(/^<\/?[a-z]/i));

        paragraphs.forEach(para => {
            const trimmed = para.trim();
            if (!trimmed) return;

            const textRuns = this.parseInlineHTML(trimmed);
            if (textRuns.length > 0) {
                children.push(new Paragraph({
                    alignment: AlignmentType.JUSTIFY,
                    spacing: { before: 100, after: 100, line: 360 },
                    indent: { left: 360 },
                    children: textRuns,
                }));
            }
        });
    }

    addTable(children, tableHtml) {
        const rows = [];
        const trMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        if (!trMatches) return;

        trMatches.forEach((tr, rowIndex) => {
            const cells = [];
            const tdMatches = tr.match(/<(td|th)[^>]*>[\s\S]*?<\/\1>/gi);
            if (!tdMatches) return;

            let isHeaderRow = false;

            tdMatches.forEach(td => {
                const content = td.replace(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/i, '$2').trim();
                const isHeader = td.match(/^<th/i);
                if (isHeader) isHeaderRow = true;

                const textRuns = this.parseInlineHTML(content);

                cells.push(new TableCell({
                    children: [new Paragraph({ children: textRuns.length > 0 ? textRuns : [new TextRun({ text: content, size: 20 })], alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT })],
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    shading: isHeader ? { fill: "E0E0E0", type: "solid" } : (rowIndex % 2 === 1 ? { fill: "F8F8F8", type: "solid" } : undefined),
                    width: { size: 100 / tdMatches.length, type: WidthType.PERCENTAGE },
                }));
            });

            if (cells.length > 0) {
                rows.push(new TableRow({ children: cells, tableHeader: isHeaderRow }));
            }
        });

        if (rows.length > 0) {
            children.push(new Table({
                rows: rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                },
                margins: { top: 200, bottom: 200 },
            }));
            children.push(new Paragraph({ spacing: { after: 200 } }));
        }
    }

    parseInlineHTML(html) {
        if (!html || typeof html !== 'string') return [];

        let cleaned = html.replace(/\>\>/g, '').trim();
        cleaned = cleaned.replace(/<b>(.*?)<\/b>/gi, '§BOLD§$1§/BOLD§');
        cleaned = cleaned.replace(/<strong>(.*?)<\/strong>/gi, '§BOLD§$1§/BOLD§');
        cleaned = cleaned.replace(/<i>(.*?)<\/i>/gi, '§ITALIC§$1§/ITALIC§');
        cleaned = cleaned.replace(/<em>(.*?)<\/em>/gi, '§ITALIC§$1§/ITALIC§');
        cleaned = cleaned.replace(/<u>(.*?)<\/u>/gi, '§UNDERLINE§$1§/UNDERLINE§');
        cleaned = cleaned.replace(/<code>(.*?)<\/code>/gi, '§CODE§$1§/CODE§');
        cleaned = cleaned.replace(/<[^>]+>/g, '');
        cleaned = this.decodeHtmlEntities(cleaned);

        const segments = cleaned.split(/(§BOLD§|§\/BOLD§|§ITALIC§|§\/ITALIC§|§UNDERLINE§|§\/UNDERLINE§|§CODE§|§\/CODE§)/);
        const textRuns = [];

        let currentBold = false, currentItalic = false, currentUnderline = false, currentCode = false;

        for (const segment of segments) {
            if (segment === '§BOLD§') currentBold = true;
            else if (segment === '§/BOLD§') currentBold = false;
            else if (segment === '§ITALIC§') currentItalic = true;
            else if (segment === '§/ITALIC§') currentItalic = false;
            else if (segment === '§UNDERLINE§') currentUnderline = true;
            else if (segment === '§/UNDERLINE§') currentUnderline = false;
            else if (segment === '§CODE§') currentCode = true;
            else if (segment === '§/CODE§') currentCode = false;
            else if (segment && segment.trim()) {
                const runOptions = { text: segment, size: 20 };
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

        if (textRuns.length === 0 && html.trim()) {
            const plainText = html.replace(/<[^>]*>/g, '').replace(/\>\>/g, '').trim();
            if (plainText) textRuns.push(new TextRun({ text: plainText, size: 20 }));
        }

        return textRuns;
    }

    decodeHtmlEntities(text) {
        const entities = {
            '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'",
            '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '...',
            '&rsquo;': '\u2019', '&lsquo;': '\u2018', '&rdquo;': '\u201D', '&ldquo;': '\u201C',
        };

        let decoded = text;
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }
        return decoded;
    }

    hasImages(images, sectionKey) {
        if (!images || !sectionKey) return false;
        const normalizedSection = sectionKey.toLowerCase();
        return images.some(img =>
            (img.section && img.section.toLowerCase() === normalizedSection) ||
            (normalizedSection === 'output' && img.section && img.section.toLowerCase() === 'result')
        );
    }

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

                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 },
                    children: [new ImageRun({ data: response.data, transformation: { width: 450, height: 338 } })],
                }));

                children.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: img.caption || 'Figure', italics: true, size: 18, color: '666666' })],
                }));
            } catch (err) {
                console.error(`⚠️ Failed to add image to DOCX: ${err.message}`);
            }
        }
    }
}

export default new DocxGeneratorService();