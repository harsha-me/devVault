package com.devvault.backend.controller;

import com.devvault.backend.entity.User;
import com.devvault.backend.dto.UserSummary;
import com.devvault.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.devvault.backend.jwt.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    
    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        logger.info("Signup request for email: {}", user.getEmail());
        try {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userRepository.save(user);
            logger.info("User created successfully: {}", user.getEmail());
            return savedUser;
        } catch (Exception e) {
            logger.error("Error during signup: ", e);
            throw e;
        }
    }

    @PostMapping("/login")
    public String login(@RequestBody User user) {
        logger.info("Login request for email: {}", user.getEmail());
        try {
            User existingUser = userRepository.findByEmail(user.getEmail());

            if (existingUser == null) {
                logger.warn("User not found: {}", user.getEmail());
                return "User Not Found";
            }
            
            if (passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
                String token = JwtUtil.generateToken(existingUser.getEmail());
                logger.info("Login successful for: {}", user.getEmail());
                return token;
            } else {
                logger.warn("Invalid password for user: {}", user.getEmail());
                return "Invalid Password";
            }
        } catch (Exception e) {
            logger.error("Error during login: ", e);
            throw e;
        }
    }

    @GetMapping("/users")
    public List<UserSummary> getAllUsers() {
        logger.info("Fetching all users");
        try {
            return userRepository.findAllProjectedBy();
        } catch (Exception e) {
            logger.error("Error fetching users: ", e);
            throw e;
        }
    }

    @PutMapping("/updateProfile/{email}")
    public ResponseEntity<?> updateProfile(@PathVariable String email, @RequestBody java.util.Map<String, String> body) {
        logger.info("Update profile request for email: {}", email);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        String newName = body.get("name");
        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
        }
        String profilePicture = body.get("profilePicture");
        if (profilePicture != null) {
            user.setProfilePicture(profilePicture);
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/changePassword/{email}")
    public ResponseEntity<?> changePassword(@PathVariable String email, @RequestBody java.util.Map<String, String> body) {
        logger.info("Change password request for email: {}", email);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password fields cannot be empty");
        }
        if (passwordEncoder.matches(oldPassword, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully"));
        } else {
            return ResponseEntity.badRequest().body("Incorrect old password");
        }
    }
}
