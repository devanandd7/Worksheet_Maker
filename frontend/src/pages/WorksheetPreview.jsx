import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorksheet } from '../context/WorksheetContext';
import { toast } from 'react-toastify';
import {
    Download as DownloadIcon,
    Edit3,
    Loader,
    FileText,
    CheckCircle,
    RefreshCw,
    ArrowLeft,
    Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './WorksheetPreview.css';

const WorksheetPreview = () => {
    const { id } = useParams();
    const { currentWorksheet, setCurrentWorksheet } = useWorksheet();
    const { getToken } = useAuth(); // Get auth token
    const navigate = useNavigate();

    const [worksheet, setWorksheet] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [editedContent, setEditedContent] = useState({});
    const [saving, setSaving] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [loading, setLoading] = useState(true);

    const [autoGenTriggered, setAutoGenTriggered] = useState(false);

    useEffect(() => {
        const loadWorksheet = async () => {
            // Case 1: Worksheet is already in context and matches URL ID
            if (currentWorksheet && currentWorksheet._id === id) {
                setWorksheet(currentWorksheet);
                setEditedContent(currentWorksheet.content || {});
                setLoading(false);
                return;
            }

            // Case 2: Fetch from API (Refresh or direct link)
            try {
                setLoading(true);
                const token = await getToken();
                const response = await api.getWorksheetById(id, token);
                const fetchedWorksheet = response.data.worksheet;

                setWorksheet(fetchedWorksheet);
                setCurrentWorksheet(fetchedWorksheet); // Update context
                setEditedContent(fetchedWorksheet.content || {});
            } catch (error) {
                console.error('Failed to load worksheet:', error);
                toast.error('Failed to load worksheet. Redirecting...');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        loadWorksheet();
    }, [id, currentWorksheet, navigate, setCurrentWorksheet, getToken]);



    const handleEdit = (section) => {
        setEditMode({ ...editMode, [section]: true });
    };

    const handleSave = async (section) => {
        if (!worksheet) return;

        setSaving(true);
        try {
            const token = await getToken();
            const response = await api.updateWorksheet(worksheet._id, {
                content: {
                    ...worksheet.content,
                    [section]: editedContent[section]
                }
            }, token);

            setWorksheet(response.data.worksheet);
            setCurrentWorksheet(response.data.worksheet);
            setEditMode({ ...editMode, [section]: false });
            toast.success('Section updated successfully!');
        } catch (error) {
            toast.error('Failed to save changes');
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = (section) => {
        setEditedContent({
            ...editedContent,
            [section]: worksheet.content[section]
        });
        setEditMode({ ...editMode, [section]: false });
    };

    const handleContentChange = (section, value) => {
        setEditedContent({
            ...editedContent,
            [section]: value
        });
    };

    const handleGeneratePDF = useCallback(async () => {
        console.log('Generate PDF clicked. Worksheet:', worksheet);
        if (!worksheet) {
            console.error('No worksheet found in state');
            return;
        }
        if (!worksheet._id) {
            console.error('Worksheet has no ID:', worksheet);
            toast.error('Error: Invalid worksheet data');
            return;
        }

        setGeneratingPDF(true);
        try {
            console.log('Sending PDF generate request for ID:', worksheet._id);
            const token = await getToken();
            const response = await api.generateWorksheetPDF(worksheet._id, token);
            console.log('PDF Generated Response:', response.data);

            // Backend returns: { success: true, message: '...', pdfUrl: '...', pdfBase64: '...' }
            const { pdfUrl, pdfBase64 } = response.data;

            if (pdfUrl) {
                // Update local state with new PDF URL
                const updatedWorksheet = { ...worksheet, pdfUrl };
                setWorksheet(updatedWorksheet);
                setCurrentWorksheet(updatedWorksheet);
                toast.success('PDF generated successfully!');

                // Auto-download logic
                try {
                    toast.info('Downloading PDF...');
                    let blob;

                    if (pdfBase64) {
                        // Use direct base64 data
                        const byteCharacters = atob(pdfBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        blob = new Blob([byteArray], { type: 'application/pdf' });
                    } else {
                        // Fallback to fetch
                        const pdfResponse = await fetch(pdfUrl);
                        if (!pdfResponse.ok) throw new Error(`Network response was not ok: ${pdfResponse.status}`);
                        const contentType = pdfResponse.headers.get('content-type');
                        if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
                            throw new Error('Server returned invalid file type');
                        }
                        blob = await pdfResponse.blob();
                    }

                    if (blob.size < 100) throw new Error('File empty');

                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Worksheet_${worksheet.topic.replace(/\s+/g, '_')}.pdf`);
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success('Download started!');
                } catch (err) {
                    console.error('Auto-download failed, falling back to direct link:', err);
                    window.open(pdfUrl, '_blank');
                    toast.warning('Auto-download failed. Opening PDF in new tab.');
                }
            } else {
                console.error('PDF URL missing in response:', response.data);
                toast.warning('PDF generated but URL is missing.');
            }
        } catch (error) {
            toast.error('Failed to generate PDF');
            console.error('PDF generation error:', error);
        } finally {
            setGeneratingPDF(false);
        }
    }, [worksheet, setCurrentWorksheet, navigate, getToken]);

    // REMOVED AUTO-PDF GENERATION: User should explicitly choose when to generate PDF
    // This respects the user's export format selection (DOCX vs PDF)
    // Previously, this would auto-generate PDF even when user only wanted DOCX
    /*
    useEffect(() => {
        if (!loading && worksheet && worksheet._id && !worksheet.pdfUrl && !generatingPDF && !autoGenTriggered) {
            console.log('Auto-triggering PDF generation for:', worksheet._id);
            setAutoGenTriggered(true);
            handleGeneratePDF();
        }
    }, [worksheet, generatingPDF, autoGenTriggered, loading, handleGeneratePDF]);
    */

    const handleRegenerateSection = async (section) => {
        if (!worksheet) return;

        try {
            const token = await getToken();
            const response = await api.regenerateSection(worksheet._id, {
                section,
                currentContent: worksheet.content[section],
                context: {
                    topic: worksheet.topic,
                    syllabus: worksheet.syllabus
                }
            }, token);

            const updatedContent = {
                ...worksheet.content,
                [section]: response.data.content
            };

            setWorksheet({ ...worksheet, content: updatedContent });
            setEditedContent(updatedContent);
            toast.success(`${section} regenerated!`);
        } catch (error) {
            toast.error('Failed to regenerate section');
            console.error('Regenerate error:', error);
        }
    };

    if (loading || !worksheet) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader size={48} className="spinner text-primary" />
            </div>
        );
    }

    const sections = [
        { key: 'questionTitle', label: 'Main Question' },
        { key: 'aim', label: 'Aim' },
        { key: 'problemStatement', label: 'Problem Statement' },
        { key: 'dataset', label: 'Dataset Description' },
        { key: 'algorithm', label: 'Algorithm' },
        { key: 'code', label: 'Code Implementation' },
        { key: 'output', label: 'Output & Results' },
        { key: 'conclusion', label: 'Conclusion' }
    ];

    const renderEditInput = (key) => {
        const content = editedContent[key];

        // Special handling for Code object
        if (key === 'code' && typeof content === 'object' && content !== null) {
            return (
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-sm font-bold text-gray-500">Source Code ({content.language || 'text'})</label>
                        <textarea
                            className="input-field"
                            rows={15}
                            value={content.source || ''}
                            onChange={(e) => handleContentChange(key, { ...content, source: e.target.value })}
                            style={{ fontFamily: 'monospace' }}
                            placeholder="Paste your code here..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500">Explanation (HTML Supported)</label>
                        <textarea
                            className="input-field"
                            rows={5}
                            value={content.explanation || ''}
                            onChange={(e) => handleContentChange(key, { ...content, explanation: e.target.value })}
                            placeholder="Explain the logic..."
                        />
                    </div>
                </div>
            );
        }

        // Default string handling
        return (
            <textarea
                className="input-field"
                rows={key === 'code' ? 15 : 6}
                value={typeof content === 'object' ? JSON.stringify(content, null, 2) : content || ''}
                onChange={(e) => handleContentChange(key, e.target.value)}
                style={{ fontFamily: key === 'code' ? 'monospace' : 'inherit' }}
            />
        );
    };

    const renderViewContent = (key) => {
        const content = worksheet.content[key];

        // Special handling for Code object
        if (key === 'code' && typeof content === 'object' && content !== null) {
            return (
                <div>
                    {content.source && (
                        <div className="mb-3">
                            <div className="text-xs text-gray-500 font-bold mb-1 uppercase">{content.language || 'Code'}</div>
                            <pre style={{
                                background: '#f4f4f4',
                                padding: '1rem',
                                borderRadius: '4px',
                                overflowX: 'auto',
                                fontFamily: 'monospace',
                                border: '1px solid #ddd'
                            }}>
                                {content.source}
                            </pre>
                        </div>
                    )}
                    {content.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded">
                            <h4 className="text-sm font-bold mb-2">Explanation:</h4>
                            <div dangerouslySetInnerHTML={{ __html: content.explanation }} />
                        </div>
                    )}
                </div>
            );
        }

        // Default string handling (Source code string or HTML string for other sections)
        if (['questionTitle', 'aim', 'problemStatement', 'output', 'conclusion'].includes(key)) {
            // Treat these as HTML safe
            return <div dangerouslySetInnerHTML={{ __html: typeof content === 'string' ? content : '' }} />;
        }

        return (
            <div style={{ whiteSpace: 'pre-wrap', fontFamily: key === 'code' ? 'monospace' : 'inherit' }}>
                {typeof content === 'string' ? content : JSON.stringify(content)}
            </div>
        );
    };
    return (
        <div className="worksheet-preview-container fade-in">
            {/* Header / Nav */}
            <div className="preview-header">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary btn-sm rounded-full w-10 h-10 p-0 flex items-center justify-center"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-outfit text-primary">{worksheet.topic}</h1>
                        <p className="text-sm text-secondary">
                            {worksheet.subject} • {worksheet.difficulty} • Version {worksheet.version}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            {/* Main Worksheet Paper */}
            <div className="worksheet-paper">
                {/* Header Image if exists */}
                {worksheet.headerImageUrl && (
                    <div className="mb-6 text-center border-b border-gray-200 pb-4">
                        <img
                            src={worksheet.headerImageUrl}
                            alt="University Header"
                            style={{ maxHeight: '100px', objectFit: 'contain' }}
                        />
                    </div>
                )}

                <h1 className="worksheet-title">{worksheet.topic}</h1>

                {sections.map(({ key, label }) => (
                    worksheet.content[key] && (
                        <div key={key} className="section-block">
                            <div className="flex justify-between items-end mb-2 border-b border-gray-200 pb-1">
                                <h3 className="section-title">{label}</h3>
                                <div className="no-print">
                                    {!editMode[key] ? (
                                        <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(key)}
                                                className="text-primary hover:text-primary-dark p-1"
                                                title="Edit Section"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleRegenerateSection(key)}
                                                className="text-secondary hover:text-secondary-dark p-1"
                                                title="Regenerate Section"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(key)} className="text-success font-bold text-xs uppercase">Save</button>
                                            <button onClick={() => handleCancel(key)} className="text-error font-bold text-xs uppercase">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {editMode[key] ? (
                                renderEditInput(key)
                            ) : (
                                <div className="section-content">
                                    {renderViewContent(key)}
                                </div>
                            )}
                        </div>
                    )
                ))}

                {/* Images Section in Paper */}
                {worksheet.images && worksheet.images.length > 0 && (
                    <div className="section-block mt-8 break-before-page">
                        <h3 className="section-title">Attached Figures</h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {worksheet.images.map((img, idx) => (
                                <div key={idx} className="border border-gray-200 p-2 rounded text-center">
                                    <img
                                        src={img.url}
                                        alt={img.caption}
                                        className="max-w-full h-auto max-h-60 mx-auto"
                                    />
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                        Figure {idx + 1}: {img.caption}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Action Bar */}
            <div className="action-bar">
                <button onClick={() => navigate('/history')} className="btn btn-secondary rounded-full">
                    <FileText size={18} />
                    History
                </button>

                {/* PDF Logic DISABLED - Replacing with DOCX Action */}
                {/* 
                {worksheet.pdfUrl ? (
                    <>
                        <a
                            href={worksheet.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary rounded-full shadow-lg"
                            download
                        >
                            <DownloadIcon size={18} />
                            Download PDF
                        </a>
                        <button
                            onClick={handleGeneratePDF}
                            disabled={generatingPDF}
                            className="btn btn-secondary rounded-full"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                        className="btn btn-primary rounded-full shadow-lg px-6"
                    >
                        {generatingPDF ? <Loader size={18} className="spinner" /> : <DownloadIcon size={18} />}
                        {generatingPDF ? ' Generating...' : ' Generate Final PDF'}
                    </button>
                )} 
                */}

                {/* New DOCX-Only Action */}
                <button
                    onClick={async () => {
                        try {
                            toast.info('Preparing download...');
                            const token = await getToken();
                            const response = await api.downloadWorksheetDocx(worksheet._id, token);

                            // Create blob and download
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            const fileName = `${worksheet.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_worksheet.docx`;
                            link.setAttribute('download', fileName);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                            toast.success('Download started!');
                        } catch (err) {
                            console.error('Download failed', err);
                            toast.error('Failed to download DOCX');
                        }
                    }}
                    className="btn btn-primary rounded-full shadow-lg px-6"
                    style={{ backgroundColor: '#2b579a', borderColor: '#2b579a' }} // Word Blue
                >
                    <FileText size={18} />
                    Download DOCX
                </button>
            </div>
        </div>

    );
};

export default WorksheetPreview;
