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
        String language = request.getLanguage() != null ? request.getLanguage().toLowerCase() : "java";
        
        File tempDir = null;
        try {
            // Create a unique temporary directory
            String uniqueID = UUID.randomUUID().toString();
            Path tempDirPath = Paths.get(System.getProperty("java.io.tmpdir"), "devvault-compiler", uniqueID);
            tempDir = Files.createDirectories(tempDirPath).toFile();
            
            if (language.equals("java")) {
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

            } else if (language.equals("python") || language.equals("python3") || language.equals("py")) {
                File sourceFile = new File(tempDir, "Main.py");
                Files.writeString(sourceFile.toPath(), code);

                Process runProcess;
                try {
                    ProcessBuilder pb = new ProcessBuilder("python", "Main.py");
                    pb.directory(tempDir);
                    runProcess = pb.start();
                } catch (java.io.IOException e) {
                    ProcessBuilder pb = new ProcessBuilder("python3", "Main.py");
                    pb.directory(tempDir);
                    runProcess = pb.start();
                }

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

            } else if (language.equals("javascript") || language.equals("js") || language.equals("node") || language.equals("nodejs")) {
                File sourceFile = new File(tempDir, "Main.js");
                Files.writeString(sourceFile.toPath(), code);

                ProcessBuilder pb = new ProcessBuilder("node", "Main.js");
                pb.directory(tempDir);
                Process runProcess = pb.start();

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
            } else {
                return new CompileResponse("", "Unsupported language: " + language, false);
            }

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
