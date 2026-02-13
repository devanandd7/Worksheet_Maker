import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorksheet } from '../context/WorksheetContext';
import { toast } from 'react-toastify';
import { Sparkles, Loader, FileText, AlertCircle, Zap, Image as ImageIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

const GenerateWorksheet = () => {
    const { user, refreshProfile, getToken } = useAuth();
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
    const [uploadedImages, setUploadedImages] = useState([]);
    const [headerImage, setHeaderImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Template caching constants
    const TEMPLATE_CACHE_KEY = user?._id ? `worksheet_template_cache_${user._id}` : 'worksheet_template_cache_guest';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    const fetchTemplateSuggestions = useCallback(async (forceRefresh = false) => {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(TEMPLATE_CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;

                    if (age < CACHE_DURATION) {
                        console.log(`✅ Using cached templates (${Math.round(age / 1000 / 60)}min old)`);
                        setTemplates(data);
                        if (data?.length > 0 && !selectedTemplate) {
                            setSelectedTemplate(data[0]);
                        }
                        setLoadingTemplates(false);
                        return;
                    } else {
                        console.log('⏰ Cache expired, fetching fresh templates');
                    }
                }
            } catch (err) {
                console.error('Cache read error:', err);
            }
        }

        // Fetch from API
        try {
            const token = await getToken();
            const response = await api.getTemplateSuggestions(null, token);
            const templatesData = response.data.templates || [];

            // Cache the data
            try {
                localStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify({
                    data: templatesData,
                    timestamp: Date.now()
                }));
                console.log('📦 Templates cached for 30 minutes');
            } catch (cacheErr) {
                console.error('Failed to cache templates:', cacheErr);
            }

            setTemplates(templatesData);

            if (templatesData.length > 0 && !selectedTemplate) {
                setSelectedTemplate(templatesData[0]);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoadingTemplates(false);
        }
    }, [selectedTemplate, CACHE_DURATION, getToken, TEMPLATE_CACHE_KEY]);

    useEffect(() => {
        fetchTemplateSuggestions();
    }, [fetchTemplateSuggestions]);

    useEffect(() => {
        if (currentTemplate) {
            setSelectedTemplate(currentTemplate);
        }
    }, [currentTemplate]);

    // Refresh user profile to get headerImageUrl
    useEffect(() => {
        if (refreshProfile) {
            refreshProfile();
        }
    }, [refreshProfile]);

    // Fetch signed URL for preview
    useEffect(() => {

        const fetchPreviewUrl = async () => {
            if (!selectedTemplate) {
                setPreviewUrl(null);
                return;
            }

            console.log('👀 Fetching preview for:', selectedTemplate.templateName);
            console.log('🔗 Sample PDF URL from object:', selectedTemplate.samplePdfUrl);

            setLoadingPreview(true);
            try {
                // If it's already a public URL (not Cloudinary) or we want to try direct first, we could.
                if (!selectedTemplate.samplePdfUrl) {
                    console.warn('❌ Template has no samplePdfUrl');
                    setPreviewUrl(null);
                    return;
                }

                const token = await getToken();
                const response = await api.getTemplateSignedUrl(selectedTemplate._id, token);

                console.log('📡 Signed URL API Response:', response.data);

                if (response.data.success && response.data.signedUrl) {
                    console.log('✅ Setting preview URL:', response.data.signedUrl);
                    setPreviewUrl(response.data.signedUrl);
                } else {
                    console.warn('⚠️ API did not return signedUrl, using fallback');
                    setPreviewUrl(selectedTemplate.samplePdfUrl); // Fallback
                }
            } catch (error) {
                console.error('❌ Failed to get signed preview URL:', error);
                // Fallback to the property if it exists
                if (selectedTemplate?.samplePdfUrl) {
                    setPreviewUrl(selectedTemplate.samplePdfUrl);
                }
            } finally {
                setLoadingPreview(false);
            }
        };

        fetchPreviewUrl();
    }, [selectedTemplate, getToken]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onDrop = useCallback((acceptedFiles) => {
        // Limit to 5 images total
        if (uploadedImages.length + acceptedFiles.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const newImages = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));

        setUploadedImages(prev => [...prev, ...newImages]);
    }, [uploadedImages]);

    const removeImage = (index) => {
        setUploadedImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview); // Cleanup memory
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        disabled: generating
    });

    const onDropHeader = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            Object.assign(file, {
                preview: URL.createObjectURL(file)
            });
            setHeaderImage(file);

            // Also upload to user profile for permanent storage
            try {
                const formData = new FormData();
                formData.append('headerImage', file);

                console.log('📤 Uploading header to profile...');
                const token = await getToken();
                await api.uploadHeader(formData, token);
                console.log('✅ Header saved to profile!');

                // Refresh user profile to show the new stored header
                if (refreshProfile) {
                    await refreshProfile();
                }

                toast.success('Header saved! Will be used for all future worksheets.');
            } catch (error) {
                console.error('Failed to save header to profile:', error);
                toast.error('Failed to save header permanently');
            }
        }
    }, [refreshProfile, getToken]);

    const removeHeaderImage = () => {
        if (headerImage) {
            URL.revokeObjectURL(headerImage.preview);
            setHeaderImage(null);
        }
    };

    const { getRootProps: getHeaderRootProps, getInputProps: getHeaderInputProps, isDragActive: isHeaderDragActive } = useDropzone({
        onDrop: onDropHeader,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB
        disabled: generating
    });

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

        if (!selectedTemplate || !selectedTemplate._id) {
            toast.error('Please select a template');
            return;
        }

        setGenerating(true);

        try {
            // Create FormData for multipart upload
            const data = new FormData();
            data.append('topic', formData.topic.trim());
            data.append('syllabus', formData.syllabus.trim());
            data.append('difficulty', formData.difficulty);
            data.append('subject', formData.subject || user?.defaultSubject || 'General');
            if (selectedTemplate?._id) {
                data.append('templateId', selectedTemplate._id);
            }
            data.append('additionalInstructions', formData.additionalInstructions);

            // Append Header Image
            if (headerImage) {
                data.append('headerImage', headerImage);
            }

            // Append images
            uploadedImages.forEach((file) => {
                data.append('images', file);
            });

            // Need to adjust API call to handle FormData (not JSON)
            // api.generateWorksheet handles this if updated, or we use axios directly with correct headers
            // Assuming api.generateWorksheet is flexible or we update it.
            // For now, let's assume we need to update api.js or force header here if possible, 
            // but standard axios handles FormData automatically.

            // but standard axios handles FormData automatically.

            // Debug logging
            console.log('🚀 Generating Worksheet with Data:');
            for (let pair of data.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            if (selectedTemplate) {
                console.log('Selected Template ID:', selectedTemplate._id);
            } else {
                console.warn('⚠️ No template selected!');
            }

            const token = await getToken();
            const response = await api.generateWorksheet(data, token);

            setCurrentWorksheet(response.data.worksheet);
            toast.success('Worksheet generated successfully!');

            // Cleanup previews
            uploadedImages.forEach(file => URL.revokeObjectURL(file.preview));

            // Navigate to preview with ID
            setTimeout(() => {
                navigate(`/preview/${response.data.worksheet._id}`);
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate worksheet');
            console.error('Generation error:', error);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        // Cleanup function for previews on unmount
        return () => {
            uploadedImages.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, []);

    return (
        <div className="page-container">
            <div className={`container ${selectedTemplate ? 'container-lg' : 'container-sm'}`}>
                <div className={selectedTemplate ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : ""}>

                    {/* Preview Sidebar - Only visible when template selected */}
                    {selectedTemplate && (
                        <div className="lg:col-span-5 xl:col-span-4">
                            <div className="sticky top-24 glass-panel p-4 rounded-xl fade-in">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <FileText size={20} className="text-primary" />
                                    Template Preview
                                </h3>

                                <div
                                    style={{
                                        height: 'calc(100vh - 280px)',
                                        minHeight: '700px',
                                        width: '100%'
                                    }}
                                    className="bg-gray-100 rounded-lg overflow-hidden border border-border relative"
                                >
                                    {loadingPreview ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary">
                                            <Loader size={32} className="spinner mb-2" />
                                            <p>Loading preview...</p>
                                        </div>
                                    ) : previewUrl ? (
                                        <>
                                            {console.log('📄 Rendering Preview URL:', previewUrl)}
                                            <iframe
                                                src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                    display: 'block'
                                                }}
                                                title="Template Preview"
                                            />
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary p-6 text-center">
                                            <FileText size={48} className="mb-3 opacity-20" />
                                            <p>No preview available for this template</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <h4 className="font-medium text-primary text-sm mb-1">{selectedTemplate.templateName}</h4>
                                    <p className="text-xs text-secondary">
                                        {selectedTemplate.university} • {selectedTemplate.subject}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Form Content */}
                    <div className={selectedTemplate ? "lg:col-span-7 xl:col-span-8" : ""}>
                        {/* Header */}
                        <div className="text-center mb-4 fade-in">
                            <h1 className="gradient-text mb-1">Generate Worksheet</h1>
                            <p className="text-secondary text-lg">
                                AI will generate a complete, unique worksheet based on your inputs
                            </p>
                        </div>

                        {/* Template Selection */}
                        {templates.length > 0 && (
                            <div className="card mb-3 animate-slide-up">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <h3 className="mb-1">Select Template</h3>
                                        <p className="text-sm text-secondary">
                                            Choose a template that matches your university and subject
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => fetchTemplateSuggestions(true)}
                                            className="btn btn-secondary btn-sm"
                                            title="Refresh templates"
                                            disabled={loadingTemplates}
                                        >
                                            <FileText size={16} />
                                            Refresh
                                        </button>
                                        <button
                                            onClick={() => navigate('/upload-sample')}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            <FileText size={16} />
                                            Upload New
                                        </button>
                                    </div>
                                </div>

                                {loadingTemplates ? (
                                    <div className="text-center p-4">
                                        <Loader size={32} className="spinner mx-auto text-primary" />
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {templates.map((template) => (
                                            <div
                                                key={template._id}
                                                onClick={() => setSelectedTemplate(template)}
                                                className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedTemplate?._id === template._id
                                                    ? 'border-primary bg-primary-light/10 ring-2 ring-primary/20'
                                                    : 'border-border hover:border-primary-light hover:bg-bg-secondary'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold mb-1 text-primary">{template.templateName}</h4>
                                                        <p className="text-sm text-secondary">
                                                            {template.university} • {template.subject} • {template.level}
                                                        </p>
                                                        <p className="text-xs text-tertiary mt-1 flex items-center gap-2">
                                                            {template.usageCount > 0 ? (
                                                                <span>Used {template.usageCount} times</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium border border-green-200">
                                                                    New
                                                                </span>
                                                            )}
                                                            <span>• {template.sectionsOrder?.length} sections</span>
                                                        </p>
                                                    </div>
                                                    {selectedTemplate?._id === template._id && (
                                                        <div className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                                                            Selected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                {/* <div className="input-group">
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
                                </div> */}

                                <div className="input-group">
                                    <label className="input-label">
                                        University/College Header Image (Optional)
                                    </label>

                                    <div
                                        {...getHeaderRootProps()}
                                        style={{
                                            border: '2px dashed var(--border)',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: isHeaderDragActive ? 'var(--primary-light)' : 'var(--bg-primary)',
                                            transition: 'border .24s ease-in-out',
                                            marginBottom: '10px'
                                        }}
                                    >
                                        <input {...getHeaderInputProps()} />
                                        <ImageIcon size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                                        {isHeaderDragActive ? (
                                            <p style={{ color: 'var(--primary)' }}>Drop header image here...</p>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)' }}>
                                                Drag & drop University/College Logo here (Max 1 image)
                                            </p>
                                        )}
                                    </div>

                                    {/* Temporary Header Image Preview (when user uploads new one) */}
                                    {headerImage && (
                                        <div style={{ position: 'relative', width: '200px', height: '60px', marginTop: '10px', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }}>
                                            <img
                                                src={headerImage.preview}
                                                alt="Header Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={removeHeaderImage}
                                                style={{
                                                    position: 'absolute',
                                                    top: '-10px',
                                                    right: '-10px',
                                                    background: 'var(--error)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '24px',
                                                    height: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Show stored header ALWAYS below upload section */}
                                    {user?.headerImageUrl && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-secondary mb-2" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                ✅ Your saved header (will be used automatically):
                                            </p>
                                            <img
                                                src={user.headerImageUrl}
                                                alt="Saved Header"
                                                style={{ maxHeight: '60px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px', background: 'white' }}
                                            />
                                            <p className="text-xs text-tertiary mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {headerImage ? 'You just uploaded a new header - it replaced this one and will be used from now on.' : 'This header will be used automatically for all worksheets.'}
                                            </p>
                                        </div>
                                    )}

                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        This image will appear at the very top of your worksheet PDF.
                                    </p>
                                </div>

                                {/* Image Upload for Context (NEW) */}
                                <div className="input-group">
                                    <label className="input-label">
                                        Upload Images for Context (Optional)
                                    </label>
                                    <div
                                        {...getRootProps()}
                                        style={{
                                            border: '2px dashed var(--border)',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: isDragActive ? 'var(--primary-light)' : 'var(--bg-primary)',
                                            transition: 'border .24s ease-in-out'
                                        }}
                                    >
                                        <input {...getInputProps()} />
                                        <ImageIcon size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                                        {isDragActive ? (
                                            <p style={{ color: 'var(--primary)' }}>Drop the images here...</p>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)' }}>
                                                Drag & drop images here (screenshots, code, diagrams), or click to select files.<br />
                                                <span style={{ fontSize: '0.8rem' }}>Max 5 images, 5MB each.</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Image Previews */}
                                    {uploadedImages.length > 0 && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {uploadedImages.map((file, index) => (
                                                <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                    <img
                                                        src={file.preview}
                                                        alt={`preview-${index}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-5px',
                                                            right: '-5px',
                                                            background: 'var(--error)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        The AI will analyze these images and place them in appropriate sections (e.g., Code, Output).
                                    </p>
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
                                            <li>Smart Image Analysis: Uploaded images are auto-placed in context</li>
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
            </div>
        </div>
    );
};

export default GenerateWorksheet;
