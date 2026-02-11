import PQueue from 'p-queue';

/**
 * Worksheet Generation Queue
 * Handles AI-powered worksheet generation with 5 concurrent workers
 */
export const worksheetQueue = new PQueue({
    concurrency: 5,
    timeout: 60000, // 60 seconds timeout per job
    throwOnTimeout: true
});

/**
 * PDF Generation Queue  
 * Handles Puppeteer PDF generation with 3 concurrent workers
 * Lower concurrency to manage memory usage
 */
export const pdfQueue = new PQueue({
    concurrency: 3,
    timeout: 45000, // 45 seconds timeout per job
    throwOnTimeout: true
});

/**
 * Image Processing Queue
 * Handles image uploads and processing with 5 concurrent workers
 */
export const imageQueue = new PQueue({
    concurrency: 5,
    timeout: 30000 // 30 seconds timeout per job
});

// Event listeners for monitoring
worksheetQueue.on('active', () => {
    console.log(`📝 Worksheet queue: ${worksheetQueue.size} waiting, ${worksheetQueue.pending} processing`);
});

pdfQueue.on('active', () => {
    console.log(`📄 PDF queue: ${pdfQueue.size} waiting, ${pdfQueue.pending} processing`);
});

// Log queue stats periodically
setInterval(() => {
    if (worksheetQueue.size > 0 || worksheetQueue.pending > 0) {
        console.log(`📊 Worksheet Queue Stats: ${worksheetQueue.size} waiting, ${worksheetQueue.pending} active`);
    }
    if (pdfQueue.size > 0 || pdfQueue.pending > 0) {
        console.log(`📊 PDF Queue Stats: ${pdfQueue.size} waiting, ${pdfQueue.pending} active`);
    }
}, 60000); // Every 60 seconds

console.log('✅ Queue system initialized (p-queue)');
console.log('   - Worksheet Queue: 5 concurrent workers');
console.log('   - PDF Queue: 3 concurrent workers');
console.log('   - Image Queue: 5 concurrent workers');
