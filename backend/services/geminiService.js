import { GoogleGenAI } from "@google/genai";

class GeminiService {
    constructor() {
        this.client = null;
        this.modelName = 'gemini-3-flash-preview';
        this.initialized = false;
    }

    /**
     * Initialize Gemini client (lazy initialization)
     * Called on first use to ensure env vars are loaded
     */
    _ensureInitialized() {
        if (this.initialized) {
            return;
        }

        // Use env variable or fallback to hardcoded key
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyD4upcFweNP4suxDxe-5BNA7vsjOxZDt7A";

        if (!apiKey) {
            throw new Error('Gemini API key not found. Please set GEMINI_API_KEY in .env file.');
        }

        try {
            this.client = new GoogleGenAI({ apiKey });
            this.initialized = true;
            console.log('✅ Gemini AI initialized successfully (gemini-3-flash-preview)');
        } catch (error) {
            console.error('❌ Gemini AI initialization failed:', error.message);
            throw new Error(`Failed to initialize Gemini AI: ${error.message}`);
        }
    }

    /**
     * Test Gemini connection
     * @returns {Promise<Object>} - Test result
     */
    async testConnection() {
        this._ensureInitialized();

        if (!this.client) {
            throw new Error('Gemini AI not configured. Please set GEMINI_API_KEY.');
        }

        try {
            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: 'Say "Hello, Gemini 3 Flash is working perfectly!"'
            });

