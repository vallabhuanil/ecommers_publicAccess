package com.ecommerce.controller;

import com.ecommerce.dto.request.AddressRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.entity.Address;
import com.ecommerce.entity.User;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.AddressRepository;
import com.ecommerce.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Address>>> getAddresses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(addressRepository.findByUserId(user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Address>> addAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddressRequest request) {
        User user = getUser(userDetails.getUsername());
        Address address = Address.builder()
                .user(user)
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Address added", addressRepository.save(address)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        User user = getUser(userDetails.getUsername());
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Address not found");
        }
        addressRepository.delete(address);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
