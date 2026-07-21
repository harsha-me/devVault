package com.devvault.backend.controller;

import com.devvault.backend.entity.DocumentHistory;
import com.devvault.backend.repository.DocumentHistoryRepository;
import com.devvault.backend.service.DocumentService;
import com.devvault.backend.service.StorageService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@CrossOrigin
public class DocumentToolkitController {

    private static final Logger logger = LoggerFactory.getLogger(DocumentToolkitController.class);

    @Autowired
    private DocumentService documentService;

    @Autowired
    private StorageService storageService;

    @Autowired
    private DocumentHistoryRepository historyRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. Images to PDF
    @PostMapping("/tools/image-to-pdf")
    public ResponseEntity<?> imageToPdf(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam(value = "pageSize", defaultValue = "a4") String pageSize,
            @RequestParam(value = "orientation", defaultValue = "portrait") String orientation,
            @RequestParam(value = "margin", defaultValue = "10") int margin,
            @RequestParam(value = "compress", defaultValue = "false") boolean compress,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Images to PDF";
        List<File> tempFiles = new ArrayList<>();
        String originalName = images.isEmpty() ? "images.pdf" : images.get(0).getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            originalName = originalName.substring(0, originalName.lastIndexOf(".")) + ".pdf";
        } else {
            originalName = "converted.pdf";
        }

