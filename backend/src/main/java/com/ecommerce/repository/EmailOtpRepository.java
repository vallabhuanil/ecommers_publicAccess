package com.ecommerce.repository;

import com.ecommerce.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailOrderByIdDesc(String email);
    void deleteByEmail(String email);
}
