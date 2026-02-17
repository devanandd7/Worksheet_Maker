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

// Log queue stats periodically
setInterval(() => {
    if (worksheetQueue.size > 0 || worksheetQueue.pending > 0) {
        console.log(`📊 Worksheet Queue Stats: ${worksheetQueue.size} waiting, ${worksheetQueue.pending} active`);
    }
}, 60000); // Every 60 seconds

console.log('✅ Queue system initialized (p-queue)');
console.log('   - Worksheet Queue: 5 concurrent workers');
console.log('   - Image Queue: 5 concurrent workers');
