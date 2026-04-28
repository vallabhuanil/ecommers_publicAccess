package com.ecommerce.service;

import com.ecommerce.dto.response.OrderItemResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.OrderCancellationException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final ProductRepository productRepository;

    @Transactional
    public OrderResponse placeOrder(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartService.getCartEntity(user.getId());
        if (cart == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (product.getStock() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for: " + product.getName());
            }
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(product.getPrice())  // snapshot
                    .build();
            order.getItems().add(item);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);

        cartService.clearCart(cart);
        log.info("Order placed: {} for user: {}", saved.getId(), email);
        return toResponse(saved);
    }

    public List<OrderResponse> getMyOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public Page<OrderResponse> getAllOrders(int page, int size) {
        return orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order not found");
        }

        OrderStatus status = order.getStatus();
        if (status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED || status == OrderStatus.CANCELLED) {
            throw new OrderCancellationException(
                "Cannot cancel order with status: " + status + ". Only PENDING or PAID orders can be cancelled.");
        }

        // Restore stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        log.info("Order {} cancelled by {}", orderId, email);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public void updatePaymentInfo(Long orderId, String paymentId, String paymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setPaymentId(paymentId);
        order.setPaymentStatus(paymentStatus);
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream().map(i ->
            OrderItemResponse.builder()
                .id(i.getId())
                .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                .productName(i.getProduct() != null ? i.getProduct().getName() : "Deleted Product")
                .imageUrl(i.getProduct() != null ? i.getProduct().getImageUrl() : null)
                .quantity(i.getQuantity())
                .price(i.getPrice())
                .subtotal(i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .build()
        ).toList();

        return OrderResponse.builder()
                .id(o.getId())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus().name())
                .paymentId(o.getPaymentId())
                .paymentStatus(o.getPaymentStatus())
                .createdAt(o.getCreatedAt())
                .items(items)
                .build();
    }
}
