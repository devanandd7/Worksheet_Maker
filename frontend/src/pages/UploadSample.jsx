import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorksheet } from '../context/WorksheetContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Upload, FileText, AlertCircle, Loader, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';

const UploadSample = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploadedData, setUploadedData] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const { setCurrentTemplate } = useWorksheet();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Please upload a PDF file');
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }
            setFile(selectedFile);
            setUploadedData(null);
            setAnalysisResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a PDF file first');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await api.uploadSamplePDF(formData);

            // Backend returns: {success: true, data: {pdfUrl, extractedText, pages}}
            // Axios wraps in response.data, so access response.data.data.pdfUrl
            if (!response.data?.data?.pdfUrl) {
                console.error('Invalid response structure:', response.data);
                toast.error('Upload failed: No PDF URL returned');
                return;
            }

            setUploadedData(response.data.data);
            toast.success('PDF uploaded successfully! Now analyzing...');

            // Automatically start analysis
            await handleAnalyze(response.data.data.pdfUrl, response.data.data.extractedText);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to upload PDF';

            // Check if it's a Cloudinary configuration error
            if (errorMsg.includes('Invalid cloud_name') || errorMsg.includes('Cloudinary')) {
                toast.error('⚠️ Cloudinary not configured! Click "Skip & Generate Worksheet" button below to test the app.', {
                    autoClose: 8000
                });
                console.error('Cloudinary configuration error. See CLOUDINARY_SETUP.md for setup instructions.');
            } else {
                toast.error(errorMsg);
            }
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleAnalyze = async (pdfUrl, extractedText) => {
        // Validate we have necessary data
        if (!pdfUrl && !uploadedData?.pdfUrl) {
            toast.error('No PDF data available for analysis');
            return;
        }

        setAnalyzing(true);
        try {
            const response = await api.analyzeTemplate({
                pdfUrl: pdfUrl || uploadedData?.pdfUrl,
                extractedText: extractedText || uploadedData?.extractedText
            });

            setAnalysisResult(response.data);
            toast.success('Analysis complete! Review the detected structure below.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to analyze PDF');
            console.error('Analysis error:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!analysisResult) {
            toast.error('Please analyze the PDF first');
            return;
        }

        try {
            const saveData = {
                ...analysisResult,
                subject: user?.defaultSubject || 'General',
                pdfUrl: uploadedData.pdfUrl
            };

            console.log('Saving template with data:', saveData);
            const response = await api.saveTemplate(saveData);

            setCurrentTemplate(response.data.template);
            toast.success('Template saved successfully!');

            // Navigate to structure preview
            setTimeout(() => {
                navigate('/structure-preview');
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save template');
            console.error('Save template error:', error);
        }
    };

    const handleSkipToGenerate = () => {
        navigate('/generate');
    };

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <div className="container">
                {/* Header */}
                <div className="mb-3">
                    <h1 className="mb-1">Upload Sample Worksheet</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Upload a sample worksheet PDF from your university. AI will learn the structure and format.
                    </p>
                </div>

                {/* Upload Section */}
                <div className="card mb-3">
                    <h3 className="mb-2">Step 1: Select PDF File</h3>

                    <div className="upload-zone" style={{
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        background: file ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'all 0.3s ease'
                    }}>
                        <Upload size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />

                        {!file ? (
                            <>
                                <p className="mb-2">Drag & drop your worksheet PDF here, or click to browse</p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="pdf-upload"
                                />
                                <label htmlFor="pdf-upload" className="btn btn-primary">
                                    <FileText size={20} />
                                    Choose PDF File
                                </label>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                                    Maximum file size: 10MB
                                </p>
                            </>
                        ) : (
                            <div>
                                <CheckCircle size={32} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
                                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{file.name}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setUploadedData(null);
                                        setAnalysisResult(null);
                                    }}
                                    className="btn btn-secondary btn-sm mt-2"
                                >
                                    Change File
                                </button>
                            </div>
                        )}
                    </div>

                    {file && !uploadedData && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="btn btn-primary btn-lg mt-3"
                            style={{ width: '100%' }}
                        >
                            {uploading ? (
                                <>
                                    <Loader size={20} className="spinner" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Upload & Analyze PDF
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Analysis Results */}
                {uploadedData && (
                    <div className="card mb-3">
                        <h3 className="mb-2">Step 2: AI Analysis Results</h3>

                        {analyzing ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <Loader size={48} className="spinner" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                                <p>Analyzing worksheet structure with AI...</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    This may take 20-30 seconds
                                </p>
                            </div>
                        ) : analysisResult ? (
                            <div>
                                <div className="alert alert-success mb-3">
                                    <CheckCircle size={20} />
                                    <span>Analysis complete! AI has detected the following structure:</span>
                                </div>

                                <div className="mb-3">
                                    <h4 className="mb-2">Detected Information</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>University</p>
                                            <p style={{ fontWeight: 500 }}>{analysisResult.university || 'Not detected'}</p>
                                        </div>
                                        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Subject</p>
                                            <p style={{ fontWeight: 500 }}>{analysisResult.subject || 'Not detected'}</p>
                                        </div>
                                        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Style</p>
                                            <p style={{ fontWeight: 500 }}>{analysisResult.style || 'Standard'}</p>
                                        </div>
                                        <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Level</p>
                                            <p style={{ fontWeight: 500 }}>{analysisResult.level || 'Not detected'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <h4 className="mb-2">Detected Sections (in order)</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {analysisResult.sectionsOrder?.map((section, index) => (
                                            <div
                                                key={index}
                                                className="badge"
                                                style={{
                                                    background: 'var(--primary-light)',
                                                    color: 'var(--primary)',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {index + 1}. {section}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={handleSaveTemplate} className="btn btn-primary btn-lg">
                                        <CheckCircle size={20} />
                                        Save Template & Continue
                                    </button>
                                    <button onClick={() => handleAnalyze()} className="btn btn-secondary">
                                        Re-analyze
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Skip Option */}
                <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <AlertCircle size={20} style={{ color: 'var(--info)' }} />
                    <div style={{ flex: 1 }}>
                        <h4 className="mb-1">Don't have a sample worksheet?</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            You can skip this step and use a default template. You can always upload a sample later.
                        </p>
                        <button onClick={handleSkipToGenerate} className="btn btn-outline">
                            <ArrowRight size={20} />
                            Skip & Generate Worksheet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadSample;
