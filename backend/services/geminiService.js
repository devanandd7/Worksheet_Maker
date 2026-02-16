import { GoogleGenAI } from "@google/genai";

class GeminiService {
    constructor() {
        this.client = null;
        this.modelName = 'gemini-3-flash-preview'; // ✅ FIXED: Correct model name
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

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('❌ GEMINI_API_KEY not found. Please set it in .env file.');
        }

        try {
            this.client = new GoogleGenAI({ apiKey });
            this.initialized = true;
            console.log('✅ Gemini AI initialized successfully (gemini-2.0-flash-exp)');
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
                contents: 'Say "Hello, Gemini 2.0 Flash is working perfectly!"'
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
     * ✅ NEW: Smart detection if code is needed for the topic
     * @param {String} topic 
     * @param {String} additionalInstructions 
     * @param {Array<String>} sections - Array of requested sections
     * @returns {Boolean}
     */
    _isCodeRequired(topic, additionalInstructions, sections = []) {
        const combinedText = `${topic} ${additionalInstructions}`.toLowerCase();

        // Code is REQUIRED if mentions:
        const codeKeywords = [
            'code', 'program', 'implement', 'algorithm', 'function',
            'python', 'java', 'javascript', 'c++', 'cpp', 'html', 'css',
            'coding', 'script', 'syntax', 'compile', 'execute',
            'api', 'library', 'framework', 'import', 'class',
            'loop', 'variable', 'array', 'list', 'dictionary'
        ];

        // Code is NOT required if purely theoretical:
        // Check if code is explicitly requested in sections
        const isCodeSectionRequested = sections.some(s => s.toLowerCase().includes('code') || s.toLowerCase().includes('implementation'));

        // Determine if code is required based on topic keywords OR explicit section request
        const codeKeywordsTopic = ['implement', 'code', 'program', 'script', 'function', 'algorithm', 'develop', 'build', 'create', 'write', 'simulation', 'arduino', 'lcd', 'sensor', 'iot'];
        const theoreticalKeywords = ['explain', 'describe', 'discuss', 'difference', 'theory', 'concept', 'what is', 'compare'];

        // FORCE code if section is requested, regardless of topic keywords
        let codeRequired = isCodeSectionRequested || codeKeywordsTopic.some(keyword => topic.toLowerCase().includes(keyword));

        // Only disable if explicitly theoretical AND code is NOT requested in layout
        if (theoreticalKeywords.some(keyword => topic.toLowerCase().startsWith(keyword)) && !isCodeSectionRequested) {
            codeRequired = false;
        }

        console.log(`🤖 Code Requirement Analysis:
    - Topic: "${topic}"
    - Section Requested: ${isCodeSectionRequested}
    - Keywords Match: ${codeKeywordsTopic.some(keyword => topic.toLowerCase().includes(keyword))}
    - FINAL DECISION: ${codeRequired ? 'REQUIRED' : 'NOT REQUIRED'}
    `);
        return codeRequired;
    }

    /**
     * ✅ NEW: Extract preferred programming language
     * @param {String} topic 
     * @param {String} syllabus 
     * @param {String} additionalInstructions 
     * @returns {String}
     */
    _extractPreferredLanguage(topic, syllabus, additionalInstructions) {
        const combinedText = `${topic} ${syllabus} ${additionalInstructions}`.toLowerCase();

        const languageKeywords = {
            'python': ['python', 'py', 'pandas', 'numpy', 'matplotlib', 'django', 'flask'],
            'java': ['java', 'spring', 'hibernate', 'jvm'],
            'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express'],
            'cpp': ['c++', 'cpp', 'stl'],
            'c': ['c programming', ' c language'],
            'html': ['html', 'css', 'web design'],
            'sql': ['sql', 'database', 'mysql', 'postgresql'],
            'r': [' r programming', ' r language', 'rstudio'],
            'excel': ['excel', 'vba', 'spreadsheet', 'vlookup', 'pivot']
        };

        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            if (keywords.some(keyword => combinedText.includes(keyword))) {
                return lang;
            }
        }

