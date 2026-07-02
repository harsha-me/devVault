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
                    "FOREIGN KEY (note_id) REFERENCES note(id) ON DELETE CASCADE" +
                    ")");
            logger.info("Successfully ensured note_tags table exists");
        } catch (Exception e) {
            logger.warn("Could not create note_tags table: {}", e.getMessage());
        }
    }
}
