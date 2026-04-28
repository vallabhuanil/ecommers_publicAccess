package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank private String addressLine;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank private String zipCode;
}
