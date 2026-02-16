import { GoogleGenAI } from "@google/genai";

class GeminiService {
    constructor() {
        this.client = null;
        this.modelName = 'gemini-3-flash-preview';
        this.initialized = false;
    }

    _ensureInitialized() {
        if (this.initialized) return;

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

    async analyzeWorksheetStructure(pdfText, userContext) {
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
                const isTransient = error.status === 503 || error.status === 429 || error.message.includes('overloaded');
                if (i === maxRetries - 1 || !isTransient) throw error;

                console.log(`⚠️ Gemini API overloaded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }

    /**
     * ✅ INTELLIGENT CODE DETECTION
     * Analyzes topic, instructions, and sections to determine if code is needed
     */
    _isCodeRequired(topic, additionalInstructions, sections = []) {
        const combinedText = `${topic} ${additionalInstructions}`.toLowerCase();

        // Check if code section is explicitly requested
        const isCodeSectionRequested = sections.some(s =>
            s.toLowerCase().includes('code') ||
            s.toLowerCase().includes('implementation') ||
            s.toLowerCase().includes('program')
        );

        // Keywords indicating CODE IS REQUIRED
        const codeKeywords = [
            'implement', 'code', 'program', 'script', 'function', 'algorithm',
            'develop', 'build', 'create', 'write', 'simulation', 'arduino',
            'lcd', 'sensor', 'iot', 'api', 'library', 'python', 'java',
            'javascript', 'c++', 'html', 'css', 'sql', 'programming'
        ];

        // Keywords indicating THEORY ONLY (no code)
        const theoreticalKeywords = [
            'explain', 'describe', 'discuss', 'difference', 'theory',
            'concept', 'what is', 'compare', 'define', 'analyze'
        ];

        // FORCE code if section is requested
        let codeRequired = isCodeSectionRequested ||
            codeKeywords.some(keyword => combinedText.includes(keyword));

        // Disable code if explicitly theoretical AND no code section requested
        const isExplicitlyTheoretical = theoreticalKeywords.some(keyword =>
            combinedText.startsWith(keyword)
        );

        if (isExplicitlyTheoretical && !isCodeSectionRequested) {
            codeRequired = false;
        }

        console.log(`🤖 CODE REQUIREMENT ANALYSIS:
    - Topic: "${topic}"
    - Code Section Requested: ${isCodeSectionRequested}
    - Keywords Match: ${codeKeywords.some(keyword => combinedText.includes(keyword))}
    - Explicitly Theoretical: ${isExplicitlyTheoretical}
    - FINAL DECISION: ${codeRequired ? '✅ CODE REQUIRED' : '❌ NO CODE NEEDED'}
        `);

        return codeRequired;
    }

    /**
     * ✅ INTELLIGENT LANGUAGE DETECTION
     * Extracts preferred programming language from context
     */
    _extractPreferredLanguage(topic, syllabus, additionalInstructions) {
        const combinedText = `${topic} ${syllabus} ${additionalInstructions}`.toLowerCase();

        const languageKeywords = {
            'python': ['python', 'py', 'pandas', 'numpy', 'matplotlib', 'django', 'flask', 'scikit'],
            'java': ['java', 'spring', 'hibernate', 'jvm', 'servlet'],
            'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'express'],
            'cpp': ['c++', 'cpp', 'stl'],
            'c': ['c programming', ' c language', 'embedded c'],
            'html': ['html', 'css', 'web design', 'frontend'],
            'sql': ['sql', 'database', 'mysql', 'postgresql', 'query'],
            'r': [' r programming', ' r language', 'rstudio'],
            'php': ['php', 'laravel', 'wordpress'],
            'matlab': ['matlab', 'simulink'],
            'arduino': ['arduino', 'sketch', 'embedded'],
        };

        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            if (keywords.some(keyword => combinedText.includes(keyword))) {
                console.log(`🔍 Language Detection: Found ${lang.toUpperCase()} (matched: ${keywords.find(k => combinedText.includes(k))})`);
                return lang;
            }
        }

        // Default fallback based on subject context
        if (combinedText.includes('web') || combinedText.includes('analytics')) {
            return 'javascript';
        }
        if (combinedText.includes('data') || combinedText.includes('ml') || combinedText.includes('ai')) {
            return 'python';
        }

        return 'python'; // Final default
    }

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
            // ✅ INTELLIGENT DETECTION
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

            console.log(`🧠 SMART GENERATION CONFIG:
- Code Required: ${codeRequired}
- Preferred Language: ${preferredLanguage.toUpperCase()}
- Topic: ${topic}
- Additional Instructions: ${additionalInstructions || 'None'}
            `);

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
                codeRequired,
                preferredLanguage
            });

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
            console.log('📝 RAW AI RESPONSE (first 500 chars):', text.substring(0, 500) + '...');

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

            // ✅ STRICT FIELD VALIDATION
            const allowedFields = [
                'mainQuestionTitle', 'questionParts', 'aim', 'problemStatement',
                'dataset', 'algorithm', 'objective', 'code', 'output', 'observation',
                'additionalNotes', 'imageAnalysis', 'imagePlacements', 'imageCaptions',
                'learningOutcome'
            ];

            const prohibitedFields = [
                'additionalresources', 'additional_resources', 'resources', 'references',
                'bibliography', 'furtherreading', 'further_reading', 'conclusion',
                'summary', 'appendix', 'notes'
            ];

            const cleanedContent = {};
            for (const key of Object.keys(content)) {
                const lowerKey = key.toLowerCase().replace(/[_\s]/g, '');

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
     * Dynamic length instructions based on image count
     */
    _getDynamicLengthInstructions(count) {
        if (count >= 4) {
            return `
═══════════════════════════════════════════════════════════════
📏 EXTENSIVE CONTENT (Target: ~10 Pages)
═══════════════════════════════════════════════════════════════
User provided ${count} images. Generate HIGHLY DETAILED content:
- Problem Statement: 800+ words with deep theoretical background
- Code section: Full implementation + edge cases + alternatives
- Conclusion: Comprehensive summary (300+ words)
`;
        } else if (count >= 2) {
            return `
═══════════════════════════════════════════════════════════════
📏 MODERATE CONTENT (Target: ~6 Pages)
═══════════════════════════════════════════════════════════════
User provided ${count} images. Generate MODERATE length content:
- Problem Statement: 400-500 words
- Code section: Core implementation
`;
        } else {
            return `
═══════════════════════════════════════════════════════════════
📏 STANDARD CONTENT (Target: ~3-4 Pages)
═══════════════════════════════════════════════════════════════
Standard worksheet length. Focus on clarity and precision.
`;
        }
    }

    buildWorksheetPrompt({
        topic, syllabus, difficulty, sections,
        userContext, userMemory, variationSeed,
        imageData, imageCount, additionalInstructions,
        codeRequired, preferredLanguage
    }) {
        return `You are an ELITE ACADEMIC WORKSHEET GENERATOR for ${userContext.university}.

Your mission: Generate PUBLICATION-READY academic worksheets with professional formatting.

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
💡 USER'S ADDITIONAL INSTRUCTIONS (HIGHEST PRIORITY!)
═══════════════════════════════════════════════════════════════
"${additionalInstructions}"

CRITICAL: Integrate these instructions throughout the worksheet:
- Content Focus: Emphasize topics mentioned
- Examples & Datasets: Use specified examples
- Depth & Breadth: Adjust complexity as requested
- Structure: Emphasize sections as directed
- Style: Match tone/formality requested
- Constraints: Respect any limitations

Treat these as HIGHEST PRIORITY constraints.
═══════════════════════════════════════════════════════════════
` : ''}

═══════════════════════════════════════════════════════════════
🧠 INTELLIGENT CODE GENERATION (CRITICAL!)
═══════════════════════════════════════════════════════════════

CODE REQUIREMENT: ${codeRequired ? '✅ CODE IS REQUIRED' : '❌ CODE NOT NEEDED'}
${codeRequired ? `Preferred Language: ${preferredLanguage.toUpperCase()}` : ''}

IF CODE NOT REQUIRED (Theoretical topics):
  ❌ DO NOT include "code" field
  ✓ Focus on theoretical explanation in problemStatement

IF CODE IS REQUIRED:
  ✅ Generate code in ${preferredLanguage ? preferredLanguage.toUpperCase() : 'PYTHON'}
  ✅ Include full working implementation with comments
  ✅ Show practical examples

LANGUAGE PRIORITY (when code needed):
1. User-specified (from additionalInstructions)
2. Detected from topic: ${preferredLanguage || 'python'}
3. Subject default

═══════════════════════════════════════════════════════════════

⚠️ CRITICAL: FINAL SECTION RULE (MOST IMPORTANT!)
═══════════════════════════════════════════════════════════════
🚫 ABSOLUTE PROHIBITION: NO CONTENT AFTER "learningOutcome"

"learningOutcome" MUST BE THE FINAL FIELD.

STRICTLY PROHIBITED after learningOutcome:
  ❌ "additionalResources" - NEVER ADD THIS
  ❌ "references" - NEVER ADD THIS
  ❌ "furtherReading" - NEVER ADD THIS
  ❌ ANY other field whatsoever

IF you have resources, PUT THEM IN "additionalNotes" field BEFORE learningOutcome.

JSON must end EXACTLY like this:
  "learningOutcome": [
    "<b>Outcome 1:</b> ...",
    "<b>Outcome 2:</b> ..."
  ]
}

NOTHING AFTER THE CLOSING BRACE.
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
📏 PROBLEM STATEMENT LENGTH CONSTRAINT
═══════════════════════════════════════════════════════════════
Maximum: 250-300 words (2-3 paragraphs)

Keep it CONCISE and FOCUSED. If more detail needed, use "additionalNotes".
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
🧠 MULTI-PART QUESTION DETECTION
═══════════════════════════════════════════════════════════════

IF INPUT CONTAINS multi-part questions (a, b, c):

Example Input: "a. Implement VLOOKUP. b. Create pivot table."

MUST OUTPUT AS:
{
  "mainQuestionTitle": "Advanced Excel Data Analysis",
  "questionParts": [
    {
      "part": "a",
      "title": "VLOOKUP Implementation",
      "description": "Implement VLOOKUP and HLOOKUP..."
    },
    {
      "part": "b",
      "title": "Pivot Table Creation",
      "description": "Create pivot table with dataset..."
    }
  ]
}

═══════════════════════════════════════════════════════════════
📐 PROFESSIONAL FORMATTING STANDARDS
═══════════════════════════════════════════════════════════════

DOCUMENT STRUCTURE:
1. Header (student/course details) - NO CHANGES
2. Main Title/Question - 16px, bold
3. Multi-part breakdown - labeled (a, b, c) with indentation
4. Section headings - 15px, bold, underline
5. Content - 20px left margin, justified, line-height 1.8
6. Bullet points - Use <ul><li> tags
7. Tables - Use <table><tr><td> with proper styling

CRITICAL: Use HTML lists (<ul>, <ol>, <li>) for ALL bullet points.
NEVER use plain text hyphens or numbers.

═══════════════════════════════════════════════════════════════
🖼️ IMAGE ANALYSIS & INTEGRATION
═══════════════════════════════════════════════════════════════

${imageData ? `
YOU HAVE ${imageCount} IMAGES (Indices 0 to ${imageCount - 1}).
YOU MUST USE ALL ${imageCount} IMAGES.

VALID SECTION KEYS: "aim", "problemStatement", "dataset", "algorithm", "code", "output", "observation"

PLACEMENT RULES:
- Code Screenshots → "code"
- Output/Terminal Screenshots → "output"
- Hardware/Diagrams → "problemStatement" or "dataset"
- Data Tables/Graphs → "dataset" or "output"

Example:
"imagePlacements": {
  "code": [0],
  "output": [1]
}

ANALYZE DEEPLY: If image contains question text, extract it.
If shows dataset, include table in "dataset" field.
` : ''}

═══════════════════════════════════════════════════════════════
📝 REQUIRED OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════

YOU MUST GENERATE: ${sections.map((s, i) => `${i + 1}. ${s}`).join(', ')}

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL QUALITY RULES
═══════════════════════════════════════════════════════════════

✓ ALWAYS: Separate multi-part questions (a, b, c)
✓ ALWAYS: Use HTML lists (<ul>, <ol>) for bullet points
✓ ALWAYS: Apply consistent indentation (20px under headings)
✓ ALWAYS: Analyze and integrate uploaded images
✓ ALWAYS: Make learningOutcome the LAST field
✓ ALWAYS: Include comparison tables when comparing data

✗ NEVER: Add content after learningOutcome
✗ NEVER: Use plain text bullets/numbers
✗ NEVER: Skip multi-part formatting
✗ NEVER: Ignore uploaded images

═══════════════════════════════════════════════════════════════
📤 JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no backticks):

{
  "questionTitle": "Main Question Title",
  
  "questionParts": [
    {
      "part": "a",
      "title": "Part A Title",
      "description": "Full description"
    },
    {
      "part": "b",
      "title": "Part B Title",
      "description": "Full description"
    }
  ],
  
  "aim": "<div style='margin-left: 20px;'><p>Aim description</p><ul><li>Point 1</li><li>Point 2</li></ul></div>",
  
  "problemStatement": "<div style='margin-left: 20px;'><p>Problem description (250-300 words max)</p></div>",
  
  "dataset": "<div style='margin-left: 20px;'><table style='width: 100%; border-collapse: collapse;'><thead><tr><th style='padding: 10px; border: 1px solid #ddd;'>Column1</th><th style='padding: 10px; border: 1px solid #ddd;'>Column2</th></tr></thead><tbody><tr><td style='padding: 10px; border: 1px solid #ddd;'>Data1</td><td style='padding: 10px; border: 1px solid #ddd;'>Data2</td></tr></tbody></table></div>",
  
  "objective": [
    "Clear objective 1",
    "Clear objective 2"
  ],
  
  ${codeRequired ? `"code": {
    "language": "${preferredLanguage || 'python'}",
    "source": "Complete code with comments",
    "explanation": "<div><p><b>Key Concepts:</b></p><ul><li>Concept 1</li><li>Concept 2</li></ul></div>"
  },` : ''}
  
  "output": "<div style='margin-left: 20px;'><h4>Expected Output</h4><ol><li>Output 1</li><li>Output 2</li></ol></div>",
  
  "additionalNotes": "Any supplementary information (PUT RESOURCES HERE, NOT after learningOutcome)",
  
  ${imageCount > 0 ? `"imagePlacements": {
    "code": [0],
    "output": [1]
  },
  "imageCaptions": [
    "Figure 1: Caption for image 0",
    "Figure 2: Caption for image 1"
  ],` : ''}
  
  "learningOutcome": [
    "<b>Outcome 1:</b> Detailed skill gained",
    "<b>Outcome 2:</b> Application understanding"
  ]
}

⚠️ FINAL REMINDERS:
1. "learningOutcome" is THE LAST FIELD
2. NO "additionalResources" or similar fields after it
3. ${codeRequired ? `Include "code" field with ${preferredLanguage} code` : 'SKIP "code" field (theoretical topic)'}
4. All ${imageCount || 0} images must be mapped
5. Use HTML lists for all bullet points
6. Include comparison tables when appropriate
7. Multi-part questions must be properly formatted

═══════════════════════════════════════════════════════════════
🚀 PRE-SUBMISSION CHECKLIST
═══════════════════════════════════════════════════════════════

Before returning JSON, verify:
☑ Multi-part questions (a, b) properly separated
☑ Each section has proper heading
☑ Problem Statement UNDER 300 words
☑ ${codeRequired ? `Code in ${preferredLanguage} included` : 'NO code field (not needed)'}
☑ All ${imageCount || 0} images mapped
☑ Tables used for comparisons/datasets
☑ learningOutcome is THE LAST FIELD
☑ NO "additionalResources" exists ANYWHERE
☑ JSON is valid and parseable
☑ HTML lists used for ALL bullet points

NOW GENERATE WITH EXCELLENCE.`;
    }

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
- Make it DIFFERENT from current version
- Maintain academic quality
- Stay within syllabus scope
- Return ONLY new content text (not JSON)

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