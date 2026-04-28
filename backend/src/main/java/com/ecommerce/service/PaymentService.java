package com.ecommerce.service;

import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public Map<String, Object> createRazorpayOrder(Long orderId) {
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject req = new JSONObject();
            // Amount in paise (multiply by 100)
            long amountInPaise = order.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100)).longValue();
            req.put("amount", amountInPaise);
            req.put("currency", "INR");
            req.put("receipt", "order_" + orderId);

            com.razorpay.Order rzpOrder = client.orders.create(req);
            log.info("Razorpay order created: {}", rzpOrder.get("id").toString());

            return Map.of(
                "razorpayOrderId", (String) rzpOrder.get("id"),
                "amount", amountInPaise,
                "currency", "INR",
                "keyId", keyId,
                "orderId", orderId
            );
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed", e);
            throw new RuntimeException("Payment gateway error: " + e.getMessage());
        }
    }

    public void verifyPayment(String razorpayOrderId, String razorpayPaymentId,
                              String razorpaySignature, Long orderId) {
        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        String generated = hmacSha256(keySecret, payload);

        if (!generated.equals(razorpaySignature)) {
            throw new BadRequestException("Payment verification failed. Invalid signature.");
        }

        orderService.updatePaymentInfo(orderId, razorpayPaymentId, "PAID");
        log.info("Payment verified for order: {}", orderId);
    }

    private String hmacSha256(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