            return {
                success: true,
                message: response.text,
                model: this.modelName
            };
        } catch (error) {
            throw new Error(`Gemini test failed: ${error.message}`);
        }
    }

    /**
     * Analyze PDF structure and extract worksheet template
     * @param {String} pdfText - Extracted text from PDF
     * @param {Object} userContext - University, course, subject info
     * @returns {Promise<Object>} - Analyzed template structure
     */
    async analyzeWorksheetStructure(pdfText, userContext) {
        // CRITICAL: Must initialize client before checking if it exists
        this._ensureInitialized();

        if (!this.client) {
            throw new Error('Gemini AI not configured. Please set GEMINI_API_KEY.');
        }

        try {
            const prompt = `You are an academic document analyzer. Analyze this worksheet and extract its structure.

WORKSHEET CONTENT:
${pdfText.substring(0, 3000)}

CONTEXT:
- University: ${userContext.university}
- Course: ${userContext.course}
- Subject: ${userContext.subject || 'Not specified'}

TASK:
Extract and identify:
1. All section headings in the order they appear
2. The writing style (Formal Academic, Practical, Research-oriented)
3. The academic level (Undergraduate, Postgraduate, Research)
4. Header format fields (if present)

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "sections": ["Section1", "Section2", ...],
  "style": "style here",
  "level": "level here",
  "confidence": "high/medium/low"
}`;

            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: prompt,
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 0.8,
                    maxOutputTokens: 2048,
                }
            });

            const text = response.text;

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI did not return valid JSON');
            }

            const analyzed = JSON.parse(jsonMatch[0]);

            return {
                sections: analyzed.sections || [],
                style: analyzed.style || 'Formal Academic',
                level: analyzed.level || 'Post Graduate',
                confidence: analyzed.confidence || 'medium'
            };
        } catch (error) {
            console.error('Structure analysis error:', error);
            // Return default structure on error
            return {
                sections: ['Aim', 'Problem Statement', 'Dataset', 'Objective', 'Code', 'Output', 'Learning Outcome'],
                style: 'Formal Academic',
                level: 'Post Graduate',
                confidence: 'low',
                error: error.message
            };
        }
    }

    async _retryOperation(operation, maxRetries = 5, delay = 2000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                // Check if error is 503 (Overloaded) or 429 (Rate Limit)
                const isTransient = error.status === 503 || error.status === 429 || error.message.includes('overloaded');
                if (i === maxRetries - 1 || !isTransient) throw error;

                console.log(`⚠️ Gemini API overloaded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }

    /**
     * Generate worksheet content using AI
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>} - Generated worksheet content
     */
    async generateWorksheetContent(params) {
        this._ensureInitialized();

        if (!this.client) {
            throw new Error('Gemini AI not configured. Please set GEMINI_API_KEY.');
        }

        const {
            topic,
            syllabus,
            difficulty,
            sections,
            userContext,
            userMemory,
            variationSeed
        } = params;

        try {
            const prompt = this.buildWorksheetPrompt({
                topic,
                syllabus,
                difficulty,
                sections,
                userContext,
                userMemory,
                variationSeed
            });

            // Wrap generation with retry logic
            const response = await this._retryOperation(async () => {
                return await this.client.models.generateContent({
                    model: this.modelName,
                    contents: prompt,
                    generationConfig: {
                        temperature: 0.8,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                });
            });

            const text = response.text;

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('AI did not return valid JSON format');
            }

            const content = JSON.parse(jsonMatch[0]);

            return content;
        } catch (error) {
            console.error('Worksheet generation error:', error);
            throw new Error(`Failed to generate worksheet: ${error.message}`);
        }
    }

    /**
     * Build comprehensive prompt for worksheet generation
     * @param {Object} params - Prompt parameters
     * @returns {String} - Complete prompt
     */
    buildWorksheetPrompt(params) {
        const { topic, syllabus, difficulty, sections, userContext, userMemory, variationSeed, imageData } = params;

        return `You are an ELITE ACADEMIC WORKSHEET GENERATOR for ${userContext.university}.

Your mission: Generate PUBLICATION-READY academic worksheets with professional formatting, intelligent structure, and domain-adaptive content.

═══════════════════════════════════════════════════════════════
📋 CONTEXT & METADATA
═══════════════════════════════════════════════════════════════
Institution: ${userContext.university}
Course: ${userContext.course} | Semester: ${userContext.semester}
Subject: ${userContext.subject}
Topic: ${topic}
Difficulty: ${difficulty}
Syllabus Alignment: ${syllabus}

Uniqueness Seed: ${variationSeed || Date.now()}
Variation Level: ${userMemory?.variationLevel || 'high'}

═══════════════════════════════════════════════════════════════
🎯 PRIMARY OBJECTIVE
═══════════════════════════════════════════════════════════════
Generate a worksheet that:
✓ Looks professionally typeset (like LaTeX/Word documents)
✓ Uses intelligent spacing, hierarchy, and visual structure
✓ Properly separates multi-part questions (a, b, c)
✓ Handles uploaded images/screenshots intelligently
✓ Maintains academic rigor across all disciplines

═══════════════════════════════════════════════════════════════
🧠 INTELLIGENT MULTI-PART QUESTION DETECTION
═══════════════════════════════════════════════════════════════

IF INPUT CONTAINS MULTI-PART QUESTIONS (e.g., "a. Do X, b. Do Y"):

STEP 1: DETECT PATTERNS
- Pattern 1: "a. ... b. ..." or "a) ... b) ..."
- Pattern 2: "(a) ... (b) ..."
- Pattern 3: "Part A: ... Part B: ..."
- Pattern 4: "Question 1: ... Question 2: ..."

STEP 2: SPLIT INTO STRUCTURED PARTS
Example Input: "a. Implement VLOOKUP. b. Create pivot table."

MUST OUTPUT AS:
{
  "mainQuestionTitle": "Advanced Excel Data Analysis",
  "questionParts": [
    {
      "part": "a",
      "title": "VLOOKUP and HLOOKUP Implementation",
      "description": "Implement the use of VLOOKUP and HLOOKUP on the same sheet and multiple sheets."
    },
    {
      "part": "b",
      "title": "Pivot Table Creation and Analysis",
      "description": "Create a pivot table with the company dataset having following columns: emp_id, date, sales_man_name, quantity, Department, State, Sales. Generate pivot table, pivot chart, and implement the slicer. Create 4 different pivot tables on the same sheet."
    }
  ]
}

═══════════════════════════════════════════════════════════════
📐 PROFESSIONAL FORMATTING STANDARDS
═══════════════════════════════════════════════════════════════

DOCUMENT STRUCTURE (TOP TO BOTTOM):

┌─────────────────────────────────────────────────────────────┐
│ 1. HEADER SECTION (Student/Course Details)                  │
│    Font: 11pt, Line height: 1.4, Margin bottom: 20px       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. MAIN TITLE/QUESTION                                       │
│    Style: font-size: 16px; font-weight: 600; margin: 24px 0;│
│                                                              │
│    FOR MULTI-PART QUESTIONS:                                │
│    <div style="margin-bottom: 20px;">                       │
│      <h3 style="font-size: 16px; font-weight: 600;         │
│        line-height: 1.5; margin-bottom: 16px;">             │
│        [Main Question Title]                                 │
│      </h3>                                                   │
│      <div style="margin-left: 20px;">                       │
│        <p style="margin-bottom: 12px;">                     │
│          <b>a.</b> [First part description]                 │
│        </p>                                                  │
│        <p style="margin-bottom: 12px;">                     │
│          <b>b.</b> [Second part description]                │
│        </p>                                                  │
│      </div>                                                  │
│    </div>                                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. AIM / OVERVIEW HEADING                                    │
│    <h3 style="font-size: 15px; font-weight: 600;           │
│      margin-top: 24px; margin-bottom: 12px;                 │
│      border-bottom: 1px solid #333; padding-bottom: 8px;">  │
│      Aim / Overview of the Practical                        │
│    </h3>                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. AIM CONTENT                                               │
│    <div style="margin-left: 20px; margin-bottom: 20px;     │
│      line-height: 1.7;">                                     │
│      [Aim title/subtitle]                                    │
│      <p style="margin-top: 8px;">[Description]</p>          │
│      <ul style="margin-top: 12px; margin-left: 20px;       │
│        line-height: 1.8;">                                   │
│        <li>Objective point 1</li>                           │
│        <li>Objective point 2</li>                           │
│      </ul>                                                   │
│    </div>                                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 5. PROBLEM STATEMENT HEADING                                 │
│    <h3 style="font-size: 15px; font-weight: 600;           │
│      margin-top: 24px; margin-bottom: 12px;                 │
│      border-bottom: 1px solid #333; padding-bottom: 8px;">  │
│      Problem Statement                                       │
│    </h3>                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 6. SUBSEQUENT SECTIONS (Dataset, Objective, Code, Output)   │
│    ALL follow the same heading + content pattern            │
│    Spacing: 24px between sections, 20px left indent         │
└─────────────────────────────────────────────────────────────┘

TYPOGRAPHY SPECIFICATIONS:
• Main Section Headings: 15px, bold (600), underline border
• Subsection Headings: 14px, semibold (500)
• Body Text: 13px, line-height 1.7
• Code Blocks: 12px, monospace, background #f8f8f8
• Indentation: 20px for all content under headings
• Paragraph Spacing: 12px between paragraphs
• Section Spacing: 24px between major sections

═══════════════════════════════════════════════════════════════
🖼️ IMAGE ANALYSIS & INTEGRATION (CRITICAL)
═══════════════════════════════════════════════════════════════

${imageData ? `
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ IMAGE UPLOADED - ANALYZE THOROUGHLY                      │
└─────────────────────────────────────────────────────────────┘

ANALYSIS CHECKLIST:
☐ Extract text from image (OCR if screenshot)
☐ Identify question parts (a, b, c)
☐ Extract any tables/datasets visible
☐ Note any diagrams/flowcharts
☐ Check for code snippets or formulas

INTEGRATION RULES:
1. If image contains the main question → Use it as questionParts
2. If image shows a dataset → Extract it into "dataset" field
3. If image has diagrams → Describe in "problemStatement"
4. If image is a reference → Mention in "additionalNotes"

OUTPUT IN JSON:
"imageAnalysis": {
  "type": "question|dataset|diagram|reference",
  "extractedText": "[Full text from image]",
  "detectedParts": ["a", "b"],
  "integrationMethod": "Used as main question parts"
}
` : ''}

═══════════════════════════════════════════════════════════════
📝 REQUIRED OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

YOU MUST GENERATE: ${sections.map((s, i) => `${i + 1}. ${s}`).join(', ')}

═══════════════════════════════════════════════════════════════
🎨 DOMAIN-ADAPTIVE EXAMPLES
═══════════════════════════════════════════════════════════════

EXCEL/DATA ANALYSIS: Include formulas, pivot table steps, slicer instructions
PROGRAMMING: Include complete runnable code with comments
ENGINEERING: Include calculations, units, diagrams descriptions
MANAGEMENT: Include case studies, frameworks, decision matrices

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL QUALITY RULES
═══════════════════════════════════════════════════════════════

✗ NEVER: Put multi-part questions in one line
✗ NEVER: Skip section headings
✗ NEVER: Use inconsistent indentation
✗ NEVER: Ignore uploaded images

✓ ALWAYS: Separate question parts (a, b, c) with proper formatting
✓ ALWAYS: Use consistent heading styles
✓ ALWAYS: Apply 20px left margin under each heading
✓ ALWAYS: Analyze and integrate uploaded images

Common Mistakes to Avoid:
${userMemory?.commonMistakes?.length > 0 ? userMemory.commonMistakes.map(m => `• ${m}`).join('\n') : '• None recorded yet'}

═══════════════════════════════════════════════════════════════
📤 JSON OUTPUT FORMAT (STRICTLY FOLLOW)
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no backticks):

{
  "mainQuestionTitle": "Primary topic or title extracted from question",
  
  "questionParts": [
    {
      "part": "a",
      "title": "Short descriptive title for part a",
      "description": "Full description of what part a asks"
    },
    {
      "part": "b", 
      "title": "Short descriptive title for part b",
      "description": "Full description of what part b asks"
    }
  ],
  
  "aim": "<div style='margin-left: 20px; line-height: 1.7;'><p style='margin-bottom: 12px; font-weight: 500;'>[Aim Title]</p><p style='margin-bottom: 12px;'>[Description paragraph]</p><ul style='margin-left: 20px; line-height: 1.8;'><li>Point 1</li><li>Point 2</li></ul></div>",
  
  "problemStatement": "<div style='margin-left: 20px; line-height: 1.7;'><p style='margin-bottom: 12px;'>[Problem description with context]</p></div>",
  
  "dataset": "<div style='margin-left: 20px;'><table style='width: 100%; border-collapse: collapse; margin: 16px 0;'><thead style='background: #f5f5f5;'><tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Column1</th></tr></thead><tbody><tr><td style='padding: 10px; border: 1px solid #ddd;'>Data</td></tr></tbody></table></div>",
  
  "objective": [
    "Clear, specific objective 1",
    "Clear, specific objective 2", 
    "Clear, specific objective 3"
  ],
  
  "code": {
    "language": "excel|python|java|cpp|etc",
    "source": "Complete code here with proper formatting and comments",
    "explanation": "<div style='line-height: 1.7;'><p><b>Key Concepts:</b></p><ul style='margin-left: 20px;'><li>Explanation point 1</li><li>Explanation point 2</li></ul></div>"
  },
  
  "output": "<div style='margin-left: 20px; line-height: 1.7;'><h4 style='font-size: 14px; font-weight: 500; margin-bottom: 10px;'>Expected Output</h4><ol style='margin-left: 20px; line-height: 1.8;'><li>Output point 1</li><li>Output point 2</li></ol></div>",
  
  "learningOutcome": [
    "<b>Outcome 1:</b> Detailed skill/knowledge gained",
    "<b>Outcome 2:</b> Detailed application understanding",
    "<b>Outcome 3:</b> Detailed competency developed"
  ],
  
  "imageAnalysis": "${imageData ? 'Detailed analysis of uploaded image and how it was integrated' : 'No image provided'}",
  
  "additionalNotes": "Any supplementary information or references"
}

═══════════════════════════════════════════════════════════════
🚀 PRE-SUBMISSION CHECKLIST
═══════════════════════════════════════════════════════════════

Before returning JSON, verify:
☑ Multi-part questions (a, b) are properly separated
☑ Each section has a proper heading with underline border
☑ All content under headings has 20px left margin
☑ Image content (if any) is analyzed and integrated
☑ Code is properly formatted with language specified
☑ JSON is valid and parseable
☑ Professional typography applied throughout
☑ Spacing is consistent (24px between sections)

═══════════════════════════════════════════════════════════════

NOW GENERATE THE WORKSHEET WITH EXCELLENCE AND PRECISION.`;
    }

    /**
     * Regenerate specific section
     * @param {String} section - Section name
     * @param {String} currentContent - Current section content
     * @param {Object} context - Worksheet context
     * @returns {Promise<String>} - Regenerated content
     */
    async regenerateSection(section, currentContent, context) {
        this._ensureInitialized();

        if (!this.client) {
            throw new Error('Gemini AI not configured');
        }

        try {
            const prompt = `Regenerate ONLY the "${section}" section for this worksheet.

Topic: ${context.topic}
Syllabus: ${context.syllabus}

Current "${section}" content:
${currentContent}

Requirements:
- Make it DIFFERENT from the current version
- Maintain academic quality
- Stay within syllabus scope
- Return ONLY the new content text (not JSON)

Generate improved "${section}" content:`;

            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: prompt,
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                }
            });

            return response.text.trim();
        } catch (error) {
            console.error('Section regeneration error:', error);
            throw new Error(`Failed to regenerate ${section}: ${error.message}`);
        }
    }
}

export default new GeminiService();