        return 'python'; // Default fallback
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
            variationSeed,
            images,
            additionalInstructions
        } = params;

        try {
            // ✅ NEW: Smart detection of code requirement and language
            const codeRequired = this._isCodeRequired(
                topic,
                additionalInstructions || '',
                sections || []
            );
            const preferredLanguage = this._extractPreferredLanguage(
                topic,
                syllabus || '',
                additionalInstructions || ''
            );

            console.log(`🧠 SMART DETECTION:
- Code Required: ${codeRequired}
- Preferred Language: ${preferredLanguage}
- Topic: ${topic}`);

            const prompt = this.buildWorksheetPrompt({
                topic,
                syllabus,
                difficulty,
                sections,
                userContext,
                userMemory,
                variationSeed,
                imageData: images,
                imageCount: images ? images.length : 0,
                additionalInstructions: additionalInstructions || '',
                codeRequired, // ✅ NEW
                preferredLanguage // ✅ NEW
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
            console.log('📝 RAW AI RESPONSE:', text.substring(0, 500) + '...'); // Log first 500 chars

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('❌ JSON Extraction Failed. Raw text:', text);
                throw new Error('AI did not return valid JSON format');
            }

            const content = JSON.parse(jsonMatch[0]);
            console.log('✅ Extracted Content Keys:', Object.keys(content));
            if (content.imagePlacements) {
                console.log('🖼️ AI Image Placements:', JSON.stringify(content.imagePlacements, null, 2));
            } else {
                console.warn('⚠️ No imagePlacements found in AI response');
            }

            // ✅ CRITICAL FIX: Remove ANY fields after learningOutcome + strict validation
            const allowedFields = [
                'mainQuestionTitle',
                'questionParts',
                'aim',
                'problemStatement',
                'dataset',
                'algorithm',
                'objective',
                'code',
                'output',
                'observation',
                'additionalNotes',
                'imageAnalysis',
                'imagePlacements',
                'imageCaptions',
                'learningOutcome'
            ];

            // STRICTLY PROHIBITED fields (case-insensitive check)
            const prohibitedFields = [
                'additionalresources',
                'additional_resources',
                'resources',
                'references',
                'bibliography',
                'furtherreading',
                'further_reading',
                'conclusion',
                'summary',
                'appendix',
                'notes'
            ];

            // First pass: Remove prohibited fields
            const cleanedContent = {};
            for (const key of Object.keys(content)) {
                const lowerKey = key.toLowerCase().replace(/[_\s]/g, '');

                // Check if field is prohibited
                const isProhibited = prohibitedFields.some(prohibited =>
                    lowerKey.includes(prohibited) || prohibited.includes(lowerKey)
                );

                if (!isProhibited && allowedFields.includes(key)) {
                    cleanedContent[key] = content[key];
                }
            }

            const removedFields = Object.keys(content).filter(k => !Object.keys(cleanedContent).includes(k));
            if (removedFields.length > 0) {
                console.log('🧹 REMOVED PROHIBITED FIELDS:', removedFields.join(', '));
            }

            // ✅ CRITICAL: Ensure learningOutcome is present and is last
            if (!cleanedContent.learningOutcome) {
                console.warn('⚠️ WARNING: No learningOutcome field found!');
            }

            return cleanedContent;
        } catch (error) {
            console.error('Worksheet generation error:', error);
            throw new Error(`Failed to generate worksheet: ${error.message}`);
        }
    }

    /**
     * Get dynamic length instructions based on image count
     * @param {number} count - Number of images
     * @returns {String} - Prompt instruction
     */
    _getDynamicLengthInstructions(count) {
        if (count >= 4) {
            return `
═══════════════════════════════════════════════════════════════
📏 DYNAMIC CONTENT SCALING: EXTENSIVE (Goal: ~10 Pages)
═══════════════════════════════════════════════════════════════
Requirement: User provided ${count} images. You MUST generate a HIGHLY DETAILED, EXTENSIVE worksheet.
- Aim for approximately 10 PDF pages of content.
- EXPAND every section with deep theoretical background, multiple code examples, and detailed analysis.
- The "Theory" or "Problem Statement" section must be at least 800 words.
- The "Code" section must include full implementation details, edge cases, and alternative approaches.
- The "Conclusion" must be a comprehensive summary (min 300 words).
`;
        } else if (count >= 2) {
            return `
═══════════════════════════════════════════════════════════════
📏 DYNAMIC CONTENT SCALING: MODERATE (Goal: ~6 Pages)
═══════════════════════════════════════════════════════════════
Requirement: User provided ${count} images. Generate a MODERATE length worksheet.
- Aim for approximately 6 PDF pages of content.
- Provide clear, concise explanations but ensure full coverage of the topic.
- The "Theory" or "Problem Statement" should be ~400-500 words.
- The "Code" section should focus on the core implementation.
`;
        } else {
            return `
═══════════════════════════════════════════════════════════════
📏 DYNAMIC CONTENT SCALING: STANDARD (Goal: ~3-4 Pages)
═══════════════════════════════════════════════════════════════
Requirement: Standard worksheet length. Focus on clarity and precision.
`;
        }
    }

    /**
     * Build comprehensive prompt for worksheet generation
     * @param {Object} params - Prompt parameters
     * @returns {String} - Complete prompt
     */
    buildWorksheetPrompt({
        topic, syllabus, difficulty, sections,
        userContext, userMemory, variationSeed,
        imageData, imageCount, additionalInstructions,
        codeRequired, preferredLanguage // ✅ NEW parameters
    }) {
        return `You are an ELITE ACADEMIC WORKSHEET GENERATOR for ${userContext.university}.

Your mission: Generate PUBLICATION-READY academic worksheets with professional formatting, intelligent structure, and domain-adaptive content.

═══════════════════════════════════════════════════════════════
📋 CONTEXT & METADATA
═══════════════════════════════════════════════════════════════
Institution: ${userContext.university}
Course: ${userContext.course} | Semester: ${userContext.semester}
Subject: ${userContext.subject}

${this._getDynamicLengthInstructions(imageCount)}

═══════════════════════════════════════════════════════════════
🎯 TASK OVERVIEW
═══════════════════════════════════════════════════════════════
Topic: ${topic}
Difficulty: ${difficulty}
Syllabus Alignment: ${syllabus}

Uniqueness Seed: ${variationSeed || Date.now()}
Variation Level: ${userMemory?.variationLevel || 'high'}

${additionalInstructions ? `
═══════════════════════════════════════════════════════════════
💡 USER'S ADDITIONAL INSTRUCTIONS (PRIORITY: HIGHEST!)
═══════════════════════════════════════════════════════════════
The user has provided specific instructions that you MUST follow:

"${additionalInstructions}"

🎯 HOW TO UTILIZE THESE INSTRUCTIONS SMARTLY:

1. CONTENT FOCUS: If they mention specific topics/concepts, emphasize those throughout the worksheet
   Example: "Focus on practical implementation" → Include more hands-on code examples
   
2. EXAMPLES & DATASETS: If they specify datasets or examples, use those exact ones
   Example: "Use iris dataset" → All examples must use iris dataset
   
3. DEPTH & BREADTH: Adjust complexity based on their requirements
   Example: "Keep it simple" → Avoid advanced concepts, use beginner-friendly language
   Example: "Deep dive into theory" → Expand problemStatement with mathematical foundations
   
4. STRUCTURE PREFERENCES: If they want specific sections emphasized
   Example: "More focus on visualization" → Expand output section with detailed chart descriptions
   
5. STYLE ADAPTATION: Match tone/formality to their requests
   Example: "Industry-oriented" → Use real-world case studies and business terminology
   Example: "Research paper style" → Add citations, formal language, extensive background

6. CONSTRAINTS: Respect any limitations they specify
   Example: "Without using libraries" → Pure implementation only
   Example: "Beginner level" → No advanced algorithms

INTEGRATE THESE INSTRUCTIONS NATURALLY - don't just mention them, APPLY them throughout:
- In aim section: Align objectives with user's goals
- In problemStatement: Frame problem according to their context
- In code: Follow their specified approach/tools
- In output: Show results that match their expectations
- In learningOutcome: Reflect what THEY want students to learn

Treat these instructions as HIGHEST PRIORITY constraints.
═══════════════════════════════════════════════════════════════
` : ''}

═══════════════════════════════════════════════════════════════
🧠 INTELLIGENT CODE GENERATION (CRITICAL!)
═══════════════════════════════════════════════════════════════

🎯 CODE REQUIREMENT DETECTION:
Analysis Result: ${codeRequired ? '✅ CODE IS REQUIRED' : '❌ CODE NOT NEEDED (Theoretical topic)'}
${codeRequired ? `Preferred Language: ${preferredLanguage.toUpperCase()}` : ''}

📋 RULES FOR CODE SECTION:

IF CODE IS NOT REQUIRED (Theoretical topics):
  ❌ DO NOT include "code" field in JSON
  ❌ DO NOT generate any programming code
  ✓ Focus on theoretical explanation in problemStatement
  ✓ Use diagrams, flowcharts, or conceptual explanations instead
  
  Examples of NO CODE topics:
  - "Explain cloud computing concepts"
  - "Discuss agile methodology"
  - "SEO theory and best practices"
  - "Digital marketing fundamentals"
  - "Machine learning concepts overview"
  - "Web Analytics" (tool usage, not coding)

IF CODE IS REQUIRED (Implementation topics):
  ✅ Generate code in ${preferredLanguage ? preferredLanguage.toUpperCase() : 'PYTHON'}
  ✅ Include full working implementation
  ✅ Add detailed comments
  ✅ Show practical examples
  
  Examples of CODE topics:
  - "Implement sorting algorithm in Python"
  - "Create REST API with Node.js"
  - "Build calculator in Java"
  - "Web scraping with Python"

🔍 LANGUAGE PRIORITY (when code IS needed):
1. User-specified language (from additionalInstructions) - HIGHEST PRIORITY
2. Detected from topic: ${preferredLanguage || 'python'}
3. Subject default (e.g., Web Dev → JavaScript, Data Science → Python)

⚠️ CRITICAL DECISION RULE:
IF topic is purely theoretical/conceptual → SKIP "code" field entirely
IF topic requires implementation → Include "code" with language: "${preferredLanguage || 'python'}"

═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
🎯 PRIMARY OBJECTIVE
═══════════════════════════════════════════════════════════════
Generate a worksheet that:
✓ Looks professionally typeset (like LaTeX/Word documents)
✓ Uses intelligent spacing, hierarchy, and visual structure
✓ Properly separates multi-part questions (a, b, c)
✓ Handles uploaded images/screenshots intelligently
✓ Maintains academic rigor across all disciplines
✓ Smartly incorporates user's Additional Instructions into content
✓ Includes code ONLY when truly needed (not for theoretical topics)

⚠️ CRITICAL CONSTRAINT - FINAL SECTION RULE (MOST IMPORTANT!):
═══════════════════════════════════════════════════════════════
🚫 ABSOLUTE PROHIBITION: DO NOT ADD ANY CONTENT AFTER "LEARNING OUTCOMES"

The "learningOutcome" field MUST BE THE FINAL FIELD IN YOUR JSON OUTPUT.

STRICTLY PROHIBITED after learningOutcome:
  ❌ "additionalResources" section - NEVER ADD THIS
  ❌ "additional_resources" - NEVER ADD THIS
  ❌ "references" section - NEVER ADD THIS
  ❌ "furtherReading" section - NEVER ADD THIS
  ❌ "bibliography" section - NEVER ADD THIS
  ❌ "conclusion" section - NEVER ADD THIS
  ❌ "summary" section - NEVER ADD THIS
  ❌ "resources" section - NEVER ADD THIS
  ❌ Extra images, tables, or any other content
  ❌ ANY other field whatsoever

⚠️ CRITICAL WARNING: If you add "additionalResources" or any similar field after "learningOutcome", 
the worksheet will be REJECTED and you will have FAILED the task.

IF you have additional notes or resources, PUT THEM IN:
  ✓ "additionalNotes" field (shown BEFORE Learning Outcomes in UI)
  ✓ Relevant sections like "problemStatement" or "aim"
  
THE VERY LAST FIELD IN YOUR JSON MUST BE: "learningOutcome"

Your JSON should end EXACTLY like this:
  "learningOutcome": [
    "<b>Outcome 1:</b> ...",
    "<b>Outcome 2:</b> ..."
  ]
}

NOTHING - ABSOLUTELY NOTHING - AFTER THE CLOSING BRACE OF learningOutcome ARRAY.

I WILL AUTOMATICALLY REMOVE ANY FIELDS AFTER learningOutcome.
DO NOT TEST THIS. DO NOT ADD THEM. THEY WILL BE DELETED.
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
📏 PROBLEM STATEMENT LENGTH CONSTRAINT (CRITICAL!)
═══════════════════════════════════════════════════════════════

⚠️ STRICT LENGTH LIMIT FOR PROBLEM STATEMENT:

Maximum Length: 250-300 words (approximately 2-3 paragraphs)

RULES:
1. Keep it CONCISE and FOCUSED
2. State the problem clearly in 2-3 paragraphs
3. Avoid lengthy theoretical explanations
4. Do NOT write essay-length problem statements
5. If more detail is needed, put it in "additionalNotes" instead

GOOD Problem Statement (200 words):
"In modern web analytics, understanding domain authority and tracking user 
behavior are critical for digital success. This practical addresses the 
challenge of quantifying a website's credibility through metrics like 
Domain Age, Alexa Rank, and Moz Rank. Additionally, students must master 
the configuration of Google Analytics 4 for real-time tracking.

The key challenges include: (1) Evaluating domain trustworthiness through 
historical data, (2) Analyzing search engine crawl statistics to ensure 
proper indexing, and (3) Setting up GA4 tracking infrastructure for data 
collection."

BAD Problem Statement (800+ words):
[Long essay with multiple subsections, definitions, and extensive theory]

IF your problem statement exceeds 300 words, you MUST:
- Cut unnecessary details
- Move theoretical content to "aim" or "additionalNotes"
- Focus ONLY on the core problem being solved
═══════════════════════════════════════════════════════════════

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
      "description": "Create a pivot table with the company dataset..."
    }
  ]
}

═══════════════════════════════════════════════════════════════
📐 PROFESSIONAL FORMATTING STANDARDS
═══════════════════════════════════════════════════════════════

DOCUMENT STRUCTURE (TOP TO BOTTOM):

┌─────────────────────────────────────────────────────────────┐
│ 1. HEADER SECTION (Student/Course Details)                  │
│    Keep EXACTLY as provided by user - NO CHANGES            │
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
│      margin-top: 32px; margin-bottom: 14px;                 │
│      border-bottom: 1px solid #333; padding-bottom: 8px;">  │
│      AIM                                                     │
│    </h3>                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. AIM CONTENT                                               │
│    <div style="margin-left: 20px; margin-bottom: 24px;     │
│      line-height: 1.8; text-align: justify;">               │
│      [Aim subtitle]                                          │
│      <p style="margin-top: 10px; margin-bottom: 14px;">     │
│        [Description paragraph]                               │
│      </p>                                                    │
│      <ul style="margin-top: 14px; margin-left: 20px;       │
│        line-height: 2;">                                     │
│        <li>Objective point 1</li>                           │
│        <li>Objective point 2</li>                           │
│      </ul>                                                   │
│    </div>                                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 5. ALL OTHER SECTIONS                                        │
│    Follow same pattern:                                      │
│    - Section heading: 32px margin-top                       │
│    - Content: 20px left margin, 24px bottom margin         │
│    - Line height: 1.8                                        │
│    - Paragraph spacing: 14px                                │
└─────────────────────────────────────────────────────────────┘

TYPOGRAPHY SPECIFICATIONS:
• Main Section Headings: 15px, bold (600), underline border
• Subsection Headings: 14px, semibold (500)
• Body Text: 13px, line-height 1.8
• Code Blocks: 12px, monospace, background #f8f8f8
• Indentation: 20px for all content under headings
• Paragraph Spacing: 14px between paragraphs
• Section Spacing: 32px between major sections

═══════════════════════════════════════════════════════════════
🖼️ IMAGE ANALYSIS & INTEGRATION (CRITICAL)
═══════════════════════════════════════════════════════════════

${imageData ? `
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ IMAGE UPLOADED - ANALYZE THOROUGHLY                      │
└─────────────────────────────────────────────────────────────┘

CRITICAL: YOU HAVE RECEIVED ${imageCount} IMAGES (Indices 0 to ${imageCount - 1}).
YOU MUST USE ALL ${imageCount} IMAGES.
Map EVERY single image index (0 to ${imageCount - 1}) to a section.
If an image doesn't fit perfectly, place it in "aim" or "problemStatement" or "additionalNotes".
DO NOT LEAVE ANY IMAGE UNUSED.
CRITICAL: Do NOT dump all images in one section. Distribute them where they contextually belong.

VALID SECTION KEYS: "aim", "problemStatement", "dataset", "algorithm", "code", "output", "observation"

PLACEMENT RULES:
- Code Screenshots → "code"
- Output/Terminal/Console Screenshots → "output" (If multiple outputs, place sequentially)
- Hardware/Circuit Diagrams → "problemStatement" or "aim" or "dataset"
- Data Tables/Graphs → "dataset" or "output"

Example:
"imagePlacements": {
  "code": [0],           // Image 0 → code section
  "output": [1]          // Image 1 → output section
}

INTEGRATION RULES:
1. If image contains the main question → Use it as questionParts
2. If image shows a dataset → Extract it into "dataset" field
3. If image has diagrams → Describe in "problemStatement"
4. If image is a reference → Mention in "additionalNotes"
` : ''}

═══════════════════════════════════════════════════════════════
📝 REQUIRED OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

YOU MUST GENERATE: ${sections.map((s, i) => `${i + 1}. ${s}`).join(', ')}

═══════════════════════════════════════════════════════════════
🎨 DOMAIN-ADAPTIVE EXAMPLES
═══════════════════════════════════════════════════════════════

EXCEL / DATA ANALYSIS: Include formulas, pivot table steps, slicer instructions
PROGRAMMING: Include complete runnable code with comments
ENGINEERING: Include calculations, units, diagrams descriptions
MANAGEMENT: Include case studies, frameworks, decision matrices
WEB ANALYTICS: Focus on tool usage, screenshots, step-by-step guides (NO code)

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL QUALITY RULES
═══════════════════════════════════════════════════════════════

✗ NEVER: Put multi-part questions in one line
✗ NEVER: Skip section headings
✗ NEVER: Use inconsistent indentation
✗ NEVER: Ignore uploaded images
✗ NEVER: Add content after learningOutcome

✓ ALWAYS: Separate question parts (a, b, c) with proper formatting
✓ ALWAYS: Use consistent heading styles
✓ ALWAYS: Apply 20px left margin under each heading
✓ ALWAYS: Analyze and integrate uploaded images
✓ ALWAYS: Use HTML lists (<ul>, <ol>, <li>) for any bullet points or numbered steps. NEVER use plain text hyphens or numbers for lists.
✓ ALWAYS: Make learningOutcome the LAST field

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
    }
  ],
  
  "aim": "<div style='margin-left: 20px; line-height: 1.8; text-align: justify; margin-bottom: 24px;'><p style='margin-bottom: 14px; font-weight: 500;'>[Aim Title]</p><p style='margin-bottom: 14px;'>[Description paragraph]</p><ul style='margin-top: 14px; margin-left: 20px; line-height: 2;'><li>Point 1</li><li>Point 2</li></ul></div>",
  
  "problemStatement": "<div style='margin-left: 20px; line-height: 1.8; text-align: justify; margin-bottom: 24px;'><p style='margin-bottom: 14px;'>[Problem description with context]</p></div>",
  
  "dataset": "<div style='margin-left: 20px; margin-bottom: 24px;'><table style='width: 100%; border-collapse: collapse; margin: 16px 0;'><thead style='background: #f5f5f5;'><tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Column1</th></tr></thead><tbody><tr><td style='padding: 10px; border: 1px solid #ddd;'>Data</td></tr></tbody></table></div>",
  
  "objective": [
    "Clear, specific objective 1",
    "Clear, specific objective 2"
  ],
  
  ${codeRequired ? `"code": {
    "language": "${preferredLanguage || 'python'}",
    "source": "Complete code here with proper formatting and comments",
    "explanation": "<div style='line-height: 1.8; margin-bottom: 24px;'><p><b>Key Concepts:</b></p><ul style='margin-left: 20px; line-height: 2;'><li>Explanation point 1</li><li>Explanation point 2</li></ul></div>"
  },` : ''}
  
  "output": "<div style='margin-left: 20px; line-height: 1.8; margin-bottom: 24px;'><h4 style='font-size: 14px; font-weight: 500; margin-bottom: 12px;'>Expected Output</h4><ol style='margin-left: 20px; line-height: 2;'><li>Output point 1</li><li>Output point 2</li></ol></div>",
  
  "additionalNotes": "Any supplementary information or resources (PUT RESOURCES HERE, NOT AFTER learningOutcome)",
  
  ${imageCount > 0 ? `"imagePlacements": {
    "code": [0],
    "output": [1]
  },
  "imageCaptions": [
    "Figure 1: Caption for image 0",
    "Figure 2: Caption for image 1"
  ],` : ''}
  
  "learningOutcome": [
    "<b>Outcome 1:</b> Detailed skill/knowledge gained",
    "<b>Outcome 2:</b> Detailed application understanding"
  ]
}

⚠️ CRITICAL REMINDERS FOR JSON OUTPUT:
1. "learningOutcome" MUST BE THE ABSOLUTE LAST FIELD
2. DO NOT ADD "additionalResources", "references", or ANY field after learningOutcome
3. ${codeRequired ? `Include "code" field with ${preferredLanguage} implementation` : 'SKIP "code" field entirely (theoretical topic)'}
4. Valid JSON only (parseable without errors)
5. All ${imageCount || 0} images must be mapped in imagePlacements
6. Better spacing: 32px between sections, 24px margin-bottom, line-height 1.8

═══════════════════════════════════════════════════════════════
🚀 PRE-SUBMISSION CHECKLIST
═══════════════════════════════════════════════════════════════

Before returning JSON, verify:
☑ Multi-part questions (a, b) are properly separated
☑ Each section has a proper heading with underline border
☑ All content under headings has 20px left margin
☑ Problem Statement is UNDER 300 words (concise, not essay-length)
☑ ${codeRequired ? `Code in ${preferredLanguage} with full implementation` : 'NO code field (not needed for this topic)'}
☑ All ${imageCount || 0} images mapped to appropriate sections
☑ additionalNotes contains any extra resources (NOT after learningOutcome)
☑ learningOutcome is THE LAST FIELD
☑ NO "additionalResources" field exists ANYWHERE
☑ NO "references" field exists ANYWHERE
☑ NO fields exist after learningOutcome
☑ JSON is valid and parseable
☑ Better spacing applied (32px sections, 24px margins, 1.8 line-height)
☑ Professional typography throughout

⚠️ FINAL CHECK: Count the fields in your JSON. The LAST field name should be "learningOutcome".
If you see ANY field after "learningOutcome", DELETE it immediately.

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
