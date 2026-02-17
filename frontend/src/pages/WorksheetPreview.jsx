import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorksheet } from '../context/WorksheetContext';
import { toast } from 'react-toastify';
import {
    Edit3,
    Loader,
    FileText,
    ArrowLeft,
    Printer,
    Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './WorksheetPreview.css';

const WorksheetPreview = () => {
    const { id } = useParams();
    const { currentWorksheet, setCurrentWorksheet } = useWorksheet();
    const { getToken, user } = useAuth();
    const navigate = useNavigate();

    const [worksheet, setWorksheet] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [editedContent, setEditedContent] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorksheet = async () => {
            if (currentWorksheet && currentWorksheet._id === id) {
                setWorksheet(currentWorksheet);
                setEditedContent(currentWorksheet.content || {});
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const token = await getToken();
                const response = await api.getWorksheetById(id, token);
                const fetchedWorksheet = response.data.worksheet;

                setWorksheet(fetchedWorksheet);
                setCurrentWorksheet(fetchedWorksheet);
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
                                fontFamily: "'Courier New', monospace",
                                fontSize: '0.85rem',
                                border: '1px solid #ddd',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {content.source}
                            </pre>
                        </div>
                    )}
                    {content.explanation && (
                        <div className="mt-3 p-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                            <h4 className="text-sm font-bold mb-2">Explanation:</h4>
                            <div dangerouslySetInnerHTML={{ __html: content.explanation }} />
                        </div>
                    )}
                </div>
            );
        }

        return <div dangerouslySetInnerHTML={{ __html: typeof content === 'string' ? content : JSON.stringify(content) }} />;
    };

    // Helper to get images for a section
    const getSectionImages = (sectionLabel, sectionKey) => {
        if (!worksheet.images) return [];
        return worksheet.images.filter(img =>
            img.section === sectionLabel ||
            img.section?.toLowerCase() === sectionKey?.toLowerCase() ||
            (sectionLabel === 'Output' && !img.section)
        );
    };

    // Get images that don't match any standard section
    const getOrphanImages = () => {
        if (!worksheet.images) return [];
        const sectionLabels = sections.map(s => s.label);
        const sectionKeys = sections.map(s => s.key.toLowerCase());
        return worksheet.images.filter(img => {
            const s = img.section || '';
            return !sectionLabels.includes(s) && !sectionKeys.includes(s.toLowerCase()) && s !== 'Output';
        });
    };

    // Learning Outcomes data
    const learningOutcomes = worksheet.content?.learningOutcome || [];

    return (
        <div className="worksheet-preview-container fade-in">
            {/* Navigation Header - Hidden in Print */}
            <div className="preview-header no-print">
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
                            {worksheet.subject} • {worksheet.difficulty}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                        <Printer size={16} /> Print View
                    </button>
                </div>
            </div>

            {/* Print-Only Recurring Header */}
            {worksheet.headerImageUrl && (
                <div className="print-header-fixed">
                    <img
                        src={worksheet.headerImageUrl}
                        alt="University Header"
                        style={{ maxHeight: '80px', width: '100%', objectFit: 'contain' }}
                    />
                </div>
            )}

            {/* ============ MAIN WORKSHEET PAPER ============ */}
            <div className="worksheet-paper">

                {/* 1. Header Image - FULL WIDTH */}
                {worksheet.headerImageUrl && (
                    <div className="header-image-wrapper no-print">
                        <img
                            src={worksheet.headerImageUrl}
                            alt="University Header"
                        />
                    </div>
                )}

                {/* 2. Worksheet Number */}
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold uppercase tracking-wide">
                        Worksheet No - {worksheet.experimentNumber || ''}
                    </h2>
                </div>

                {/* 3. Student Details - Responsive Table */}
                {user && (
                    <table className="student-details-table">
                        <tbody>
                            <tr>
                                <td style={{ width: '50%' }}>
                                    <div className="detail-row">
                                        <span className="detail-label">Student Name:</span>
                                        <span className="detail-value">{user.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Branch:</span>
                                        <span className="detail-value">{user.branch || user.course}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Semester:</span>
                                        <span className="detail-value">{user.semester}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Subject Name:</span>
                                        <span className="detail-value">{worksheet.subject || user.defaultSubject}</span>
                                    </div>
                                </td>
                                <td style={{ width: '50%' }}>
                                    <div className="detail-row">
                                        <span className="detail-label">UID:</span>
                                        <span className="detail-value">{user.uid}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Section/Group:</span>
                                        <span className="detail-value">{user.section}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">
                                            {worksheet.dateOfPerformance
                                                ? new Date(worksheet.dateOfPerformance).toLocaleDateString()
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Subject Code:</span>
                                        <span className="detail-value">{worksheet.subjectCode || ''}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* 4. Worksheet Content Sections */}
                {sections.map(({ key, label }) => {
                    const content = worksheet.content[key];
                    if (!content) return null;

                    const isMainQuestion = key === 'questionTitle' || key === 'aim';

                    return (
                        <div key={key} className={`section-block page-break-avoid`}>
                            <div className="flex justify-between items-end mb-1" style={{ borderBottom: '1px solid #888', paddingBottom: '2px' }}>
                                <h3 className="section-title" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>{label}</h3>
                                <div className="no-print">
                                    {!editMode[key] ? (
                                        <button
                                            onClick={() => handleEdit(key)}
                                            className="text-gray-400 hover:text-primary p-1 transition-colors"
                                            title="Edit Section"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSave(key)} className="text-green-600 font-bold text-xs uppercase hover:underline">Save</button>
                                            <button onClick={() => handleCancel(key)} className="text-red-500 font-bold text-xs uppercase hover:underline">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {editMode[key] ? (
                                renderEditInput(key)
                            ) : (
                                <div className={`section-content ${isMainQuestion ? 'section-content-large' : ''}`}>
                                    {renderViewContent(key)}
                                </div>
                            )}

                            {/* Images for this section */}
                            {getSectionImages(label, key).length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 page-break-avoid">
                                    {getSectionImages(label, key).map((img, idx) => (
                                        <div key={idx} style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
                                            <img
                                                src={img.url}
                                                alt={img.caption}
                                                style={{ maxWidth: '100%', height: 'auto', maxHeight: '240px', margin: '0 auto', objectFit: 'contain' }}
                                            />
                                            <p style={{ fontSize: '10pt', color: '#555', marginTop: '4px', fontStyle: 'italic', fontFamily: "'Times New Roman', serif" }}>
                                                {img.caption}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 5. Learning Outcomes (ALWAYS at the end) */}
                {learningOutcomes.length > 0 && (
                    <div className="learning-outcomes-section section-block page-break-avoid">
                        <h3 className="section-title">Learning Outcomes</h3>
                        <ul className="learning-outcomes-list">
                            {learningOutcomes.map((outcome, idx) => (
                                <li key={idx} dangerouslySetInnerHTML={{ __html: outcome }} />
                            ))}
                        </ul>
                    </div>
                )}

                {/* 6. Orphan Images (if any remaining) */}
                {getOrphanImages().length > 0 && (
                    <div className="section-block mt-8 break-before-page">
                        <h3 className="section-title">Additional Figures</h3>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            {getOrphanImages().map((img, idx) => (
                                <div key={idx} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }} className="page-break-avoid">
                                    <img
                                        src={img.url}
                                        alt={img.caption}
                                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '240px', margin: '0 auto', objectFit: 'contain' }}
                                    />
                                    <p style={{ fontSize: '10pt', color: '#555', marginTop: '4px', fontStyle: 'italic' }}>
                                        Figure {idx + 1}: {img.caption}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Action Bar - Hidden in Print */}
            <div className="action-bar no-print">
                <button onClick={() => navigate('/history')} className="btn btn-secondary rounded-full">
                    <FileText size={18} />
                    History
                </button>

                <button
                    onClick={() => window.print()}
                    className="btn btn-primary rounded-full shadow-lg px-8 flex items-center gap-2"
                >
                    <Printer size={18} />
                    Print / Save as PDF
                </button>
            </div>
        </div>
    );
};

export default WorksheetPreview;
