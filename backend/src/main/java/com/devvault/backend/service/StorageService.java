package com.devvault.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class StorageService {

    private static final Logger logger = LoggerFactory.getLogger(StorageService.class);
    private final Path storageDirectory = Paths.get("document-storage").toAbsolutePath();

    @PostConstruct
    public void init() {
        try {
            if (!Files.exists(storageDirectory)) {
                Files.createDirectories(storageDirectory);
                logger.info("Created document storage directory at: {}", storageDirectory);
            }
        } catch (IOException e) {
            logger.error("Could not initialize storage directory", e);
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    public File saveTemporaryFile(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String suffix = ".tmp";
        String prefix = "upload-";
        if (originalName != null) {
            int dotIdx = originalName.lastIndexOf('.');
            if (dotIdx > 0) {
                suffix = originalName.substring(dotIdx);
                prefix = originalName.substring(0, dotIdx) + "-";
            }
        }
        if (prefix.length() < 3) {
            prefix = "file-" + prefix;
        }
        File tempFile = File.createTempFile(prefix, suffix);
        file.transferTo(tempFile);
        logger.debug("Saved temporary upload file to: {}", tempFile.getAbsolutePath());
        return tempFile;
    }

    public void deleteTemporaryFile(File file) {
        if (file != null && file.exists()) {
            boolean deleted = file.delete();
            if (deleted) {
                logger.debug("Successfully deleted temporary file: {}", file.getAbsolutePath());
            } else {
                logger.warn("Failed to delete temporary file: {}", file.getAbsolutePath());
            }
        }
    }

    public String saveOutputFile(byte[] data, String originalName) throws IOException {
        String uuid = UUID.randomUUID().toString();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storageFilename = uuid + extension;
        Path targetPath = storageDirectory.resolve(storageFilename);
        Files.write(targetPath, data);
        logger.info("Saved output file {} to: {}", storageFilename, targetPath);
        return storageFilename;
    }

    public byte[] loadOutputFile(String storagePath) throws IOException {
        Path targetPath = storageDirectory.resolve(storagePath);
        if (!Files.exists(targetPath)) {
            logger.error("Requested file does not exist in storage: {}", storagePath);
            throw new IOException("File not found in storage");
        }
        return Files.readAllBytes(targetPath);
    }

    public void deleteOutputFile(String storagePath) {
        try {
            Path targetPath = storageDirectory.resolve(storagePath);
            if (Files.exists(targetPath)) {
                Files.delete(targetPath);
                logger.info("Deleted output file: {}", storagePath);
            }
        } catch (IOException e) {
            logger.error("Could not delete output file: {}", storagePath, e);
        }
    }
}
