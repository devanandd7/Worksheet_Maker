import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorksheet } from '../context/WorksheetContext';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import { toast } from 'react-toastify';
import { Sparkles, Loader, FileText, AlertCircle, Zap, Image as ImageIcon, X, Info, Upload, CheckCircle, MessageCircle, FilePlus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';

const GenerateWorksheet = () => {
    const { user, refreshProfile, getToken } = useAuth();
    const { currentTemplate, setCurrentWorksheet } = useWorksheet();
    const { universities, loading: loadingUniversities } = useGlobalConfig();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        topic: '',
        syllabus: '',
        difficulty: 'medium',
        subject: user?.defaultSubject || '',
        additionalInstructions: ''
    });
    const [exportOptions, setExportOptions] = useState({
        docs: true,
        pdf: false
    });

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [headerImage, setHeaderImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // University Presets
    const [selectedUniversity, setSelectedUniversity] = useState(''); // '' means nothing selected, 'other' means manual
    const [isPresetActive, setIsPresetActive] = useState(false);

    // Template caching constants
    const TEMPLATE_CACHE_KEY = user?._id ? `worksheet_template_cache_${user._id}` : 'worksheet_template_cache_guest';
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // Use Ref to break dependency cycle for selectedTemplate
    const selectedTemplateRef = useRef(selectedTemplate);
    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    const fetchTemplateSuggestions = useCallback(async (forceRefresh = false, universityOverride = null) => {
        // If overriding university, skip cache check to ensure we get specific templates
        if (!forceRefresh && !universityOverride) {
            try {
                const cached = localStorage.getItem(TEMPLATE_CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;

                    if (age < CACHE_DURATION) {
                        console.log(`✅ Using cached templates (${Math.round(age / 1000 / 60)}min old)`);
                        setTemplates(data);
                        // Check ref instead of state dependency
                        if (data?.length > 0 && !selectedTemplateRef.current) {
                            setSelectedTemplate(data[0]);
                        }
                        setLoadingTemplates(false);
                        return data;
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
            setLoadingTemplates(true);
            const token = await getToken();
            // Pass universityOverride if present
            const response = await api.getTemplateSuggestions(null, token, universityOverride);
            const templatesData = response.data.templates || [];

            // Only cache if NOT overriding (standard user suggestions)
            if (!universityOverride) {
                try {
                    localStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify({
                        data: templatesData,
                        timestamp: Date.now()
                    }));
                    console.log('📦 Templates cached for 30 minutes');
                } catch (cacheErr) {
                    console.error('Failed to cache templates:', cacheErr);
                }
            }

            setTemplates(templatesData);

            // Auto-select first template if none selected or if we just switched context
            if (templatesData.length > 0) {
                // Always select first if overriding (Preset Mode)
                // Check ref instead of state dependency
                if (universityOverride || !selectedTemplateRef.current) {
                    setSelectedTemplate(templatesData[0]);
                }
            } else if (universityOverride) {
                // If preset mode but no templates found...
                console.warn('⚠️ No templates found for this university override');
                setSelectedTemplate(null);
            }
            return templatesData;
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            return [];
        } finally {
            setLoadingTemplates(false);
        }
    }, [CACHE_DURATION, getToken, TEMPLATE_CACHE_KEY]);

    const handleUniversitySelect = useCallback(async (id, list = universities) => {
        setSelectedUniversity(id);

        if (id === 'other') {
            // Reset to manual mode
            setIsPresetActive(false);
            setHeaderImage(null);
            setUploadedImages([]);
            setPreviewUrl(null);
            setSelectedTemplate(null);
            // Fetch default suggestions for user
            fetchTemplateSuggestions(true);
            return;
        }

        const uni = list.find(u => u._id === id);
        if (uni) {
            setIsPresetActive(true);

            // Set Uploaded Images State (Visual feedback)
            setLoadingTemplates(true);

            // Use the Global Populated Template if available
            if (uni.defaultTemplateId && typeof uni.defaultTemplateId === 'object') {
                console.log('🎯 Using Global Populated Template:', uni.defaultTemplateId.templateName);

                // Construct a full template object if some fields are missing in populate but needed for UI
                // The populate in routes.js included: templateName sectionsOrder style level
                // We might need 'subject' or others if the UI relies on them.
                // However, the UI mainly checks _id and templateName.
                // Let's ensure we have a valid object.

                const templateObj = {
                    ...uni.defaultTemplateId,
                    university: uni.name, // Ensure context exists
                    subject: 'General' // Default if not in populate
                };

                setTemplates([templateObj]);
                setSelectedTemplate(templateObj);
                setLoadingTemplates(false);
            } else {
                // Fallback: Fetch from API if for some reason it's not populated
                console.warn('⚠️ Default template not populated, fetching from API...');
                setTemplates([]);
                try {
                    const fetchedTemplates = await fetchTemplateSuggestions(true, uni.name);
                    if (uni.defaultTemplateId) {
                        // It might be an ID string here if populate failed
                        const defaultTemplate = fetchedTemplates.find(t => t._id === uni.defaultTemplateId || t._id === uni.defaultTemplateId._id);
                        if (defaultTemplate) {
                            setSelectedTemplate(defaultTemplate);
                        }
                    }
                } catch (error) {
                    console.error('Failed to load preset templates:', error);
                    toast.error('Failed to load university templates');
                }
            }

            // Set Preview URL (Admin Asset)
            if (uni.sampleTemplateUrl) {
                setPreviewUrl(uni.sampleTemplateUrl);
            }
        }
    }, [universities, fetchTemplateSuggestions]);



    // State to track if initial logic has run
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    // Fetch Universities & Handle Initial Selection
    const initPageLogic = useCallback(async () => {
        console.log('🚀 Initializing Generate Page Logic (Global Config Mode)...');
        try {
            // Auto-select 'CU' (Chandigarh University) or similar if exists
            const defaultUni = universities.find(u =>
                u.name.toLowerCase().includes('chandigarh') ||
                u.name.toLowerCase() === 'cu'
            );

            if (defaultUni) {
                console.log('🏫 Auto-selecting University:', defaultUni.name);
                // This will trigger template fetch/set for this university
                await handleUniversitySelect(defaultUni._id, universities);
            } else {
                console.log('🏫 No default university found, loading generic templates.');
                // If no default university, load generic templates
                fetchTemplateSuggestions();
            }
        } catch (err) {
            console.error('Error in page init:', err);
            fetchTemplateSuggestions();
        } finally {
            setInitialCheckDone(true);
        }
    }, [universities, fetchTemplateSuggestions, handleUniversitySelect]);

    // Run initialization ONCE when user is ready AND global config is loaded
    useEffect(() => {
        if (user && !loadingUniversities && !initialCheckDone && universities.length > 0) {
            initPageLogic();
        } else if (user && !loadingUniversities && !initialCheckDone && universities.length === 0) {
            // Edge case: No universities loaded at all
            console.warn('⚠️ No universities found in global config.');
            setInitialCheckDone(true);
            fetchTemplateSuggestions();
        }
    }, [user, loadingUniversities, initialCheckDone, universities, initPageLogic]);

    // Re-fetch generic templates ONLY if we are already in manual mode and user changes
    // This prevents clobbering preset mode on re-renders
    useEffect(() => {
        if (initialCheckDone && (!selectedUniversity || selectedUniversity === 'other')) {
            console.log('👤 User context changed, refreshing generic templates...');
            fetchTemplateSuggestions();
        }
    }, [user?._id, initialCheckDone]); // Removed selectedUniversity dependency to avoid loop, handled by wait check


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
    }, []); // Run only once on mount

    // Fetch signed URL for preview
    useEffect(() => {
        let isMounted = true;

        const fetchPreviewUrl = async () => {
            if (!selectedTemplate && !isPresetActive) {
                if (isMounted) setPreviewUrl(null);
                return;
            }

            console.log('👀 Fetching preview for:', isPresetActive ? 'Preset University' : selectedTemplate?.templateName);

            if (isMounted) setLoadingPreview(true);

            try {
                // 1. Check for Preset Override FIRST
                if (isPresetActive && selectedUniversity && universities.length > 0) {
                    const currentUni = universities.find(u => u._id === selectedUniversity);
                    if (currentUni && currentUni.sampleTemplateUrl) {
                        console.log('📌 Using Preset Sample PDF:', currentUni.sampleTemplateUrl);
                        if (isMounted) {
                            setPreviewUrl(currentUni.sampleTemplateUrl);
                            setLoadingPreview(false);
                        }
                        return;
                    }
                }

                // 2. Standard Template Preview (Existing Logic)
                if (!selectedTemplate) {
                    if (isMounted) {
                        setPreviewUrl(null);
                        setLoadingPreview(false);
                    }
                    return;
                }

                // If it's a Cloudinary URL, try to get a signed URL
                if (selectedTemplate.samplePdfUrl && selectedTemplate.samplePdfUrl.includes('cloudinary')) {
                    const token = await getToken();
                    if (!token) {
                        console.warn('⚠️ No token available for preview fetch');
                        if (isMounted) setPreviewUrl(selectedTemplate.samplePdfUrl);
                        return;
                    }

                    const response = await api.getTemplateSignedUrl(selectedTemplate._id, token);

                    if (isMounted) {
                        if (response.data.success && response.data.signedUrl) {
                            console.log('✅ Setting signed preview URL');
                            setPreviewUrl(response.data.signedUrl);
                        } else {
                            console.warn('⚠️ API did not return signedUrl, using fallback');
                            setPreviewUrl(selectedTemplate.samplePdfUrl);
                        }
                    }
                } else {
                    // Not a Cloudinary URL or no URL at all, use as is
                    if (isMounted) setPreviewUrl(selectedTemplate.samplePdfUrl);
                }
            } catch (error) {
                console.error('❌ Failed to get signed preview URL:', error);
                if (isMounted && selectedTemplate?.samplePdfUrl) {
                    setPreviewUrl(selectedTemplate.samplePdfUrl);
                }
            } finally {
                if (isMounted) setLoadingPreview(false);
            }
        };

        fetchPreviewUrl();

        return () => {
            isMounted = false;
        };
    }, [selectedTemplate, getToken, isPresetActive, selectedUniversity, universities]);

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

    const handleDownloadDocx = async (worksheetId, topic) => {
        try {
            console.log('📄 Starting auto-download for DOCX...');
            const token = await getToken();
            const response = await api.downloadWorksheetDocx(worksheetId, token);

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_worksheet.docx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            console.log('✅ DOCX download triggered successfully');
        } catch (error) {
            console.error('❌ Failed to download DOCX:', error);
            toast.error('Failed to auto-download DOCX');
        }
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
            } else {
                console.error('❌ CRITICAL: Template selected but has NO ID:', selectedTemplate);
                toast.error('Internal Error: Selected template is invalid. Please refresh.');
                setGenerating(false);
                return;
            }
            data.append('additionalInstructions', formData.additionalInstructions);

            // Append Header Image
            // Priority: Preset URL (if active) > Manual Upload (if not active, i.e., 'Other')
            if (isPresetActive) {
                // Find selected university object
                const currentUni = universities.find(u => u._id === selectedUniversity);
                if (currentUni && currentUni.headerImageUrl) {
                    data.append('headerImageUrl', currentUni.headerImageUrl); // Updated key and property
                    console.log('📌 Using Preset Header URL:', currentUni.headerImageUrl);
                }
                // Also support legacy key just in case, or we update backend to prefer headerImageUrl
                // Let's stick to headerImageUrl and update backend.
                // DO NOT append manual 'headerImage' file here, even if it exists in state
            } else if (headerImage) {
                // Manual Upload Mode ('Other')
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

            // Auto-download DOCX if selected
            if (exportOptions.docs) {
                // We don't await this to avoid delaying navigation, but it starts immediately
                handleDownloadDocx(response.data.worksheet._id, formData.topic);
            }

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
            <div className="container container-lg">
                <div className="fade-in">

                    {/* Preview Sidebar - Only visible when template selected manually (not preset) */}
                    {/* {selectedTemplate && !isPresetActive && (
                        ... commented out code ...
                    )} */}

                    {/* Main Form Content */}
                    <div>
                        {/* Header */}
                        <div className="text-center mb-4 fade-in">
                            <h1 className="gradient-text mb-1">Generate Worksheet</h1>
                            <p className="text-secondary text-lg">
                                AI will generate a complete, unique worksheet based on your inputs
                            </p>
                        </div>

                        {/* University Selector */}
                        <div className="card mb-6 p-4 border-2 border-indigo-50">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Select University / Organization
                            </label>
                            <select
                                value={selectedUniversity}
                                onChange={(e) => handleUniversitySelect(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white"
                            >
                                <option value="" disabled>-- Select your institution --</option>
                                {universities.map(uni => (
                                    <option key={uni._id} value={uni._id}>{uni.name}</option>
                                ))}
                                <option value="other">Other (Upload Custom Header & Template)</option>
                            </select>
                            {isPresetActive && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Using preset header and template. Manual upload disabled.
                                </p>
                            )}

                            {/* Relocated Upload Button for "Other" University */}
                            {selectedUniversity === 'other' && (
                                <div className="mt-4 pt-3 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-up">
                                    <div className="flex items-center gap-2 text-indigo-700">
                                        <Upload size={18} />
                                        <span className="text-sm font-medium">Need to set up a new university format?</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/upload-sample')}
                                        className="btn btn-primary btn-sm flex items-center gap-2"
                                    >
                                        <FilePlus size={16} />
                                        Upload Sample Template
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Guidance Message for "Other" Option */}
                        {selectedUniversity === 'other' && (
                            <div className="card mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 animate-slide-up">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Info size={16} className="text-blue-600" />
                                    <h3 className="font-semibold text-gray-800" style={{ fontSize: '11px' }}>Getting Started with Custom Templates</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                    {/* Column 1: For New Users */}
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Upload size={14} className="text-indigo-600" />
                                            <h4 className="font-semibold text-indigo-900" style={{ fontSize: '10px' }}>📋 For New Users</h4>
                                        </div>
                                        <p className="text-gray-600 mb-2" style={{ fontSize: '10px' }}>First time using "Other"? Follow these steps:</p>
                                        <ol className="text-gray-700 space-y-1 ml-3 list-decimal" style={{ fontSize: '10px' }}>
                                            <li>
                                                <strong>Upload Sample PDF:</strong> Click{' '}
                                                <button
                                                    onClick={() => navigate('/upload-sample')}
                                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                                >
                                                    Upload Template
                                                </button>{' '}
                                                to upload a sample PDF.
                                            </li>
                                            <li><strong>AI Analysis:</strong> AI analyzes PDF structure automatically.</li>
                                            <li><strong>Save Template:</strong> Click "Save" to store template.</li>
                                            <li><strong>Add Header:</strong> Upload a header image below.</li>
                                            <li><strong>Upload Once:</strong> ✅ Upload files <strong>once</strong> only!</li>
                                        </ol>
                                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                            <p className="text-gray-600 flex items-center gap-1" style={{ fontSize: '9px' }}>
                                                <MessageCircle size={12} className="text-yellow-600" />
                                                <span><strong>Issues?</strong> Send feedback.</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Column 2: For Existing Users */}
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <CheckCircle size={14} className="text-green-600" />
                                            <h4 className="font-semibold text-green-900" style={{ fontSize: '10px' }}>✅ For Existing Users</h4>
                                        </div>
                                        <p className="text-gray-600 mb-2" style={{ fontSize: '10px' }}>Already set up? Here's what you need:</p>
                                        <div className="text-gray-700 space-y-1.5" style={{ fontSize: '10px' }}>
                                            <div className="flex items-start gap-1.5">
                                                <span className="text-green-600 font-bold mt-0.5">1.</span>
                                                <div>
                                                    <strong>Continue:</strong> If uploaded, just scroll down and generate.
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <span className="text-green-600 font-bold mt-0.5">2.</span>
                                                <div>
                                                    <strong>Update Header:</strong> Upload new image below to <strong>auto-replace</strong>.
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <span className="text-green-600 font-bold mt-0.5">3.</span>
                                                <div>
                                                    <strong>Change Template:</strong> Visit{' '}
                                                    <button
                                                        onClick={() => navigate('/upload-sample')}
                                                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                                                    >
                                                        Upload Template
                                                    </button>.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                            <p className="text-gray-600 flex items-center gap-1" style={{ fontSize: '9px' }}>
                                                <MessageCircle size={12} className="text-green-600" />
                                                <span><strong>Need help?</strong> Send feedback.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Template Selection */}
                        {/* Show if NOT preset OR if preset is active but NO template auto-selected (fallback) */}
                        {(!isPresetActive || !selectedTemplate) && templates.length > 0 && (
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

                                {!isPresetActive && (
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
                                )}

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

                            {/* Export Options */}
                            <div className="card mb-3 p-4 bg-gray-50 border-gray-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    Export Options
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.docs}
                                                onChange={(e) => setExportOptions(prev => ({ ...prev, docs: e.target.checked }))}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </div>
                                        <span className={`text-sm font-medium ${exportOptions.docs ? 'text-primary' : 'text-gray-600'}`}>
                                            Download as DOCS (.docx)
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.pdf}
                                                onChange={(e) => setExportOptions(prev => ({ ...prev, pdf: e.target.checked }))}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </div>
                                        <span className={`text-sm font-medium ${exportOptions.pdf ? 'text-primary' : 'text-gray-600'}`}>
                                            Generate PDF
                                        </span>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                    {exportOptions.docs && "DOCS file will download automatically after generation."}
                                    {exportOptions.docs && exportOptions.pdf && " "}
                                    {exportOptions.pdf && "PDF will be generated and saved to your history."}
                                </p>
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
