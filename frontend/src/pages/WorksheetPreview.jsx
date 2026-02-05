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

    useEffect(() => {
        if (!currentWorksheet) {
            toast.error('No worksheet found. Please generate one first.');
            navigate('/generate');
            return;
        }
        setWorksheet(currentWorksheet);
        setEditedContent(currentWorksheet.content || {});
    }, [currentWorksheet, navigate]);

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
        if (!worksheet) return;

        setGeneratingPDF(true);
        try {
            const response = await api.generateWorksheetPDF(worksheet._id);

            setWorksheet(response.data.worksheet);
            setCurrentWorksheet(response.data.worksheet);
            toast.success('PDF generated successfully!');

            // Auto-download
            if (response.data.worksheet.pdfUrl) {
                window.open(response.data.worksheet.pdfUrl, '_blank');
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
        { key: 'aim', label: 'Aim' },
        { key: 'problemStatement', label: 'Problem Statement' },
        { key: 'dataset', label: 'Dataset Description' },
        { key: 'algorithm', label: 'Algorithm' },
        { key: 'code', label: 'Code Implementation' },
        { key: 'output', label: 'Output & Results' },
        { key: 'conclusion', label: 'Conclusion' }
    ];

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
                                <textarea
                                    className="input-field"
                                    rows={key === 'code' ? 15 : 6}
                                    value={editedContent[key] || ''}
                                    onChange={(e) => handleContentChange(key, e.target.value)}
                                    style={{ fontFamily: key === 'code' ? 'monospace' : 'inherit' }}
                                />
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: key === 'code' ? 'monospace' : 'inherit' }}>
                                    {worksheet.content[key]}
                                </div>
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
        </div>
    );
};

export default WorksheetPreview;
