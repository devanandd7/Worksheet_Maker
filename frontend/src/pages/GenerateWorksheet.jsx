import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorksheet } from '../context/WorksheetContext';
import { toast } from 'react-toastify';
import { Sparkles, Loader, FileText, AlertCircle, Zap } from 'lucide-react';
import api from '../services/api';

const GenerateWorksheet = () => {
    const { user } = useAuth();
    const { currentTemplate, setCurrentWorksheet } = useWorksheet();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        topic: '',
        syllabus: '',
        difficulty: 'medium',
        subject: user?.defaultSubject || '',
        additionalInstructions: ''
    });

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    const fetchTemplateSuggestions = useCallback(async () => {
        try {
            const response = await api.getTemplateSuggestions();
            setTemplates(response.data.templates || []);

            if (response.data.templates?.length > 0 && !selectedTemplate) {
                setSelectedTemplate(response.data.templates[0]);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    }, [selectedTemplate]);

    useEffect(() => {
        fetchTemplateSuggestions();
    }, [fetchTemplateSuggestions]);

    useEffect(() => {
        if (currentTemplate) {
            setSelectedTemplate(currentTemplate);
        }
    }, [currentTemplate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!formData.topic.trim()) {
            toast.error('Please enter a topic');
            return;
        }

        if (!formData.syllabus.trim()) {
            toast.error('Please enter syllabus scope');
            return;
        }

        setGenerating(true);

        try {
            const payload = {
                topic: formData.topic.trim(),
                syllabus: formData.syllabus.trim(),
                difficulty: formData.difficulty,
                subject: formData.subject || user?.defaultSubject || 'General',
                templateId: selectedTemplate?._id || null,
                additionalInstructions: formData.additionalInstructions
            };

            const response = await api.generateWorksheet(payload);

            setCurrentWorksheet(response.data.worksheet);
            toast.success('Worksheet generated successfully!');

            // Navigate to preview
            setTimeout(() => {
                navigate('/preview');
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate worksheet');
            console.error('Generation error:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div className="mb-3">
                    <h1 className="mb-1">Generate Worksheet</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        AI will generate a complete, unique worksheet based on your inputs
                    </p>
                </div>

                {/* Template Selection */}
                {templates.length > 0 && (
                    <div className="card mb-3">
                        <h3 className="mb-2">Select Template</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Choose a template that matches your university and subject
                        </p>

                        {loadingTemplates ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader size={32} className="spinner" style={{ color: 'var(--primary)' }} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {templates.map((template) => (
                                    <div
                                        key={template._id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className="card"
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedTemplate?._id === template._id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: selectedTemplate?._id === template._id ? 'var(--primary-light)' : 'var(--bg-primary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="mb-1">{template.templateName}</h4>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {template.university} • {template.subject} • {template.level}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                    Used {template.usageCount} times • {template.sectionsOrder?.length} sections
                                                </p>
                                            </div>
                                            {selectedTemplate?._id === template._id && (
                                                <div className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                                                    Selected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/upload-sample')}
                            className="btn btn-secondary mt-2"
                            style={{ width: '100%' }}
                        >
                            <FileText size={20} />
                            Upload New Template
                        </button>
                    </div>
                )}

                {/* Generation Form */}
                <form onSubmit={handleGenerate}>
                    <div className="card mb-3">
                        <h3 className="mb-3">Worksheet Details</h3>

                        {/* Topic */}
                        <div className="input-group">
                            <label className="input-label">
                                Topic / Experiment Name *
                            </label>
                            <input
                                type="text"
                                name="topic"
                                className="input-field"
                                placeholder="e.g., Linear Regression Implementation"
                                value={formData.topic}
                                onChange={handleInputChange}
                                required
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                The main topic or experiment title
                            </p>
                        </div>

                        {/* Subject */}
                        <div className="input-group">
                            <label className="input-label">
                                Subject
                            </label>
                            <input
                                type="text"
                                name="subject"
                                className="input-field"
                                placeholder="e.g., Machine Learning Lab"
                                value={formData.subject}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Syllabus Scope */}
                        <div className="input-group">
                            <label className="input-label">
                                Syllabus Scope / Topics to Cover *
                            </label>
                            <textarea
                                name="syllabus"
                                className="input-field"
                                rows="4"
                                placeholder="e.g., Linear regression, cost function, gradient descent, model evaluation, sklearn implementation"
                                value={formData.syllabus}
                                onChange={handleInputChange}
                                required
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                List the concepts and topics that should be covered in the worksheet
                            </p>
                        </div>

                        {/* Difficulty */}
                        <div className="input-group">
                            <label className="input-label">
                                Difficulty Level
                            </label>
                            <select
                                name="difficulty"
                                className="input-field"
                                value={formData.difficulty}
                                onChange={handleInputChange}
                            >
                                <option value="easy">Easy - Basic concepts and simple examples</option>
                                <option value="medium">Medium - Intermediate complexity</option>
                                <option value="hard">Hard - Advanced topics and complex problems</option>
                            </select>
                        </div>

                        {/* Additional Instructions */}
                        <div className="input-group">
                            <label className="input-label">
                                Additional Instructions (Optional)
                            </label>
                            <textarea
                                name="additionalInstructions"
                                className="input-field"
                                rows="3"
                                placeholder="e.g., Focus on practical implementation, include visualization examples, use specific dataset..."
                                value={formData.additionalInstructions}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--bg-primary))' }}>
                        <div className="flex gap-2">
                            <Zap size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <div>
                                <h4 className="mb-1">AI-Powered Generation</h4>
                                <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1.25rem', lineHeight: 1.7 }}>
                                    <li>Each worksheet is 100% unique with anti-plagiarism variance</li>
                                    <li>Content follows your syllabus scope exactly</li>
                                    <li>Code examples use different variable names and datasets</li>
                                    <li>Generation takes ~30-60 seconds</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        type="submit"
                        disabled={generating}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                    >
                        {generating ? (
                            <>
                                <Loader size={20} className="spinner" />
                                Generating Worksheet... (30-60s)
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Worksheet with AI
                            </>
                        )}
                    </button>

                    {generating && (
                        <div className="alert alert-info mt-3">
                            <AlertCircle size={20} />
                            <span>
                                AI is generating your worksheet. This may take up to 60 seconds. Please don't close this page.
                            </span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default GenerateWorksheet;
