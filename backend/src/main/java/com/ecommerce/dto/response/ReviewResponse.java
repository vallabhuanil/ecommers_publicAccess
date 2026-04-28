package com.ecommerce.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long productId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
