package com.devvault.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class DatabaseSchemaConfig implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSchemaConfig.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Running custom database migrations to ensure note columns are LONGTEXT...");
        try {
            jdbcTemplate.execute("ALTER TABLE note MODIFY COLUMN content LONGTEXT");
            logger.info("Successfully altered note table column 'content' to LONGTEXT");
        } catch (Exception e) {
            logger.warn("Could not alter note.content column: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE shared_note MODIFY COLUMN content LONGTEXT");
            logger.info("Successfully altered shared_note table column 'content' to LONGTEXT");
        } catch (Exception e) {
            logger.warn("Could not alter shared_note.content column: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS note_tags (" +
                    "note_id BIGINT NOT NULL," +
                    "tag VARCHAR(255) NOT NULL," +
                    "PRIMARY KEY (note_id, tag)," +
                    "FOREIGN KEY (note_id) REFERENCES note(id) ON DELETE CASCADE" +
                    ")");
            logger.info("Successfully ensured note_tags table exists");
        } catch (Exception e) {
            logger.warn("Could not create note_tags table: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS workspace (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "name VARCHAR(255) NOT NULL," +
                    "description VARCHAR(1000)," +
                    "owner_email VARCHAR(255) NOT NULL," +
                    "created_at DATE NOT NULL" +
                    ")");
            logger.info("Successfully ensured workspace table exists");
        } catch (Exception e) {
            logger.warn("Could not create workspace table: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS workspace_member (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "workspace_id BIGINT NOT NULL," +
                    "member_email VARCHAR(255) NOT NULL," +
                    "role VARCHAR(50) NOT NULL," +
                    "FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE" +
                    ")");
            logger.info("Successfully ensured workspace_member table exists");
        } catch (Exception e) {
            logger.warn("Could not create workspace_member table: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE note ADD COLUMN workspace_id BIGINT");
            logger.info("Successfully added workspace_id column to note table");
        } catch (Exception e) {
            logger.info("Note.workspace_id column already exists: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS document_history (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                    "email VARCHAR(255) NOT NULL," +
                    "operation VARCHAR(100) NOT NULL," +
                    "input_file_name VARCHAR(255)," +
                    "output_file_name VARCHAR(255)," +
                    "storage_path VARCHAR(255) NOT NULL," +
                    "date DATE NOT NULL," +
                    "time TIME NOT NULL," +
                    "file_size BIGINT NOT NULL," +
                    "processing_time_ms BIGINT NOT NULL," +
                    "status VARCHAR(50) NOT NULL" +
                    ")");
            logger.info("Successfully ensured document_history table exists");
        } catch (Exception e) {
            logger.warn("Could not create document_history table: {}", e.getMessage());
        }
    }
}
