package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterInitRequest;
import com.ecommerce.dto.request.VerifyOtpRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Temporary storage for pending registrations (use Redis in production scale)
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    // Pending registrations: email -> RegisterInitRequest
    private final ConcurrentHashMap<String, RegisterInitRequest> pendingRegistrations = new ConcurrentHashMap<>();

    @Transactional
    public void registerInit(RegisterInitRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered. Please login.");
        }
        pendingRegistrations.put(request.getEmail(), request);
        otpService.generateAndSend(request.getEmail(), request.getName());
        log.info("Registration initiated for {}", request.getEmail());
    }

    @Transactional
    public AuthResponse verifyAndRegister(VerifyOtpRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());

        RegisterInitRequest pending = pendingRegistrations.remove(request.getEmail());
        if (pending == null) {
            throw new BadRequestException("Registration session expired. Please register again.");
        }

        // Double-check (race condition guard)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered.");
        }

        User user = User.builder()
                .name(pending.getName())
                .email(pending.getEmail())
                .password(passwordEncoder.encode(pending.getPassword()))
                .role(Role.USER)
                .verified(true)
                .build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        log.info("User registered: {}", user.getEmail());
        return buildAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        if (!user.isVerified()) {
            throw new BadRequestException("Email not verified. Please complete OTP verification.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
