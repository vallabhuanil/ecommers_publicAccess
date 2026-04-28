package com.ecommerce.controller;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterInitRequest;
import com.ecommerce.dto.request.VerifyOtpRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/init")
    public ResponseEntity<ApiResponse<String>> registerInit(@Valid @RequestBody RegisterInitRequest request) {
        authService.registerInit(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to " + request.getEmail(), "OTP_SENT"));
    }

    @PostMapping("/register/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse auth = authService.verifyAndRegister(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", auth));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse auth = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", auth));
    }
}
