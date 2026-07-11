// The pdfjs worker bundle is imported only for its side effect (registering
// globalThis.pdfjsWorker so pdfjs runs in-thread). It ships no types.
declare module "pdfjs-dist/build/pdf.worker.min.mjs";
