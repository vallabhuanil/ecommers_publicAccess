package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(String email) {
        User user = getUser(email);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        User user = getUser(email);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> createCart(user));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getStock());
        }

        cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .ifPresentOrElse(
                    item -> item.setQuantity(item.getQuantity() + request.getQuantity()),
                    () -> cart.getItems().add(CartItem.builder()
                            .cart(cart).product(product).quantity(request.getQuantity()).build())
                );

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItem(String email, Long productId, Integer quantity) {
        User user = getUser(email);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not in cart"));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return toResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    @Transactional
    public CartResponse removeItem(String email, Long productId) {
        User user = getUser(email);
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        cartItemRepository.deleteByCartIdAndProductId(cart.getId(), productId);
        return toResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    public Cart getCartEntity(Long userId) {
        return cartRepository.findByUserId(userId).orElse(null);
    }

    private Cart createCart(User user) {
        return cartRepository.save(Cart.builder().user(user).build());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream().map(i -> {
            BigDecimal subtotal = i.getProduct().getPrice()
                    .multiply(BigDecimal.valueOf(i.getQuantity()));
            return CartItemResponse.builder()
                    .id(i.getId())
                    .productId(i.getProduct().getId())
                    .productName(i.getProduct().getName())
                    .imageUrl(i.getProduct().getImageUrl())
                    .price(i.getProduct().getPrice())
                    .quantity(i.getQuantity())
                    .subtotal(subtotal)
                    .build();
        }).toList();

        BigDecimal total = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(items)
                .total(total)
                .itemCount(items.size())
                .build();
    }
}
