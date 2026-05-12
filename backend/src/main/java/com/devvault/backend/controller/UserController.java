package com.devvault.backend.controller;

import com.devvault.backend.entity.User;
import com.devvault.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.devvault.backend.jwt.JwtUtil;
import org.springframework.web.bind.annotation.RequestMethod;


import java.util.List;
@CrossOrigin(
    origins = {
        "http://localhost:3000",
        "https://dev-vault-git-main-harsha-mes-projects.vercel.app"
    },
    allowedHeaders = "*",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE
    }
)
@RestController

public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    

    @PostMapping("/signup")
    public User signup(@RequestBody User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }
    @PostMapping("/login")
public String login(@RequestBody User user) {

    User existingUser = userRepository.findByEmail(user.getEmail());

    if (existingUser == null) {
        return "User Not Found";
    }
    
    if (passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {

    String token = JwtUtil.generateToken(existingUser.getEmail());

    return token;

} else {

    return "Invalid Password";
}

}
@GetMapping("/users")
public List<User> getAllUsers() {

    return userRepository.findAll();
}
}
