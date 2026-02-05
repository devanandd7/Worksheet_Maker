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

            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: prompt,
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
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
        const { topic, syllabus, difficulty, sections, userContext, userMemory, variationSeed } = params;

        return `You are an academic worksheet generation AI for ${userContext.university}.

====================
STRICT RULES
====================
1. Follow the EXACT section order provided
2. Stay STRICTLY within the syllabus scope
3. Generate ORIGINAL content - no plagiarism
4. Use ${userMemory?.writingDepth || 'medium'} level of detail
5. Academic ${userContext.level} level writing
6. Return ONLY valid JSON - no markdown, no backticks, no preamble

====================
WORKSHEET STRUCTURE
====================
Sections (STRICT ORDER):
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

====================
CONTENT REQUIREMENTS
====================
Topic: ${topic}
Difficulty: ${difficulty}
Syllabus Scope: ${syllabus}

Context:
- University: ${userContext.university}
- Course: ${userContext.course}
- Semester: ${userContext.semester}
- Subject: ${userContext.subject}

====================
CONTENT VARIATION
====================
Variation Level: ${userMemory?.variationLevel || 'high'}
Variation Seed: ${variationSeed || Date.now()}

IMPORTANT: Make this worksheet UNIQUE by:
- Using different example names/datasets
- Varying code variable names
- Different problem phrasing
- Unique explanations

====================
COMMON MISTAKES TO AVOID
====================
${userMemory?.commonMistakes?.length > 0 ? userMemory.commonMistakes.map(m => `- ${m}`).join('\n') : '- No specific mistakes recorded'}

====================
OUTPUT FORMAT
====================
Return ONLY this JSON structure (no markdown formatting, no backticks).
IMPORTANT: Use HTML tags for formatting inside the JSON strings (<ul>, <li>, <table>, <b>, <br>).

{
  "aim": "detailed aim text here (use HTML: <ul> for lists, <b> for bold)",
  "problemStatement": "problem description (use HTML)",
  "dataset": "dataset information (use HTML table if apt)",
  "objective": ["objective 1", "objective 2", "objective 3"],
  "code": "complete working code here (no HTML tags, just raw code)",
  "output": "expected output description (use HTML)",
  "learningOutcome": ["learning point 1", "learning point 2", "learning point 3"]
}

CRITICAL: Ensure all code is syntactically correct and runnable. Use realistic dataset names.`;
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