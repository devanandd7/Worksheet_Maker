import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorksheet } from '../context/WorksheetContext';
import { toast } from 'react-toastify';
import {
    Download as DownloadIcon,
    Edit3,
    Loader,
    FileText,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import api from '../services/api';

const WorksheetPreview = () => {
    const { currentWorksheet, setCurrentWorksheet } = useWorksheet();
    const navigate = useNavigate();

    const [worksheet, setWorksheet] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [editedContent, setEditedContent] = useState({});
    const [saving, setSaving] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const [autoGenTriggered, setAutoGenTriggered] = useState(false);

    useEffect(() => {
        if (!currentWorksheet) {
            toast.error('No worksheet found. Please generate one first.');
            navigate('/generate');
            return;
        }
        setWorksheet(currentWorksheet);
        setEditedContent(currentWorksheet.content || {});
    }, [currentWorksheet, navigate]);

    // Auto-trigger PDF generation if missing
    useEffect(() => {
        if (worksheet && worksheet._id && !worksheet.pdfUrl && !generatingPDF && !autoGenTriggered) {
            console.log('Auto-triggering PDF generation for:', worksheet._id);
            setAutoGenTriggered(true);
            handleGeneratePDF();
        }
    }, [worksheet, generatingPDF, autoGenTriggered]);

    const handleEdit = (section) => {
        setEditMode({ ...editMode, [section]: true });
    };

    const handleSave = async (section) => {
        if (!worksheet) return;

        setSaving(true);
        try {
            const response = await api.updateWorksheet(worksheet._id, {
                content: {
                    ...worksheet.content,
                    [section]: editedContent[section]
                }
            });

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

    const handleGeneratePDF = async () => {
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
            const response = await api.generateWorksheetPDF(worksheet._id);
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
    };

    const handleRegenerateSection = async (section) => {
        if (!worksheet) return;

        try {
            const response = await api.regenerateSection(worksheet._id, {
                section,
                currentContent: worksheet.content[section],
                context: {
                    topic: worksheet.topic,
                    syllabus: worksheet.syllabus
                }
            });

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

    if (!worksheet) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader size={48} className="spinner" style={{ color: 'var(--primary)' }} />
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
        <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h1 className="mb-1">{worksheet.topic}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {worksheet.subject} • Version {worksheet.version}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {worksheet.pdfUrl ? (
                            <>
                                <a
                                    href={worksheet.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    download
                                >
                                    <DownloadIcon size={20} />
                                    Download PDF
                                </a>
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF}
                                    className="btn btn-secondary"
                                >
                                    <RefreshCw size={20} />
                                    Regenerate PDF
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleGeneratePDF}
                                disabled={generatingPDF}
                                className="btn btn-primary"
                            >
                                {generatingPDF ? (
                                    <>
                                        <Loader size={20} className="spinner" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon size={20} />
                                        Generate PDF
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sections */}
                {sections.map(({ key, label }) => (
                    worksheet.content[key] && (
                        <div key={key} className="card mb-3">
                            <div className="flex justify-between items-start mb-2">
                                <h3>{label}</h3>
                                <div className="flex gap-1">
                                    {!editMode[key] ? (
                                        <>
                                            <button
                                                onClick={() => handleEdit(key)}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                <Edit3 size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleRegenerateSection(key)}
                                                className="btn btn-outline btn-sm"
                                            >
                                                <RefreshCw size={16} />
                                                Regenerate
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleSave(key)}
                                                disabled={saving}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <CheckCircle size={16} />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => handleCancel(key)}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editMode[key] ? (
                                renderEditInput(key)
                            ) : (
                                renderViewContent(key)
                            )}
                        </div>
                    )
                ))}

                {/* Images Section */}
                {worksheet.images && worksheet.images.length > 0 && (
                    <div className="card mb-3">
                        <h3 className="mb-2">Attached Images</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {worksheet.images.map((img, idx) => (
                                <div key={idx} className="card" style={{ padding: '0.5rem' }}>
                                    <img
                                        src={img.url}
                                        alt={img.caption || `Image ${idx + 1}`}
                                        style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {img.section} - {img.caption}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="card" style={{ background: 'var(--bg-primary)' }}>
                    <div className="flex gap-2 justify-between">
                        <button onClick={() => navigate('/history')} className="btn btn-secondary">
                            <FileText size={20} />
                            View All Worksheets
                        </button>
                        {worksheet.pdfUrl ? (
                            <a
                                href={worksheet.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-lg"
                                download
                            >
                                <DownloadIcon size={20} />
                                Download PDF
                            </a>
                        ) : (
                            <button onClick={handleGeneratePDF} disabled={generatingPDF} className="btn btn-primary btn-lg">
                                {generatingPDF ? (
                                    <>
                                        <Loader size={20} className="spinner" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon size={20} />
                                        Generate PDF
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default WorksheetPreview;
