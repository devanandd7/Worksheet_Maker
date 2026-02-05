import React, { createContext, useState, useContext } from 'react';

const WorksheetContext = createContext(null);

export const WorksheetProvider = ({ children }) => {
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [currentWorksheet, setCurrentWorksheet] = useState(null);
    const [uploadedPDF, setUploadedPDF] = useState(null);
    const [analyzedStructure, setAnalyzedStructure] = useState(null);

    const resetWorkflow = () => {
        setCurrentTemplate(null);
        setCurrentWorksheet(null);
        setUploadedPDF(null);
        setAnalyzedStructure(null);
    };

    return (
        <WorksheetContext.Provider value={{
            currentTemplate,
            setCurrentTemplate,
            currentWorksheet,
            setCurrentWorksheet,
            uploadedPDF,
            setUploadedPDF,
            analyzedStructure,
            setAnalyzedStructure,
            resetWorkflow
        }}>
            {children}
        </WorksheetContext.Provider>
    );
};

export const useWorksheet = () => {
    const context = useContext(WorksheetContext);
    if (!context) {
        throw new Error('useWorksheet must be used within WorksheetProvider');
    }
    return context;
};
