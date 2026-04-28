package com.ecommerce.service;

import com.ecommerce.entity.EmailOtp;
import com.ecommerce.exception.OtpException;
import com.ecommerce.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private final EmailOtpRepository otpRepository;
    private final EmailService emailService;

    @Transactional
    public void generateAndSend(String email, String name) {
        // Rate limit: check if an OTP was sent in the last minute
        Optional<EmailOtp> existing = otpRepository.findTopByEmailOrderByIdDesc(email);
        if (existing.isPresent() && !existing.get().isUsed()) {
            LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(1);
            if (existing.get().getExpiresAt().isAfter(oneMinuteAgo.plusMinutes(OTP_EXPIRY_MINUTES - 1))) {
                throw new OtpException("Please wait 1 minute before requesting a new OTP.");
            }
        }

        // Invalidate previous OTPs
        otpRepository.deleteByEmail(email);

        String otp = String.format("%06d", new Random().nextInt(999999));
        String otpHash = hashOtp(otp);

        EmailOtp emailOtp = EmailOtp.builder()
                .email(email)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .attempts(0)
                .used(false)
                .build();
        otpRepository.save(emailOtp);

        emailService.sendOtp(email, otp);
        log.info("OTP generated and sent for {}", email);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        EmailOtp emailOtp = otpRepository.findTopByEmailOrderByIdDesc(email)
                .orElseThrow(() -> new OtpException("No OTP found for this email. Please register again."));

        if (emailOtp.isUsed()) {
            throw new OtpException("OTP has already been used.");
        }
        if (emailOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new OtpException("OTP has expired. Please request a new one.");
        }
        if (emailOtp.getAttempts() >= MAX_ATTEMPTS) {
            throw new OtpException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        emailOtp.setAttempts(emailOtp.getAttempts() + 1);

        String inputHash = hashOtp(otp);
        if (!inputHash.equals(emailOtp.getOtpHash())) {
            otpRepository.save(emailOtp);
            int remaining = MAX_ATTEMPTS - emailOtp.getAttempts();
            throw new OtpException("Invalid OTP. " + remaining + " attempts remaining.");
        }

        emailOtp.setUsed(true);
        otpRepository.save(emailOtp);
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hash algorithm not available", e);
        }
    }
}