        try {
            for (MultipartFile img : images) {
                tempFiles.add(storageService.saveTemporaryFile(img));
            }
            
            byte[] pdfBytes = documentService.imageToPdf(tempFiles, pageSize, orientation, margin, compress);
            String storagePath = storageService.saveOutputFile(pdfBytes, originalName);
            
            DocumentHistory history = saveHistory(email, opName, "multiple_images", originalName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during Images to PDF conversion", e);
            saveHistory(email, opName, "multiple_images", originalName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            for (File temp : tempFiles) {
                storageService.deleteTemporaryFile(temp);
            }
        }
    }

    // 2. Merge PDFs
    @PostMapping("/tools/pdf-merge")
    public ResponseEntity<?> pdfMerge(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Merge PDFs";
        List<File> tempFiles = new ArrayList<>();
        String outputName = "merged.pdf";

        try {
            for (MultipartFile file : files) {
                tempFiles.add(storageService.saveTemporaryFile(file));
            }
            
            byte[] pdfBytes = documentService.mergePdfs(tempFiles);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, files.size() + " files", outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF merging", e);
            saveHistory(email, opName, files.size() + " files", outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            for (File temp : tempFiles) {
                storageService.deleteTemporaryFile(temp);
            }
        }
    }

    // 3. Split PDF
    @PostMapping("/tools/split")
    public ResponseEntity<?> splitPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("splitType") String splitType,
            @RequestParam(value = "pageRange", defaultValue = "") String pageRange,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Split PDF";
        File tempFile = null;
        String outputName = "split_pages.zip";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] zipBytes = documentService.splitPdf(tempFile, splitType, pageRange);
            String storagePath = storageService.saveOutputFile(zipBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, file.getOriginalFilename(), outputName,
                    storagePath, (long) zipBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF splitting", e);
            saveHistory(email, opName, file.getOriginalFilename(), outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 4. PDF to Word
    @PostMapping("/tools/pdf-to-word")
    public ResponseEntity<?> pdfToWord(
            @RequestParam("file") MultipartFile file,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "PDF to Word";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + ".docx"
                : "converted.docx";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] docxBytes = documentService.pdfToWord(tempFile);
            String storagePath = storageService.saveOutputFile(docxBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) docxBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF to Word conversion", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 5. Word to PDF
    @PostMapping("/tools/word-to-pdf")
    public ResponseEntity<?> wordToPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Word to PDF";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + ".pdf"
                : "converted.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.wordToPdf(tempFile);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during Word to PDF conversion", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 6. PDF to Images
    @PostMapping("/tools/pdf-to-images")
    public ResponseEntity<?> pdfToImages(
            @RequestParam("file") MultipartFile file,
            @RequestParam("format") String format,
            @RequestParam("resolution") String resolution,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "PDF to Images";
        File tempFile = null;
        String outputName = "extracted_images.zip";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] zipBytes = documentService.pdfToImages(tempFile, format, resolution);
            String storagePath = storageService.saveOutputFile(zipBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, file.getOriginalFilename(), outputName,
                    storagePath, (long) zipBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF to Images extraction", e);
            saveHistory(email, opName, file.getOriginalFilename(), outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 7. Compress PDF
    @PostMapping("/tools/compress")
    public ResponseEntity<?> compress(
            @RequestParam("file") MultipartFile file,
            @RequestParam("level") String level,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Compress PDF";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_compressed.pdf"
                : "compressed.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.compressPdf(tempFile, level);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF compression", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 8. Protect PDF
    @PostMapping("/tools/protect")
    public ResponseEntity<?> protect(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userPassword") String userPassword,
            @RequestParam("ownerPassword") String ownerPassword,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Protect PDF";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_protected.pdf"
                : "protected.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.protectPdf(tempFile, userPassword, ownerPassword);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF protection", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 9. Unlock PDF
    @PostMapping("/tools/unlock")
    public ResponseEntity<?> unlock(
            @RequestParam("file") MultipartFile file,
            @RequestParam("password") String password,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Unlock PDF";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_unlocked.pdf"
                : "unlocked.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.unlockPdf(tempFile, password);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error during PDF unlocking", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 10. Add Watermark
    @PostMapping("/tools/watermark")
    public ResponseEntity<?> watermark(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "watermarkText", required = false) String watermarkText,
            @RequestParam(value = "watermarkImage", required = false) MultipartFile watermarkImage,
            @RequestParam(value = "opacity", defaultValue = "0.3") float opacity,
            @RequestParam(value = "rotation", defaultValue = "45") float rotation,
            @RequestParam(value = "position", defaultValue = "center") String position,
            @RequestParam(value = "fontSize", defaultValue = "48") int fontSize,
            @RequestParam(value = "colorHex", defaultValue = "#D3D3D3") String colorHex,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Add Watermark";
        File tempPdf = null;
        File tempImg = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_watermarked.pdf"
                : "watermarked.pdf";

        try {
            tempPdf = storageService.saveTemporaryFile(file);
            if (watermarkImage != null && !watermarkImage.isEmpty()) {
                tempImg = storageService.saveTemporaryFile(watermarkImage);
            }
            
            byte[] pdfBytes = documentService.addWatermark(tempPdf, watermarkText, tempImg, opacity, rotation, position, fontSize, colorHex);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error adding watermark to PDF", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempPdf);
            if (tempImg != null) {
                storageService.deleteTemporaryFile(tempImg);
            }
        }
    }

    // 11. Fill & Sign PDF
    @PostMapping("/tools/sign")
    public ResponseEntity<?> sign(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "signatureImage", required = false) MultipartFile signatureImage,
            @RequestParam(value = "typedSignature", required = false) String typedSignature,
            @RequestParam(value = "pageNum", defaultValue = "1") int pageNum,
            @RequestParam(value = "x", defaultValue = "100") float x,
            @RequestParam(value = "y", defaultValue = "100") float y,
            @RequestParam(value = "width", defaultValue = "150") float width,
            @RequestParam(value = "height", defaultValue = "60") float height,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "textFields", required = false) String textFieldsJson,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Fill & Sign PDF";
        File tempPdf = null;
        File tempImg = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_signed.pdf"
                : "signed.pdf";

        try {
            tempPdf = storageService.saveTemporaryFile(file);
            if (signatureImage != null && !signatureImage.isEmpty()) {
                tempImg = storageService.saveTemporaryFile(signatureImage);
            }
            
            List<Map<String, Object>> textFields = null;
            if (textFieldsJson != null && !textFieldsJson.trim().isEmpty()) {
                textFields = objectMapper.readValue(textFieldsJson, new TypeReference<List<Map<String, Object>>>() {});
            }
            
            byte[] pdfBytes = documentService.fillAndSign(tempPdf, tempImg, typedSignature, pageNum, x, y, width, height, date, textFields);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error signing PDF", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempPdf);
            if (tempImg != null) {
                storageService.deleteTemporaryFile(tempImg);
            }
        }
    }

    // 12. Page Numbering
    @PostMapping("/tools/page-numbering")
    public ResponseEntity<?> pageNumbering(
            @RequestParam("file") MultipartFile file,
            @RequestParam("position") String position,
            @RequestParam("fontName") String fontName,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Page Numbering";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_numbered.pdf"
                : "numbered.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.addPageNumbers(tempFile, position, fontName);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error numbering PDF pages", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 13. Rotate PDF Pages
    @PostMapping("/tools/rotate")
    public ResponseEntity<?> rotate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("angle") int angle,
            @RequestParam(value = "pageRange", defaultValue = "all") String pageRange,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Rotate PDF Pages";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_rotated.pdf"
                : "rotated.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.rotatePdfPages(tempFile, angle, pageRange);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error rotating PDF pages", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 14. Remove Pages
    @PostMapping("/tools/remove-pages")
    public ResponseEntity<?> removePages(
            @RequestParam("file") MultipartFile file,
            @RequestParam("pageRange") String pageRange,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "Remove Pages";
        File tempFile = null;
        String originalName = file.getOriginalFilename();
        String outputName = originalName != null && originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf(".")) + "_pruned.pdf"
                : "pruned.pdf";

        try {
            tempFile = storageService.saveTemporaryFile(file);
            byte[] pdfBytes = documentService.removePdfPages(tempFile, pageRange);
            String storagePath = storageService.saveOutputFile(pdfBytes, outputName);
            
            DocumentHistory history = saveHistory(email, opName, originalName, outputName,
                    storagePath, (long) pdfBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error removing pages from PDF", e);
            saveHistory(email, opName, originalName, outputName,
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // 15. OCR (Optional Premium Feature)
    @PostMapping("/tools/ocr")
    public ResponseEntity<?> ocr(
            @RequestParam("file") MultipartFile file,
            @RequestParam("email") String email) {

        long startTime = System.currentTimeMillis();
        String opName = "OCR Text Extraction";
        File tempFile = null;

        try {
            tempFile = storageService.saveTemporaryFile(file);
            String extractedText = documentService.performOcr(tempFile);
            
            // For OCR, output name is "extracted_text.txt", and we save the text bytes
            byte[] textBytes = extractedText.getBytes("UTF-8");
            String storagePath = storageService.saveOutputFile(textBytes, "extracted_text.txt");
            
            DocumentHistory history = saveHistory(email, opName, file.getOriginalFilename(), "extracted_text.txt",
                    storagePath, (long) textBytes.length, System.currentTimeMillis() - startTime, "SUCCESS");
            
            Map<String, Object> response = new HashMap<>();
            response.put("history", history);
            response.put("text", extractedText);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error performing OCR", e);
            saveHistory(email, opName, file.getOriginalFilename(), "extracted_text.txt",
                    "N/A", 0L, System.currentTimeMillis() - startTime, "FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        } finally {
            storageService.deleteTemporaryFile(tempFile);
        }
    }

    // Get Conversion History
    @GetMapping("/tools/history/{email}")
    public ResponseEntity<?> getHistory(@PathVariable String email) {
        logger.info("Fetching history for email: {}", email);
        try {
            List<DocumentHistory> histories = historyRepository.findByEmailOrderByIdDesc(email);
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            logger.error("Error fetching history", e);
            return ResponseEntity.status(500).body("Error fetching history: " + e.getMessage());
        }
    }

    // Delete History Entry
    @DeleteMapping("/tools/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        logger.info("Deleting history entry: {}", id);
        try {
            Optional<DocumentHistory> opt = historyRepository.findById(id);
            if (opt.isPresent()) {
                DocumentHistory hist = opt.get();
                if (hist.getStoragePath() != null && !"N/A".equals(hist.getStoragePath())) {
                    storageService.deleteOutputFile(hist.getStoragePath());
                }
                historyRepository.deleteById(id);
                return ResponseEntity.ok("Deleted successfully");
            }
            return ResponseEntity.status(404).body("History not found");
        } catch (Exception e) {
            logger.error("Error deleting history entry", e);
            return ResponseEntity.status(500).body("Error deleting history entry: " + e.getMessage());
        }
    }

    // Download Again (Streams file back)
    @GetMapping("/tools/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        logger.info("Downloading file for history id: {}", id);
        try {
            Optional<DocumentHistory> opt = historyRepository.findById(id);
            if (opt.isPresent()) {
                DocumentHistory hist = opt.get();
                byte[] bytes = storageService.loadOutputFile(hist.getStoragePath());
                
                String filename = hist.getOutputFileName() != null ? hist.getOutputFileName() : "downloaded_file";
                String contentType = "application/octet-stream";
                if (filename.toLowerCase().endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (filename.toLowerCase().endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else if (filename.toLowerCase().endsWith(".zip")) {
                    contentType = "application/zip";
                } else if (filename.toLowerCase().endsWith(".txt")) {
                    contentType = "text/plain";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .body(bytes);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error downloading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get Stats for Dashboard Integration
    @GetMapping("/tools/stats/{email}")
    public ResponseEntity<?> getStats(@PathVariable String email) {
        logger.info("Computing toolkit stats for: {}", email);
        try {
            List<DocumentHistory> histories = historyRepository.findByEmailOrderByIdDesc(email);
            
            long totalConversions = 0;
            long storageUsed = 0;
            long convertedToday = 0;
            LocalDate today = LocalDate.now();
            
            Map<String, Integer> toolCounts = new HashMap<>();
            List<DocumentHistory> recentActivity = new ArrayList<>();
            
            for (DocumentHistory h : histories) {
                if ("SUCCESS".equalsIgnoreCase(h.getStatus())) {
                    totalConversions++;
                    storageUsed += h.getFileSize();
                    
                    if (today.equals(h.getDate())) {
                        convertedToday++;
                    }
                    
                    toolCounts.put(h.getOperation(), toolCounts.getOrDefault(h.getOperation(), 0) + 1);
                    
                    if (recentActivity.size() < 5) {
                        recentActivity.add(h);
                    }
                }
            }
            
            String mostUsedTool = "None";
            int maxCount = 0;
            for (Map.Entry<String, Integer> entry : toolCounts.entrySet()) {
                if (entry.getValue() > maxCount) {
                    maxCount = entry.getValue();
                    mostUsedTool = entry.getKey();
                }
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalConversions", totalConversions);
            stats.put("storageUsed", storageUsed);
            stats.put("convertedToday", convertedToday);
            stats.put("mostUsedTool", mostUsedTool);
            stats.put("favoriteTool", mostUsedTool);
            stats.put("recentActivity", recentActivity);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error computing stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    /* ── Helper saveHistory method ── */
    private DocumentHistory saveHistory(String email, String operation, String inputName, String outputName,
                                        String storagePath, Long size, Long procTime, String status) {
        DocumentHistory hist = new DocumentHistory();
        hist.setEmail(email);
        hist.setOperation(operation);
        hist.setInputFileName(inputName);
        hist.setOutputFileName(outputName);
        hist.setStoragePath(storagePath);
        hist.setFileSize(size);
        hist.setProcessingTimeMs(procTime);
        hist.setStatus(status);
        hist.setDate(LocalDate.now());
        hist.setTime(LocalTime.now());
        return historyRepository.save(hist);
    }
}
