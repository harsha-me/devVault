package com.devvault.backend.service;

import com.devvault.backend.entity.DocumentHistory;
import com.devvault.backend.repository.DocumentHistoryRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.multipdf.Splitter;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private AiService aiService;

    // 1. Images to PDF
    public byte[] imageToPdf(List<File> imageFiles, String pageSizeName, String orientation, int marginMm, boolean compress) throws Exception {
        logger.info("Converting {} images to PDF. Size: {}, Orientation: {}, Margin: {}mm, Compress: {}",
                imageFiles.size(), pageSizeName, orientation, marginMm, compress);
        
        try (PDDocument doc = new PDDocument()) {
            PDRectangle rectangle = PDRectangle.A4;
            if ("letter".equalsIgnoreCase(pageSizeName)) {
                rectangle = PDRectangle.LETTER;
            } else if ("legal".equalsIgnoreCase(pageSizeName)) {
                rectangle = PDRectangle.LEGAL;
            }
            
            float width = rectangle.getWidth();
            float height = rectangle.getHeight();
            if ("landscape".equalsIgnoreCase(orientation)) {
                width = rectangle.getHeight();
                height = rectangle.getWidth();
            }
            
            float marginPoints = marginMm * 2.8346f;
            float availableWidth = width - 2 * marginPoints;
            float availableHeight = height - 2 * marginPoints;
            
            for (File imgFile : imageFiles) {
                PDPage page = new PDPage(new PDRectangle(width, height));
                doc.addPage(page);
                
                BufferedImage bi = ImageIO.read(imgFile);
                if (bi == null) {
                    logger.warn("Skipping unreadable image file: {}", imgFile.getName());
                    continue;
                }
                
                PDImageXObject pdImage;
                if (compress) {
                    ByteArrayOutputStream compressedOut = new ByteArrayOutputStream();
                    Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
                    if (writers.hasNext()) {
                        ImageWriter writer = writers.next();
                        try (ImageOutputStream ios = ImageIO.createImageOutputStream(compressedOut)) {
                            writer.setOutput(ios);
                            ImageWriteParam param = writer.getDefaultWriteParam();
                            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                            param.setCompressionQuality(0.6f);
                            writer.write(null, new IIOImage(bi, null, null), param);
                        }
                        writer.dispose();
                    }
                    pdImage = JPEGFactory.createFromByteArray(doc, compressedOut.toByteArray());
                } else {
                    pdImage = LosslessFactory.createFromImage(doc, bi);
                }
                
                float imgWidth = pdImage.getWidth();
                float imgHeight = pdImage.getHeight();
                float scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
                float drawWidth = imgWidth * scale;
                float drawHeight = imgHeight * scale;
                float x = marginPoints + (availableWidth - drawWidth) / 2f;
                float y = marginPoints + (availableHeight - drawHeight) / 2f;
                
                try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                    contentStream.drawImage(pdImage, x, y, drawWidth, drawHeight);
                }
            }
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    // 2. Merge PDFs
    public byte[] mergePdfs(List<File> pdfFiles) throws Exception {
        logger.info("Merging {} PDF files", pdfFiles.size());
        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        merger.setDestinationStream(out);
        for (File file : pdfFiles) {
            merger.addSource(file);
        }
        merger.mergeDocuments(null);
        return out.toByteArray();
    }

    // 3. Split PDF
    public byte[] splitPdf(File pdfFile, String splitType, String pageRange) throws Exception {
        logger.info("Splitting PDF. Type: {}, Range: {}", splitType, pageRange);
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            List<Integer> pagesToExtract = parsePageRange(pageRange, totalPages, splitType);
            
            if (pagesToExtract.isEmpty()) {
                throw new IllegalArgumentException("No valid pages selected for splitting.");
            }
            
            ByteArrayOutputStream zipByteOut = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(zipByteOut)) {
                for (int pageIdx : pagesToExtract) {
                    try (PDDocument singlePageDoc = new PDDocument()) {
                        singlePageDoc.addPage(singlePageDoc.importPage(document.getPage(pageIdx)));
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        singlePageDoc.save(out);
                        
                        String entryName = "page_" + (pageIdx + 1) + ".pdf";
                        ZipEntry entry = new ZipEntry(entryName);
                        zos.putNextEntry(entry);
                        zos.write(out.toByteArray());
                        zos.closeEntry();
                    }
                }
            }
            return zipByteOut.toByteArray();
        }
    }

    // 4. PDF to Word
    public byte[] pdfToWord(File pdfFile) throws Exception {
        logger.info("Converting PDF to Word: {}", pdfFile.getName());
        try (PDDocument document = Loader.loadPDF(pdfFile);
             XWPFDocument doc = new XWPFDocument()) {
            
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            stripper.setSortByPosition(true);
            
            int totalPages = document.getNumberOfPages();
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                
                String[] lines = pageText.split("\n");
                XWPFParagraph p = doc.createParagraph();
                XWPFRun run = p.createRun();
                run.setFontFamily("Calibri");
                run.setFontSize(11);
                
                if (i > 1) {
                    p.setPageBreak(true);
                }
                
                for (String line : lines) {
                    if (line.trim().isEmpty()) {
                        p = doc.createParagraph();
                        run = p.createRun();
                        run.setFontFamily("Calibri");
                        run.setFontSize(11);
                    } else {
                        run.setText(line.trim());
                        run.addBreak();
                    }
                }
            }
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    // 5. Word to PDF
    public byte[] wordToPdf(File wordFile) throws Exception {
        logger.info("Converting Word to PDF: {}", wordFile.getName());
        try (XWPFDocument doc = new XWPFDocument(new FileInputStream(wordFile));
             PDDocument pdf = new PDDocument()) {
            
            PDPage page = new PDPage(PDRectangle.A4);
            pdf.addPage(page);
            
            float margin = 50;
            float yStart = PDRectangle.A4.getHeight() - margin;
            float yPosition = yStart;
            float width = PDRectangle.A4.getWidth() - 2 * margin;
            
            PDPageContentStream contentStream = new PDPageContentStream(pdf, page);
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
            contentStream.setLeading(14.5f);
            contentStream.newLineAtOffset(margin, yStart);
            
            for (XWPFParagraph para : doc.getParagraphs()) {
                String text = para.getText();
                if (text == null || text.trim().isEmpty()) {
                    yPosition -= 15;
                    contentStream.newLineAtOffset(0, -15);
                    continue;
                }
                
                List<String> lines = wrapText(text, width, new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                for (String line : lines) {
                    if (yPosition < margin + 20) {
                        contentStream.endText();
                        contentStream.close();
                        
                        page = new PDPage(PDRectangle.A4);
                        pdf.addPage(page);
                        
                        contentStream = new PDPageContentStream(pdf, page);
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                        contentStream.setLeading(14.5f);
                        contentStream.newLineAtOffset(margin, yStart);
                        yPosition = yStart;
                    }
                    
                    String safeLine = escapePdfString(line);
                    contentStream.showText(safeLine);
                    contentStream.newLine();
                    yPosition -= 14.5f;
                }
                
                yPosition -= 8;
                contentStream.newLineAtOffset(0, -8);
            }
            
            contentStream.endText();
            contentStream.close();
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            pdf.save(out);
            return out.toByteArray();
        }
    }

    // 6. PDF to Images
    public byte[] pdfToImages(File pdfFile, String format, String resolution) throws Exception {
        logger.info("Converting PDF to Images. Format: {}, Resolution: {}", format, resolution);
        int dpi = 150;
        if ("low".equalsIgnoreCase(resolution)) {
            dpi = 72;
        } else if ("high".equalsIgnoreCase(resolution)) {
            dpi = 300;
        }
        
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int totalPages = document.getNumberOfPages();
            
            ByteArrayOutputStream zipByteOut = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(zipByteOut)) {
                for (int i = 0; i < totalPages; i++) {
                    BufferedImage bim = renderer.renderImageWithDPI(i, dpi);
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    ImageIO.write(bim, format, out);
                    
                    String entryName = "page_" + (i + 1) + "." + format.toLowerCase();
                    ZipEntry entry = new ZipEntry(entryName);
                    zos.putNextEntry(entry);
                    zos.write(out.toByteArray());
                    zos.closeEntry();
                }
            }
            return zipByteOut.toByteArray();
        }
    }

    // 7. Compress PDF
    public byte[] compressPdf(File pdfFile, String compressionLevel) throws Exception {
        logger.info("Compressing PDF with level: {}", compressionLevel);
        float quality = 0.6f;
        if ("high".equalsIgnoreCase(compressionLevel)) {
            quality = 0.25f;
        } else if ("low".equalsIgnoreCase(compressionLevel)) {
            quality = 0.8f;
        }

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            for (PDPage page : document.getPages()) {
                PDResources resources = page.getResources();
                if (resources != null) {
                    compressResources(document, resources, quality);
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 8. Protect PDF
    public byte[] protectPdf(File pdfFile, String userPassword, String ownerPassword) throws Exception {
        logger.info("Encrypting PDF with password");
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            AccessPermission ap = new AccessPermission();
            StandardProtectionPolicy spp = new StandardProtectionPolicy(ownerPassword, userPassword, ap);
            spp.setEncryptionKeyLength(128);
            spp.setPermissions(ap);
            document.protect(spp);
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 9. Unlock PDF
    public byte[] unlockPdf(File pdfFile, String password) throws Exception {
        logger.info("Decrypting PDF");
        try (PDDocument document = Loader.loadPDF(pdfFile, password)) {
            document.setAllSecurityToBeRemoved(true);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 10. Add Watermark
    public byte[] addWatermark(File pdfFile, String watermarkText, File watermarkImageFile, float opacity, float rotation, String position, int fontSize, String colorHex) throws Exception {
        logger.info("Adding watermark to PDF");
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            Color color = Color.LIGHT_GRAY;
            if (colorHex != null && !colorHex.trim().isEmpty()) {
                try {
                    color = Color.decode(colorHex);
                } catch (Exception e) {
                    // fallback
                }
            }

            for (PDPage page : document.getPages()) {
                PDRectangle mediaBox = page.getMediaBox();
                float width = mediaBox.getWidth();
                float height = mediaBox.getHeight();

                try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    PDExtendedGraphicsState extGState = new PDExtendedGraphicsState();
                    extGState.setNonStrokingAlphaConstant(opacity);
                    extGState.setStrokingAlphaConstant(opacity);
                    contentStream.setGraphicsStateParameters(extGState);

                    if (watermarkImageFile != null && watermarkImageFile.exists()) {
                        BufferedImage img = ImageIO.read(watermarkImageFile);
                        if (img != null) {
                            PDImageXObject pdImage = LosslessFactory.createFromImage(document, img);
                            float imgW = pdImage.getWidth();
                            float imgH = pdImage.getHeight();
                            float scale = Math.min((width * 0.4f) / imgW, (height * 0.4f) / imgH);
                            float drawW = imgW * scale;
                            float drawH = imgH * scale;

                            float x = (width - drawW) / 2f;
                            float y = (height - drawH) / 2f;

                            if ("top-left".equalsIgnoreCase(position)) {
                                x = 50; y = height - drawH - 50;
                            } else if ("top-right".equalsIgnoreCase(position)) {
                                x = width - drawW - 50; y = height - drawH - 50;
                            } else if ("bottom-left".equalsIgnoreCase(position)) {
                                x = 50; y = 50;
                            } else if ("bottom-right".equalsIgnoreCase(position)) {
                                x = width - drawW - 50; y = 50;
                            }

                            contentStream.saveGraphicsState();
                            float rad = (float) Math.toRadians(rotation);
                            contentStream.transform(org.apache.pdfbox.util.Matrix.getRotateInstance(rad, x + drawW/2f, y + drawH/2f));
                            contentStream.drawImage(pdImage, -drawW/2f, -drawH/2f, drawW, drawH);
                            contentStream.restoreGraphicsState();
                        }
                    } else if (watermarkText != null && !watermarkText.trim().isEmpty()) {
                        contentStream.beginText();
                        contentStream.setFont(font, fontSize);
                        contentStream.setNonStrokingColor(color);

                        float x = width / 2f;
                        float y = height / 2f;
                        float textWidth = font.getStringWidth(watermarkText) / 1000f * fontSize;
                        float textHeight = fontSize * 0.7f;

                        if ("top-left".equalsIgnoreCase(position)) {
                            x = 50; y = height - 50;
                        } else if ("top-right".equalsIgnoreCase(position)) {
                            x = width - textWidth - 50; y = height - 50;
                        } else if ("bottom-left".equalsIgnoreCase(position)) {
                            x = 50; y = 50;
                        } else if ("bottom-right".equalsIgnoreCase(position)) {
                            x = width - textWidth - 50; y = 50;
                        }

                        float rad = (float) Math.toRadians(rotation);
                        contentStream.setTextMatrix(org.apache.pdfbox.util.Matrix.getRotateInstance(rad, x, y));
                        
                        if ("center".equalsIgnoreCase(position) || position == null || position.trim().isEmpty()) {
                            contentStream.newLineAtOffset(-textWidth/2f, -textHeight/2f);
                        }

                        contentStream.showText(watermarkText);
                        contentStream.endText();
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 11. Fill & Sign
    public byte[] fillAndSign(File pdfFile, File signatureImageFile, String typedSignatureText, int pageNum, float x, float y, float width, float height, String dateStr, List<Map<String, Object>> textFields) throws Exception {
        logger.info("Signing PDF. Page: {}, x: {}, y: {}", pageNum, x, y);
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int pageIndex = Math.max(0, pageNum - 1);
            if (pageIndex < document.getNumberOfPages()) {
                PDPage page = document.getPage(pageIndex);
                
                try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    if (signatureImageFile != null && signatureImageFile.exists()) {
                        BufferedImage signatureImg = ImageIO.read(signatureImageFile);
                        if (signatureImg != null) {
                            PDImageXObject pdImage = LosslessFactory.createFromImage(document, signatureImg);
                            contentStream.drawImage(pdImage, x, y, width, height);
                        }
                    } else if (typedSignatureText != null && !typedSignatureText.trim().isEmpty()) {
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.TIMES_ITALIC), 18);
                        contentStream.setNonStrokingColor(Color.BLUE);
                        contentStream.newLineAtOffset(x, y + 5);
                        contentStream.showText(typedSignatureText);
                        contentStream.endText();
                    }

                    if (dateStr != null && !dateStr.trim().isEmpty()) {
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                        contentStream.setNonStrokingColor(Color.BLACK);
                        contentStream.newLineAtOffset(x, y - 15);
                        contentStream.showText("Date: " + dateStr);
                        contentStream.endText();
                    }

                    if (textFields != null) {
                        for (Map<String, Object> field : textFields) {
                            String text = (String) field.get("text");
                            float fx = ((Number) field.get("x")).floatValue();
                            float fy = ((Number) field.get("y")).floatValue();
                            if (text != null && !text.trim().isEmpty()) {
                                contentStream.beginText();
                                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                                contentStream.setNonStrokingColor(Color.BLACK);
                                contentStream.newLineAtOffset(fx, fy);
                                contentStream.showText(text);
                                contentStream.endText();
                            }
                        }
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 12. Page Numbering
    public byte[] addPageNumbers(File pdfFile, String position, String fontName) throws Exception {
        logger.info("Adding page numbering. Position: {}, Font: {}", position, fontName);
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            if ("times".equalsIgnoreCase(fontName)) {
                font = new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN);
            } else if ("courier".equalsIgnoreCase(fontName)) {
                font = new PDType1Font(Standard14Fonts.FontName.COURIER);
            }
            
            int totalPages = document.getNumberOfPages();
            for (int i = 0; i < totalPages; i++) {
                PDPage page = document.getPage(i);
                PDRectangle mediaBox = page.getMediaBox();
                float width = mediaBox.getWidth();
                float height = mediaBox.getHeight();
                
                String text = (i + 1) + " of " + totalPages;
                int fontSize = 9;
                float textWidth = font.getStringWidth(text) / 1000f * fontSize;
                
                float x = width / 2f - textWidth / 2f;
                float y = 25;
                
                if ("top-center".equalsIgnoreCase(position)) {
                    x = width / 2f - textWidth / 2f;
                    y = height - 25;
                } else if ("top-left".equalsIgnoreCase(position)) {
                    x = 50;
                    y = height - 25;
                } else if ("top-right".equalsIgnoreCase(position)) {
                    x = width - textWidth - 50;
                    y = height - 25;
                } else if ("bottom-left".equalsIgnoreCase(position)) {
                    x = 50;
                    y = 25;
                } else if ("bottom-right".equalsIgnoreCase(position)) {
                    x = width - textWidth - 50;
                    y = 25;
                }
                
                try (PDPageContentStream contentStream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    contentStream.beginText();
                    contentStream.setFont(font, fontSize);
                    contentStream.setNonStrokingColor(Color.GRAY);
                    contentStream.newLineAtOffset(x, y);
                    contentStream.showText(text);
                    contentStream.endText();
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 13. Rotate PDF Pages
    public byte[] rotatePdfPages(File pdfFile, int rotationAngle, String pageRange) throws Exception {
        logger.info("Rotating pages by {} degrees. Range: {}", rotationAngle, pageRange);
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            List<Integer> pagesToRotate = parsePageRange(pageRange, totalPages, "custom");
            if (pageRange == null || pageRange.trim().isEmpty() || "all".equalsIgnoreCase(pageRange)) {
                pagesToRotate = new ArrayList<>();
                for (int i = 0; i < totalPages; i++) {
                    pagesToRotate.add(i);
                }
            }
            
            for (int pageIdx : pagesToRotate) {
                PDPage page = document.getPage(pageIdx);
                int currentRotation = page.getRotation();
                page.setRotation((currentRotation + rotationAngle) % 360);
            }
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 14. Remove Pages
    public byte[] removePdfPages(File pdfFile, String pageRange) throws Exception {
        logger.info("Removing pages: {}", pageRange);
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();
            List<Integer> pagesToRemove = parsePageRange(pageRange, totalPages, "custom");
            
            Collections.sort(pagesToRemove, Collections.reverseOrder());
            
            for (int pageIdx : pagesToRemove) {
                if (pageIdx >= 0 && pageIdx < document.getNumberOfPages()) {
                    document.removePage(pageIdx);
                }
            }
            
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    // 15. OCR
    public String performOcr(File file) throws Exception {
        logger.info("Performing OCR on: {}", file.getName());
        byte[] fileBytes = Files.readAllBytes(file.toPath());
        String mimeType = "image/png";
        String name = file.getName().toLowerCase();
        
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            mimeType = "image/jpeg";
        } else if (name.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(file)) {
                if (document.getNumberOfPages() > 0) {
                    PDFRenderer renderer = new PDFRenderer(document);
                    BufferedImage bim = renderer.renderImageWithDPI(0, 150);
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    ImageIO.write(bim, "png", out);
                    fileBytes = out.toByteArray();
                    mimeType = "image/png";
                } else {
                    throw new IllegalArgumentException("PDF file has no pages to extract text from");
                }
            }
        }
        
        String prompt = "Perform OCR on this image. Extract all readable text from the document exactly as it is shown. Do not summarize, do not write comments, and do not explain. Only output the extracted text in clean markdown or plain text format.";
        return aiService.generateContentWithImage(prompt, fileBytes, mimeType, null);
    }

    /* ── Helper utilities ── */
    
    private List<Integer> parsePageRange(String pageRange, int totalPages, String splitType) {
        List<Integer> pages = new ArrayList<>();
        if ("odd".equalsIgnoreCase(splitType)) {
            for (int i = 0; i < totalPages; i += 2) {
                pages.add(i);
            }
        } else if ("even".equalsIgnoreCase(splitType)) {
            for (int i = 1; i < totalPages; i += 2) {
                pages.add(i);
            }
        } else if ("every".equalsIgnoreCase(splitType)) {
            for (int i = 0; i < totalPages; i++) {
                pages.add(i);
            }
        } else {
            if (pageRange != null && !pageRange.trim().isEmpty()) {
                String[] parts = pageRange.split(",");
                for (String part : parts) {
                    part = part.trim();
                    if (part.contains("-")) {
                        String[] range = part.split("-");
                        if (range.length == 2) {
                            try {
                                int start = Math.max(1, Integer.parseInt(range[0].trim())) - 1;
                                int end = Math.min(totalPages, Integer.parseInt(range[1].trim())) - 1;
                                for (int i = start; i <= end; i++) {
                                    if (!pages.contains(i)) pages.add(i);
                                }
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    } else {
                        try {
                            int pageNum = Integer.parseInt(part) - 1;
                            if (pageNum >= 0 && pageNum < totalPages) {
                                if (!pages.contains(pageNum)) pages.add(pageNum);
                            }
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                    }
                }
            }
        }
        return pages;
    }

    private List<String> wrapText(String text, float width, PDType1Font font, int fontSize) throws IOException {
        List<String> result = new ArrayList<>();
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();
        
        for (String word : words) {
            String testLine = currentLine.length() == 0 ? word : currentLine + " " + word;
            float size = fontSize * font.getStringWidth(testLine) / 1000f;
            if (size > width) {
                if (currentLine.length() > 0) {
                    result.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    result.add(word);
                }
            } else {
                currentLine.append(currentLine.length() == 0 ? "" : " ").append(word);
            }
        }
        if (currentLine.length() > 0) {
            result.add(currentLine.toString());
        }
        return result;
    }

    private String escapePdfString(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 32 && c <= 126) {
                sb.append(c);
            } else if (c >= 128 && c <= 255) {
                sb.append(c);
            } else if (c == '\t') {
                sb.append("    ");
            } else {
                sb.append(" ");
            }
        }
        return sb.toString();
    }

    private void compressResources(PDDocument doc, PDResources resources, float quality) throws IOException {
        for (COSName name : resources.getXObjectNames()) {
            if (resources.isImageXObject(name)) {
                PDImageXObject image = (PDImageXObject) resources.getXObject(name);
                try {
                    BufferedImage bi = image.getImage();
                    if (bi != null) {
                        ByteArrayOutputStream compressedStream = new ByteArrayOutputStream();
                        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
                        if (writers.hasNext()) {
                            ImageWriter writer = writers.next();
                            try (ImageOutputStream ios = ImageIO.createImageOutputStream(compressedStream)) {
                                writer.setOutput(ios);
                                ImageWriteParam param = writer.getDefaultWriteParam();
                                if (param.canWriteCompressed()) {
                                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                                    param.setCompressionType("JPEG");
                                    param.setCompressionQuality(quality);
                                }
                                writer.write(null, new IIOImage(bi, null, null), param);
                            } finally {
                                writer.dispose();
                            }
                            
                            byte[] compressedBytes = compressedStream.toByteArray();
                            if (compressedBytes.length < image.getStream().getCOSObject().getLength()) {
                                PDImageXObject newImage = JPEGFactory.createFromByteArray(doc, compressedBytes);
                                resources.put(name, newImage);
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Skipping image resource compression due to error: {}", e.getMessage());
                }
            }
        }
    }
}
