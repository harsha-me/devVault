package com.devvault.backend.controller;

import com.devvault.backend.dto.CompileRequest;
import com.devvault.backend.dto.CompileResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@CrossOrigin(origins = "*") // Allow frontend requests
public class CompilerController {

    @PostMapping("/compile")
    public CompileResponse compileAndRun(@RequestBody CompileRequest request) {
        String code = request.getCode();
        
        // Default to a simple wrap if they just wrote code without a class
        if (!code.contains("public class Main")) {
             // Let the user handle it, as agreed in the plan, but if it's completely raw maybe provide a hint in error.
             // But actually, we expect the frontend editor to have boilerplate.
        }

        File tempDir = null;
        try {
            // Create a unique temporary directory
            String uniqueID = UUID.randomUUID().toString();
            Path tempDirPath = Paths.get(System.getProperty("java.io.tmpdir"), "devvault-compiler", uniqueID);
            tempDir = Files.createDirectories(tempDirPath).toFile();
            
            File sourceFile = new File(tempDir, "Main.java");
            Files.writeString(sourceFile.toPath(), code);

            // Compile the Java code
            ProcessBuilder compilePb = new ProcessBuilder("javac", "Main.java");
            compilePb.directory(tempDir);
            Process compileProcess = compilePb.start();
            
            boolean compiledInTime = compileProcess.waitFor(10, TimeUnit.SECONDS);
            if (!compiledInTime) {
                compileProcess.destroy();
                return new CompileResponse("", "Compilation timed out.", false);
            }

            if (compileProcess.exitValue() != 0) {
                // Compilation failed
                String error = readStream(compileProcess.getErrorStream());
                return new CompileResponse("", error, false);
            }

            // Run the compiled code
            ProcessBuilder runPb = new ProcessBuilder("java", "Main");
            runPb.directory(tempDir);
            Process runProcess = runPb.start();
            
            boolean runInTime = runProcess.waitFor(10, TimeUnit.SECONDS);
            if (!runInTime) {
                runProcess.destroy();
                return new CompileResponse("", "Execution timed out.", false);
            }

            String output = readStream(runProcess.getInputStream());
            String error = readStream(runProcess.getErrorStream());

            if (runProcess.exitValue() != 0) {
                return new CompileResponse(output, error, false);
            }

            return new CompileResponse(output, "", true);

        } catch (Exception e) {
            e.printStackTrace();
            return new CompileResponse("", "Internal server error: " + e.getMessage(), false);
        } finally {
            // Clean up the directory
            if (tempDir != null && tempDir.exists()) {
                deleteDirectory(tempDir);
            }
        }
    }

    private String readStream(java.io.InputStream stream) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        return sb.toString();
    }

    private void deleteDirectory(File directoryToBeDeleted) {
        File[] allContents = directoryToBeDeleted.listFiles();
        if (allContents != null) {
            for (File file : allContents) {
                deleteDirectory(file);
            }
        }
        directoryToBeDeleted.delete();
    }
}
