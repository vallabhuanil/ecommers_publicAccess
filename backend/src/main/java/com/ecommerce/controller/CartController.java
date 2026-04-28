package com.ecommerce.controller;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(user.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Item added", cartService.addItem(user.getUsername(), request)));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
                cartService.updateItem(user.getUsername(), productId, quantity)));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success("Item removed",
                cartService.removeItem(user.getUsername(), productId)));
    }
}
