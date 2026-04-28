package com.ecommerce.controller;

import com.ecommerce.dto.request.PaymentVerifyRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.createRazorpayOrder(orderId)));
    }

    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        paymentService.verifyPayment(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature(),
                Long.parseLong(request.getOrderId()));
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", "PAID"));
    }
}
