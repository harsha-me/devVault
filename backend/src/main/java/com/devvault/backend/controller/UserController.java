package com.devvault.backend.controller;

import com.devvault.backend.entity.User;
import com.devvault.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.devvault.backend.jwt.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    public List<User> getAllUsers() {
        logger.info("Fetching all users");
        try {
            return userRepository.findAll();
        } catch (Exception e) {
            logger.error("Error fetching users: ", e);
            throw e;
        }
    }
}
