package com.ecommerce.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private BigDecimal totalAmount;
    private String status;
    private String paymentId;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
